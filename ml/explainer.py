"""
Scholarship Sathi — LLM Explanation Module
===========================================
Module : ml/explainer.py
Run    : python ml/explainer.py   (from project root, for a demo)

Purpose
-------
Given one scholarship record and one student profile, generate a short
plain-language explanation of:
  1. Why the student is a good match for this scholarship
  2. What the benefit is
  3. How to apply

PRD rules (Objective O4)
--------------------------
- Use ONLY the dataset record and the profile (no invented facts)
- 9–10 second timeout on the LLM call
- Return a ready-made template if the LLM fails for any reason
- Cache the explanation so the same record+profile pair is not called twice
- Zero invented facts (the prompt is carefully constrained)

LLM provider setup
-------------------
Automatically loads GEMINI_API_KEY from the project root `.env` file
(or environment variable). If no key is set or the network is unavailable,
the module falls back to the template explanation automatically.
"""

import os
import json
import hashlib
import textwrap
import urllib.request
import urllib.error
import pandas as pd

# ---------------------------------------------------------------------------
# Auto-load .env from project root so GEMINI_API_KEY works out of the box
# ---------------------------------------------------------------------------
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_ENV_PATH = os.path.join(_PROJECT_ROOT, ".env")

if os.path.exists(_ENV_PATH):
    try:
        with open(_ENV_PATH, "r", encoding="utf-8") as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _k, _v = _line.split("=", 1)
                    _k = _k.strip()
                    _v = _v.strip().strip('"').strip("'")
                    if _k and _k not in os.environ:
                        os.environ[_k] = _v
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Simple in-memory cache  {hash → explanation string}
# ---------------------------------------------------------------------------
_EXPLANATION_CACHE: dict[str, str] = {}


# ---------------------------------------------------------------------------
# Template fallback
# ---------------------------------------------------------------------------

def template_explanation(scholarship: dict, student: dict) -> str:
    """
    Return a formatted plain-language explanation built entirely from
    the scholarship record and student profile — no LLM needed.

    This is the guaranteed fallback that is always returned when:
    - No API key is configured
    - The LLM call times out
    - The LLM call raises any exception
    - The LLM returns an empty response
    """
    name            = scholarship.get("name", "This scholarship")
    course          = scholarship.get("course", "")
    benefit         = scholarship.get("benefit", "")
    benefit_amount  = scholarship.get("benefit amount", "")
    deadline        = scholarship.get("application deadline", "")
    doc_required    = scholarship.get("doc required", "")
    gender          = scholarship.get("gender", "Any gender")
    caste           = scholarship.get("caste", "")
    states          = scholarship.get("eligible states", "")
    income_limit    = scholarship.get("income limit", "")

    lines = []
    lines.append(f"**{name}**")
    lines.append("")

    # Match reason
    match_reason = []
    if course and str(course).strip():
        match_reason.append(f"it supports {course} students")
    if gender and "any" in str(gender).lower():
        match_reason.append("it is open to all genders")
    elif gender:
        match_reason.append(f"it is available for {gender} students")

    caste_clean = "" if pd.isna(caste) else str(caste).strip()
    if not caste_clean:
        match_reason.append("no caste restriction applies")
    else:
        match_reason.append(f"it is available for {caste_clean} category students")

    if match_reason:
        lines.append("**Why this matches your profile:** " + "; ".join(match_reason) + ".")
    else:
        lines.append("**Why this matches your profile:** This scholarship aligns with your academic profile.")

    # Benefit
    if benefit_amount and str(benefit_amount).strip() not in ("", "nan", "None"):
        lines.append(f"**Benefit:** ₹{benefit_amount} — {benefit}" if benefit else f"**Benefit:** ₹{benefit_amount}.")
    elif benefit:
        lines.append(f"**Benefit:** {benefit}.")

    # Eligibility notes
    elig_notes = []
    if income_limit and str(income_limit).strip() not in ("", "nan", "None", "Not specified"):
        elig_notes.append(f"family income limit: ₹{income_limit}")
    if states and str(states).strip() not in ("", "nan", "None"):
        elig_notes.append(f"eligible states: {states}")
    if elig_notes:
        lines.append("**Eligibility note:** " + "; ".join(elig_notes) + ".")

    # Documents
    if doc_required and str(doc_required).strip():
        lines.append(f"**Documents required:** {doc_required}.")

    # Deadline
    if deadline and str(deadline).strip():
        lines.append(f"**Application deadline:** {deadline}.")

    lines.append("")
    lines.append(
        "_This explanation is generated from the official scholarship record. "
        "Always verify details on the official portal before applying._"
    )

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Cache key
# ---------------------------------------------------------------------------

def _cache_key(scholarship: dict, student: dict) -> str:
    """Create a stable hash key from scholarship name + student profile."""
    raw = str(scholarship.get("name", "")) + "|" + str(sorted(student.items()))
    return hashlib.md5(raw.encode()).hexdigest()


# ---------------------------------------------------------------------------
# LLM explanation (Google Gemini API)
# ---------------------------------------------------------------------------

def _build_prompt(scholarship: dict, student: dict) -> str:
    """
    Build a tightly constrained prompt that gives the LLM only the
    scholarship record and profile — nothing else.

    The prompt explicitly forbids the model from inventing facts.
    """
    prompt = textwrap.dedent(f"""
    You are a helpful assistant for Indian students looking for scholarships.
    Write a short, friendly explanation (3–5 sentences) for the student below.

    STUDENT PROFILE:
    - Course: {student.get('course', 'Not specified')}
    - Category/Caste: {student.get('category', 'Not specified')}
    - State: {student.get('state', 'Not specified')}
    - Gender: {student.get('gender', 'Not specified')}
    - Annual family income: ₹{student.get('annual_income', 'Not specified')}
    - Academic marks: {student.get('marks', 'Not specified')}%

    SCHOLARSHIP RECORD (use ONLY these facts, do not invent any):
    - Name: {scholarship.get('name', 'N/A')}
    - Course eligible: {scholarship.get('course', 'N/A')}
    - Benefit: {scholarship.get('benefit', 'N/A')}
    - Benefit amount: ₹{scholarship.get('benefit amount', 'N/A')}
    - Eligible states: {scholarship.get('eligible states', 'N/A')}
    - Caste/Category: {scholarship.get('caste', 'Open to all')}
    - Gender: {scholarship.get('gender', 'Any gender')}
    - Income limit: ₹{scholarship.get('income limit', 'N/A')}
    - Documents required: {scholarship.get('doc required', 'N/A')}
    - Application deadline: {scholarship.get('application deadline', 'N/A')}

    INSTRUCTIONS:
    1. Explain why this scholarship matches the student's profile.
    2. Briefly describe the benefit.
    3. Mention the application deadline if available.
    4. Do NOT invent any facts not in the record above.
    5. Do NOT mention eligibility decisions — only describe the match.
    6. Write in plain, simple English suitable for a first-year student.
    7. Keep the response under 100 words.
    """).strip()
    return prompt


def _call_gemini(prompt: str, timeout_seconds: int = 9) -> str:
    """
    Call the Google Gemini REST API with the given prompt and a strict
    9-second timeout (thread-safe across both CLI scripts and FastAPI).
    Returns the generated text, or raises an exception on failure.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable not set.")

    models = ["gemini-3.1-flash-lite-preview", "gemini-3-flash-preview", "gemma-4-26b-a4b-it"]
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}]
    }).encode("utf-8")

    last_error = None
    for model_name in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    text = "".join(p.get("text", "") for p in parts).strip()
                    if text:
                        return text
        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"Gemini API call failed: {last_error}")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_explanation(scholarship: pd.Series | dict, student: dict) -> dict:
    """
    Return a plain-language explanation for a scholarship + student pair.

    Parameters
    ----------
    scholarship : pd.Series or dict
        One scholarship record — a row from the DataFrame, or a plain dict.
    student : dict
        Student profile dict (same format as the recommender).

    Returns
    -------
    dict with keys:
        "explanation" : str   — the explanation text
        "source"      : str   — "llm" | "template" | "cache"
        "scholarship" : str   — scholarship name
    """
    if isinstance(scholarship, pd.Series):
        scholarship_dict = scholarship.to_dict()
    else:
        scholarship_dict = dict(scholarship)

    name = scholarship_dict.get("name", "Unknown")
    key  = _cache_key(scholarship_dict, student)

    # Cache hit
    if key in _EXPLANATION_CACHE:
        return {
            "explanation": _EXPLANATION_CACHE[key],
            "source": "cache",
            "scholarship": name,
        }

    # Try LLM
    source = "llm"
    try:
        prompt      = _build_prompt(scholarship_dict, student)
        explanation = _call_gemini(prompt, timeout_seconds=9)
    except Exception:
        # Any failure → silent fallback to template
        explanation = template_explanation(scholarship_dict, student)
        source      = "template"

    # Cache and return
    _EXPLANATION_CACHE[key] = explanation
    return {
        "explanation": explanation,
        "source": source,
        "scholarship": name,
    }


def get_explanations_for_recommendations(
    recommendations: pd.DataFrame,
    full_df: pd.DataFrame,
    student: dict,
) -> list[dict]:
    """
    Generate explanations for each row in a recommendations DataFrame.
    """
    results = []
    for rank, row in recommendations.iterrows():
        name = row["name"]
        matches = full_df[full_df["name"] == name]

        if matches.empty:
            scholarship_dict = row.to_dict()
        else:
            scholarship_dict = matches.iloc[0].to_dict()

        result = get_explanation(scholarship_dict, student)
        result["rank"] = rank + 1
        result["similarity_score"] = round(row.get("similarity_score", 0.0), 4)
        results.append(result)

    return results


# ---------------------------------------------------------------------------
# Demo — run directly with: python ml/explainer.py
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    from ml.reccomender import (
        load_scholarships,
        prepare_scholarship_text,
        build_tfidf_matrix,
        recommend_scholarships,
    )

    print("=" * 65)
    print("Scholarship Sathi — LLM Explainer Demo")
    print("=" * 65)

    student = {
        "category": "General",
        "annual_income": 250000,
        "state": "Assam",
        "course": "B.Tech Computer Science",
        "marks": 85,
        "gender": "Male",
        "citizenship": "Indian",
    }

    print("\nLoading data and generating top-3 recommendations...")
    df      = load_scholarships("data/Scholarship_clean.csv")
    texts   = prepare_scholarship_text(df)
    matrix, vectorizer = build_tfidf_matrix(texts)
    recs    = recommend_scholarships(student, df, matrix, vectorizer, top_n=3)

    api_key_set = bool(os.environ.get("GEMINI_API_KEY", ""))
    print(f"\nGEMINI_API_KEY: {'SET (from .env) — calling live Google Gemini LLM!' if api_key_set else 'NOT SET — using template fallback'}")

    print("\nGenerating explanations...\n")
    explained = get_explanations_for_recommendations(recs, df, student)

    for item in explained:
        print(f"{'─'*65}")
        print(f"Rank #{item['rank']}  |  Score: {item['similarity_score']}  |  Source: [{item['source']}]")
        print(f"Scholarship: {item['scholarship']}")
        print()
        print(item["explanation"])
        print()

    print("=" * 65)
    print("Demo complete.")
