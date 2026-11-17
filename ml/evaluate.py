"""
Scholarship Sathi — ML Evaluation Script
=========================================
Module : ml/evaluate.py
Run    : python ml/evaluate.py   (from project root)

Purpose
-------
Measure how well the TF-IDF + cosine similarity recommender ranks
scholarships for a set of fictional test profiles.

PRD success criteria (Objective O3)
-------------------------------------
- Precision@5 average ≥ 0.70
- Recall@K and F1-score also reported
- Unigrams vs. unigrams+bigrams comparison

Ground truth definition
-----------------------
A scholarship is "relevant" for a profile when ALL of:
  1. course field matches the profile course OR course is "Unrestricted"
     OR course contains a recognisable keyword from the profile
  2. gender field is "Any gender" OR matches the profile gender
  3. caste field is blank (open to all) OR matches the profile category

This is NOT an eligibility filter. It is a simple relevance proxy used
only to give the evaluation script a ground-truth answer key.
The actual eligibility filter is a separate backend module.

ML concept — Precision@K, Recall@K, F1
----------------------------------------
Precision@K = |relevant ∩ top-K| / K
Recall@K    = |relevant ∩ top-K| / |relevant|
F1@K        = 2 × (P@K × R@K) / (P@K + R@K)

These tell us: of the top K results the system returns, how many
are genuinely relevant (precision), and of all genuinely relevant
ones, how many did we catch (recall)?
"""

import sys
import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.reccomender import (
    load_scholarships,
    prepare_scholarship_text,
    build_tfidf_matrix,
    build_student_vector,
    recommend_scholarships,
)

# ---------------------------------------------------------------------------
# 8 Fictional test profiles  (PRD requires 8–10)
# Each represents a distinct student archetype found in Indian academia
# ---------------------------------------------------------------------------

TEST_PROFILES = [
    {
        "id": "P01",
        "label": "General / B.Tech CSE / Assam / Male",
        "profile": {
            "category": "General",
            "annual_income": 250000,
            "state": "Assam",
            "course": "B.Tech Computer Science",
            "marks": 85,
            "gender": "Male",
            "citizenship": "Indian",
        },
        # Relevant keywords: Computer & Information Systems, Engineering, Unrestricted
        "relevant_keywords": ["Computer", "Engineering", "Unrestricted"],
        "relevant_genders": ["Any gender"],
        "relevant_castes": [None, float("nan"), ""],   # blank = open to all
    },
    {
        "id": "P02",
        "label": "SC / Medicine / All India / Female",
        "profile": {
            "category": "SC",
            "annual_income": 150000,
            "state": "All India",
            "course": "MBBS",
            "marks": 78,
            "gender": "Female",
            "citizenship": "Indian",
        },
        "relevant_keywords": ["Medicine", "Health", "Nursing", "Unrestricted"],
        "relevant_genders": ["Any gender", "Female only"],
        "relevant_castes": [None, float("nan"), "", "SC"],
    },
    {
        "id": "P03",
        "label": "OBC / Business / Maharashtra / Male",
        "profile": {
            "category": "OBC",
            "annual_income": 300000,
            "state": "Maharashtra",
            "course": "MBA Business Management",
            "marks": 70,
            "gender": "Male",
            "citizenship": "Indian",
        },
        "relevant_keywords": ["Business", "Management", "Finance", "Unrestricted"],
        "relevant_genders": ["Any gender"],
        "relevant_castes": [None, float("nan"), "", "OBC/EBC"],
    },
    {
        "id": "P04",
        "label": "General / Architecture / Delhi / Female",
        "profile": {
            "category": "General",
            "annual_income": 500000,
            "state": "Delhi",
            "course": "B.Arch Architecture Design",
            "marks": 80,
            "gender": "Female",
            "citizenship": "Indian",
        },
        "relevant_keywords": ["Architecture", "Design", "Arts", "Unrestricted"],
        "relevant_genders": ["Any gender", "Female only"],
        "relevant_castes": [None, float("nan"), ""],
    },
    {
        "id": "P05",
        "label": "ST / Any course / Northeast India / Female",
        "profile": {
            "category": "ST",
            "annual_income": 100000,
            "state": "Meghalaya",
            "course": "BA Humanities",
            "marks": 65,
            "gender": "Female",
            "citizenship": "Indian",
        },
        "relevant_keywords": ["Humanities", "Arts", "Education", "Unrestricted"],
        "relevant_genders": ["Any gender", "Female only"],
        "relevant_castes": [None, float("nan"), "", "ST"],
    },
    {
        "id": "P06",
        "label": "General / Law / All India / Male",
        "profile": {
            "category": "General",
            "annual_income": 400000,
            "state": "All India",
            "course": "LLB Law Legal Studies",
            "marks": 75,
            "gender": "Male",
            "citizenship": "Indian",
        },
        "relevant_keywords": ["Law", "Legal", "Public", "Unrestricted"],
        "relevant_genders": ["Any gender"],
        "relevant_castes": [None, float("nan"), ""],
    },
    {
        "id": "P07",
        "label": "SC / Nursing / All India / Female",
        "profile": {
            "category": "SC",
            "annual_income": 80000,
            "state": "All India",
            "course": "B.Sc Nursing Health Sciences",
            "marks": 72,
            "gender": "Female",
            "citizenship": "Indian",
        },
        "relevant_keywords": ["Nursing", "Medicine", "Health", "Unrestricted"],
        "relevant_genders": ["Any gender", "Female only"],
        "relevant_castes": [None, float("nan"), "", "SC"],
    },
    {
        "id": "P08",
        "label": "General / Music / All India / Female",
        "profile": {
            "category": "General",
            "annual_income": 350000,
            "state": "All India",
            "course": "Music Performing Arts",
            "marks": 88,
            "gender": "Female",
            "citizenship": "Indian",
        },
        "relevant_keywords": ["Music", "Arts", "Visual", "Performing", "Unrestricted"],
        "relevant_genders": ["Any gender", "Female only"],
        "relevant_castes": [None, float("nan"), ""],
    },
]


# ---------------------------------------------------------------------------
# Ground-truth relevance function
# ---------------------------------------------------------------------------

def is_relevant(row: pd.Series, profile_entry: dict) -> bool:
    """
    Return True if a scholarship row is 'relevant' for the test profile.

    Relevance is defined by:
    1. Course: scholarship course contains any relevant keyword OR is blank
       (blank course ≠ unrestricted by PRD rule — we do NOT assume blank = open)
    2. Gender: matches allowed genders for this profile
    3. Caste: is blank (open) or in the allowed castes for this profile

    This proxy is used ONLY for generating the evaluation answer key.
    It is NOT an eligibility decision.
    """
    keywords = profile_entry["relevant_keywords"]
    allowed_genders = profile_entry["relevant_genders"]
    allowed_castes = profile_entry["relevant_castes"]

    # --- Course check ---
    course_val = row.get("course", "")
    if pd.isna(course_val):
        # Blank course: PRD says do NOT assume unrestricted — skip as unknown
        course_match = False
    else:
        course_str = str(course_val)
        course_match = any(kw.lower() in course_str.lower() for kw in keywords)

    if not course_match:
        return False

    # --- Gender check ---
    gender_val = str(row.get("gender", "Any gender"))
    gender_match = any(g.lower() in gender_val.lower() for g in allowed_genders)
    if not gender_match:
        return False

    # --- Caste check ---
    caste_val = row.get("caste", "")
    caste_is_blank = pd.isna(caste_val) or str(caste_val).strip() == ""
    caste_in_allowed = any(
        (pd.isna(a) or str(a).strip() == "") if caste_is_blank
        else (not pd.isna(a) and str(a).strip().lower() == str(caste_val).strip().lower())
        for a in allowed_castes
    )
    # Simpler: blank caste = open to all; otherwise must be in allowed list
    if caste_is_blank:
        caste_match = True
    else:
        caste_match = any(
            not pd.isna(a) and str(a).strip().lower() == str(caste_val).strip().lower()
            for a in allowed_castes
        )

    return caste_match


def get_relevant_set(df: pd.DataFrame, profile_entry: dict) -> set:
    """Return the set of scholarship indices that are relevant for a profile."""
    relevant = set()
    for idx, row in df.iterrows():
        if is_relevant(row, profile_entry):
            relevant.add(idx)
    return relevant


# ---------------------------------------------------------------------------
# Metric computations
# ---------------------------------------------------------------------------

def precision_at_k(recommended_indices: list, relevant_set: set, k: int) -> float:
    """Fraction of top-K recommendations that are relevant."""
    if k == 0:
        return 0.0
    top_k = recommended_indices[:k]
    hits = sum(1 for idx in top_k if idx in relevant_set)
    return hits / k


def recall_at_k(recommended_indices: list, relevant_set: set, k: int) -> float:
    """Fraction of all relevant items found in top-K."""
    if not relevant_set:
        return 0.0
    top_k = recommended_indices[:k]
    hits = sum(1 for idx in top_k if idx in relevant_set)
    return hits / len(relevant_set)


def f1_at_k(p: float, r: float) -> float:
    """Harmonic mean of precision and recall."""
    if p + r == 0:
        return 0.0
    return 2 * p * r / (p + r)


# ---------------------------------------------------------------------------
# Build TF-IDF with configurable ngram range (for unigram vs. bigram comparison)
# ---------------------------------------------------------------------------

def build_tfidf_matrix_ngram(scholarship_texts: pd.Series, ngram_range: tuple):
    """
    Build a TF-IDF matrix with a custom ngram_range.
    Identical to build_tfidf_matrix() but exposes ngram_range for comparison.

    ML concept — n-grams
    ---------------------
    Unigrams (1,1): each single word is a token. Fast and compact.
    Bigrams  (1,2): single words AND consecutive word pairs are tokens.
                    "Computer Science" becomes a single feature, which may
                    improve matching for multi-word course names.
    """
    vectorizer = TfidfVectorizer(
        analyzer="word",
        stop_words="english",
        norm="l2",
        min_df=1,
        ngram_range=ngram_range,
    )
    tfidf_matrix = vectorizer.fit_transform(scholarship_texts)
    return tfidf_matrix, vectorizer


def rank_all(student: dict, df: pd.DataFrame, tfidf_matrix, vectorizer) -> list:
    """
    Return the DataFrame indices of all scholarships sorted by similarity
    (descending). Used to compute recall correctly over the full corpus.
    """
    student_vector = build_student_vector(student, vectorizer)
    scores = cosine_similarity(student_vector, tfidf_matrix).flatten()
    # argsort ascending → reverse for descending
    sorted_positions = scores.argsort()[::-1]
    # Map positions back to original DataFrame indices
    return [df.index[pos] for pos in sorted_positions]


# ---------------------------------------------------------------------------
# Main evaluation loop
# ---------------------------------------------------------------------------

def evaluate(df: pd.DataFrame, scholarship_texts: pd.Series, K: int = 5):
    """
    Run evaluation for both unigram and bigram TF-IDF variants.
    Print per-profile and aggregate metrics.
    """
    variants = {
        "Unigrams (1,1)": (1, 1),
        "Bigrams  (1,2)": (1, 2),
    }

    aggregate_results = {}

    for variant_name, ngram_range in variants.items():
        print(f"\n{'='*65}")
        print(f"VARIANT: {variant_name}   |   K = {K}")
        print(f"{'='*65}")
        print(f"{'Profile':<42} {'P@K':>6} {'R@K':>7} {'F1@K':>7} {'Rel':>5} {'Hits':>5}")
        print(f"{'-'*65}")

        tfidf_matrix, vectorizer = build_tfidf_matrix_ngram(scholarship_texts, ngram_range)

        precisions, recalls, f1s = [], [], []

        for entry in TEST_PROFILES:
            profile = entry["profile"]
            pid     = entry["id"]
            label   = entry["label"]

            # Get relevant set (ground truth)
            relevant_set = get_relevant_set(df, entry)

            # Use K=3 when fewer than K relevant items exist (PRD rule)
            effective_k = min(K, max(len(relevant_set), 1))

            # Rank all scholarships by similarity for this profile
            ranked_indices = rank_all(profile, df, tfidf_matrix, vectorizer)

            p = precision_at_k(ranked_indices, relevant_set, effective_k)
            r = recall_at_k(ranked_indices, relevant_set, effective_k)
            f = f1_at_k(p, r)

            precisions.append(p)
            recalls.append(r)
            f1s.append(f)

            hits = sum(1 for idx in ranked_indices[:effective_k] if idx in relevant_set)
            print(
                f"{pid} {label:<40} "
                f"{p:>6.3f} {r:>7.3f} {f:>7.3f} "
                f"{len(relevant_set):>5} {hits:>5}"
            )

        avg_p = sum(precisions) / len(precisions)
        avg_r = sum(recalls)    / len(recalls)
        avg_f = sum(f1s)        / len(f1s)

        print(f"{'-'*65}")
        print(f"{'AVERAGE':<42} {avg_p:>6.3f} {avg_r:>7.3f} {avg_f:>7.3f}")
        target_met = "✓ MET" if avg_p >= 0.70 else "✗ NOT MET"
        print(f"\n  Precision@{K} target (≥ 0.70): {avg_p:.3f}  →  {target_met}")

        aggregate_results[variant_name] = {
            "avg_precision": avg_p,
            "avg_recall": avg_r,
            "avg_f1": avg_f,
        }

    # --- Comparison summary ---
    print(f"\n{'='*65}")
    print("VARIANT COMPARISON SUMMARY")
    print(f"{'='*65}")
    print(f"{'Variant':<20} {'Avg P@K':>10} {'Avg R@K':>10} {'Avg F1':>10}")
    print(f"{'-'*55}")
    for name, m in aggregate_results.items():
        print(f"{name:<20} {m['avg_precision']:>10.3f} {m['avg_recall']:>10.3f} {m['avg_f1']:>10.3f}")

    best = max(aggregate_results, key=lambda x: aggregate_results[x]["avg_precision"])
    print(f"\n  Best variant by Precision@K: {best}")
    print(f"{'='*65}\n")

    return aggregate_results


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    K = 5

    print("=" * 65)
    print("Scholarship Sathi — Recommendation Engine Evaluation")
    print(f"PRD Objective O3 | Precision@{K} target ≥ 0.70")
    print("=" * 65)

    print("\n[1] Loading dataset...")
    df = load_scholarships("data/Scholarship_clean.csv")
    print(f"    ✓ {len(df)} scholarships loaded")

    print("\n[2] Preparing scholarship text...")
    scholarship_texts = prepare_scholarship_text(df)
    print(f"    ✓ {len(scholarship_texts)} text strings prepared")

    print(f"\n[3] Running evaluation over {len(TEST_PROFILES)} test profiles...")
    results = evaluate(df, scholarship_texts, K=K)
