"""
Scholarship Sathi — FastAPI Backend & ML Server
================================================
Module : backend/main.py
Run    : python backend/main.py         (from project root)
   or  : uvicorn backend.main:app --reload --port 5000

Serves both the Backend REST API (/api/...) and the ML Model API (/ml/...)
on http://localhost:5000 so the React frontend connects to both seamlessly.
"""

import sys
import os
import re
from datetime import datetime, date
from contextlib import asynccontextmanager
from typing import Optional, Any

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from backend.database import init_db, get_connection
from backend.auth import hash_password, verify_password, create_access_token, decode_token
from backend.services.eligibility import filter_eligible_scholarships, check_eligibility
from ml.reccomender import (
    load_scholarships,
    prepare_scholarship_text,
    build_tfidf_matrix,
    build_student_vector,
    recommend_scholarships,
)
from ml.explainer import get_explanation, get_explanations_for_recommendations

# ---------------------------------------------------------------------------
# Global ML state — loaded once at startup, refreshed on /api/scholarships/reload
# ---------------------------------------------------------------------------

_df: Optional[pd.DataFrame] = None
_tfidf_matrix = None
_vectorizer = None
_frontend_scholarships: list[dict] = []


def _parse_deadline_days(deadline_str: Any) -> tuple[int, str]:
    """Compute days remaining from reference date (2026-11-17) and formatted date."""
    ref_date = date(2026, 11, 17)
    if not deadline_str or pd.isna(deadline_str):
        return 45, "31 Dec 2026"
    s = str(deadline_str).strip()
    try:
        dt = datetime.strptime(s[:10], "%Y-%m-%d").date()
        days = max(1, (dt - ref_date).days)
        return days, dt.strftime("%d %b %Y")
    except Exception:
        return 30, s


def _map_csv_row_to_card(row: pd.Series, idx: int) -> dict:
    """
    Convert a row from data/Scholarship_clean.csv into the rich card format
    used by the React frontend while preserving all CSV fields.
    """
    name = str(row.get("name", f"Scholarship #{idx}")).strip()

    # Amount
    raw_amt = row.get("benefit amount", 30000)
    try:
        amount = int(float(raw_amt)) if pd.notna(raw_amt) else 30000
    except Exception:
        amount = 30000

    # Income limit
    raw_inc = row.get("income limit", 800000)
    try:
        max_income = int(float(raw_inc)) if pd.notna(raw_inc) else 800000
    except Exception:
        max_income = 800000

    # Min marks
    raw_marks = row.get("min marks 10th", 50)
    try:
        min_marks = float(raw_marks) if pd.notna(raw_marks) else 50.0
    except Exception:
        min_marks = 50.0

    # Provider classification
    name_lower = name.lower()
    if any(k in name_lower for k in ["nsp", "aicte", "pm ", "central sector", "ishan uday", "inspire", "national"]):
        provider = "Central Govt"
        ministry = "National Scholarship Portal / Govt. of India"
        apply_url = "https://scholarships.gov.in/"
    elif any(k in name_lower for k in ["assam", "bihar", "goa", "meghalaya", "chandigarh", "himachal", "state", "post-matric", "pre-matric", "umbrella"]):
        provider = "State Govt"
        ministry = "State Directorate of Higher & Technical Education"
        apply_url = "https://scholarships.gov.in/"
    elif any(k in name_lower for k in ["foundation", "trust", "reliance", "tata", "motors", "society"]):
        provider = "Corporate CSR"
        ministry = "Corporate Social Responsibility / Foundation Grant"
        apply_url = "https://www.buddy4study.com/"
    else:
        provider = "International"
        ministry = "Global University / International Fellowship Board"
        apply_url = "https://www.scholarships.com/"

    # Categories
    caste_val = str(row.get("caste", "")).strip() if pd.notna(row.get("caste")) else ""
    if not caste_val:
        allowed_categories = ["General", "OBC", "SC", "ST", "EWS", "Minority"]
    elif "OBC" in caste_val.upper() or "EBC" in caste_val.upper():
        allowed_categories = ["OBC", "EWS"]
    elif "SC" in caste_val.upper():
        allowed_categories = ["SC"]
    elif "ST" in caste_val.upper():
        allowed_categories = ["ST"]
    else:
        allowed_categories = ["General", "OBC", "SC", "ST", "EWS", "Minority"]

    # States & Nationalities
    states_val = str(row.get("eligible states", "")).strip() if pd.notna(row.get("eligible states")) else "All India"
    if "not india-state-specific" in states_val.lower():
        allowed_states = ["All India", "Outside India"]
        allowed_nationalities = ["Indian", "International"]
    elif "assam" in states_val.lower() or "meghalaya" in states_val.lower():
        allowed_states = ["Assam", "All India"]
        allowed_nationalities = ["Indian"]
    else:
        allowed_states = ["All India", "Assam", "Maharashtra", "Karnataka", "Delhi", "West Bengal"]
        allowed_nationalities = ["Indian"]

    # Courses
    course_val = str(row.get("course", "")).strip() if pd.notna(row.get("course")) else "Unrestricted"
    course_lower = course_val.lower()
    if "class" in course_lower or "ix" in course_lower:
        allowed_courses = ["Class 11-12"]
    elif any(k in course_lower for k in ["phd", "doctoral", "postdoc", "fellowship"]):
        allowed_courses = ["PhD / Research", "Postgraduate"]
    elif any(k in course_lower for k in ["master", "mba", "pg", "postgraduate"]):
        allowed_courses = ["Postgraduate", "Undergraduate (B.Tech / B.E.)"]
    elif any(k in course_lower for k in ["engineering", "computer", "technical", "aicte"]):
        allowed_courses = ["Undergraduate (B.Tech / B.E.)", "Postgraduate"]
    else:
        allowed_courses = [
            "Class 11-12",
            "Undergraduate (B.Tech / B.E.)",
            "Undergraduate (General / B.Sc / B.Com)",
            "Postgraduate",
            "PhD / Research",
        ]

    # Documents
    doc_val = str(row.get("doc required", "")).strip() if pd.notna(row.get("doc required")) else ""
    documents = [d.strip() for d in re.split(r"[;,]", doc_val) if d.strip()]
    if not documents:
        documents = [
            "Government-issued Photo ID / Aadhaar",
            "Recent Academic Marksheets / Transcripts",
            "Admission / Bonafide Certificate",
            "Family Income Certificate",
            "Bank Account Passbook (NPCI Seeded)",
        ]

    deadline_days, deadline_date = _parse_deadline_days(row.get("application deadline"))

    return {
        "id": int(row.get("sl no.", idx + 1)),
        "title": name,
        "name": name,
        "provider": provider,
        "ministry": ministry,
        "amount": amount,
        "benefit": str(row.get("benefit", "")),
        "deadlineDays": deadline_days,
        "deadlineDate": deadline_date,
        "allowedNationalities": allowed_nationalities,
        "allowedCategories": allowed_categories,
        "maxIncome": max_income,
        "allowedStates": allowed_states,
        "minMarks": min_marks,
        "allowedCourses": allowed_courses,
        "course": course_val,
        "applyUrl": apply_url,
        "documents": documents[:6],
        "gender": str(row.get("gender", "Any gender")),
        "caste": caste_val,
    }


def _build_frontend_catalog(df: pd.DataFrame) -> list[dict]:
    """
    Build a rich catalog of scholarships from the CSV for the web UI:
    - Includes all Indian Government / NSP / AICTE / State schemes from the CSV
    - Plus top Engineering, CS, Medical, Business & Unrestricted schemes
    """
    nsp_mask = df["name"].str.contains(
        "NSP|PM |Post-Matric|Pre-Matric|Central Sector|AICTE|UGC|Yasasvi|Umbrella|ISHAN UDAY|INSPIRE|Pragati|Saksham",
        case=False,
        na=False,
    )
    eng_cs_mask = df["course"].str.contains(
        "Engineering|Computer|Medicine|Business|Architecture|Law",
        case=False,
        na=False,
    )
    selected = pd.concat([df[nsp_mask], df[eng_cs_mask].head(35), df.head(15)]).drop_duplicates(subset=["name"])
    return [_map_csv_row_to_card(row, idx) for idx, (_, row) in enumerate(selected.iterrows())]


def _load_ml_model():
    global _df, _tfidf_matrix, _vectorizer, _frontend_scholarships
    csv_path = os.path.join(PROJECT_ROOT, "data", "Scholarship_clean.csv")
    _df = load_scholarships(csv_path)
    texts = prepare_scholarship_text(_df)
    _tfidf_matrix, _vectorizer = build_tfidf_matrix(texts)
    _frontend_scholarships = _build_frontend_catalog(_df)
    print(f"[ML] Loaded {len(_df)} scholarships ({len(_frontend_scholarships)} featured cards), matrix {_tfidf_matrix.shape}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    _load_ml_model()
    yield


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Scholarship Sathi API",
    description="Backend + ML Recommendation & AI Explanation Server for Scholarship Sathi.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def get_optional_user(authorization: str = Header(default=None)) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        return decode_token(token)
    except Exception:
        return None


def get_current_user(authorization: str = Header(default=None)) -> dict:
    user = get_optional_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return user


# ---------------------------------------------------------------------------
# Pydantic Models & Validation (FR-05)
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    nationality: str = "Indian"
    category: str = "General"
    income: float = 200000
    annual_income: Optional[float] = None
    state: str = "Assam"
    course: str = "Undergraduate (B.Tech / B.E.)"
    marks: float = 80.0
    gender: str = "Any"

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileRequest(BaseModel):
    name: Optional[str] = None
    nationality: str = "Indian"
    category: str = "General"
    income: Optional[float] = None
    annual_income: Optional[float] = None
    state: str = "Assam"
    course: str = "Undergraduate (B.Tech / B.E.)"
    marks: float = 80.0
    gender: str = "Any"
    citizenship: str = "Indian"

class RecommendRequest(BaseModel):
    category: str = "General"
    annual_income: float = 250000
    state: str = "Assam"
    course: str = "B.Tech Computer Science"
    marks: float = 85.0
    gender: str = "Male"
    citizenship: str = "Indian"
    top_n: int = 5

class BatchPredictRequest(BaseModel):
    student: dict
    scholarships: list[dict] = []

class ExplainSingleRequest(BaseModel):
    student: dict
    scholarship: dict

class StatusUpdateRequest(BaseModel):
    scholarshipId: int
    status: Optional[str] = None


def _validate_profile_inputs(income: float, marks: float):
    """Server-side validation per PRD FR-05."""
    if income < 0:
        raise HTTPException(status_code=422, detail="Annual family income must be a non-negative number.")
    if marks < 0 or marks > 100:
        raise HTTPException(status_code=422, detail="Marks must be between 0 and 100.")


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "scholarships_loaded": len(_df) if _df is not None else 0,
        "featured_scholarships": len(_frontend_scholarships),
    }


# ---------------------------------------------------------------------------
# Auth Endpoints (FR-01, FR-02, FR-03)
# ---------------------------------------------------------------------------

@app.post("/api/auth/register")
def register(body: RegisterRequest):
    income_val = body.annual_income if body.annual_income is not None else body.income
    _validate_profile_inputs(income_val, body.marks)

    conn = get_connection()
    try:
        if conn.execute("SELECT id FROM users WHERE email = ?", (body.email,)).fetchone():
            raise HTTPException(status_code=409, detail="Email already registered.")
        hashed = hash_password(body.password)
        cur = conn.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (body.name, body.email, hashed),
        )
        uid = cur.lastrowid

        conn.execute("""
            INSERT INTO student_profiles
                (user_id, nationality, category, annual_income, state, course, marks, gender, citizenship)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            uid,
            body.nationality,
            body.category,
            int(income_val),
            body.state,
            body.course,
            float(body.marks),
            body.gender,
            body.nationality,
        ))
        conn.commit()

        token = create_access_token(uid, body.email)
        return {
            "token": token,
            "user": {
                "id": uid,
                "name": body.name,
                "email": body.email,
                "nationality": body.nationality,
                "category": body.category,
                "income": int(income_val),
                "annual_income": int(income_val),
                "state": body.state,
                "course": body.course,
                "marks": float(body.marks),
            },
        }
    finally:
        conn.close()


@app.post("/api/auth/login")
def login(body: LoginRequest):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, name, email, password FROM users WHERE email = ?", (body.email,)
        ).fetchone()
        if not row or not verify_password(body.password, row["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        prof = conn.execute(
            "SELECT * FROM student_profiles WHERE user_id = ?", (row["id"],)
        ).fetchone()

        token = create_access_token(row["id"], row["email"])
        user_data = {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "nationality": prof["nationality"] if prof and "nationality" in prof.keys() else "Indian",
            "category": prof["category"] if prof else "OBC",
            "income": prof["annual_income"] if prof else 220000,
            "annual_income": prof["annual_income"] if prof else 220000,
            "state": prof["state"] if prof else "Assam",
            "course": prof["course"] if prof else "Undergraduate (B.Tech / B.E.)",
            "marks": prof["marks"] if prof else 84.5,
        }
        return {"token": token, "user": user_data}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Profile Endpoints (FR-03, FR-04, FR-05)
# ---------------------------------------------------------------------------

@app.get("/api/student/profile")
def get_profile(user=Depends(get_current_user)):
    uid = int(user["sub"])
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM student_profiles WHERE user_id = ?", (uid,)).fetchone()
        return dict(row) if row else {}
    finally:
        conn.close()


def _upsert_profile(body: ProfileRequest, user: Optional[dict]):
    income_val = body.annual_income if body.annual_income is not None else (body.income if body.income is not None else 200000)
    _validate_profile_inputs(income_val, body.marks)

    if not user:
        return {"message": "Profile validated (guest mode).", "income": income_val, "marks": body.marks}

    uid = int(user["sub"])
    conn = get_connection()
    try:
        conn.execute("""
            INSERT INTO student_profiles
                (user_id, nationality, category, annual_income, state, course, marks, gender, citizenship, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                nationality=excluded.nationality,
                category=excluded.category,
                annual_income=excluded.annual_income,
                state=excluded.state,
                course=excluded.course,
                marks=excluded.marks,
                gender=excluded.gender,
                citizenship=excluded.citizenship,
                updated_at=CURRENT_TIMESTAMP
        """, (
            uid,
            body.nationality,
            body.category,
            int(income_val),
            body.state,
            body.course,
            float(body.marks),
            body.gender,
            body.citizenship,
        ))
        conn.commit()
        return {"message": "Profile saved."}
    finally:
        conn.close()


@app.post("/api/student/profile")
def save_profile_post(body: ProfileRequest, user=Depends(get_optional_user)):
    return _upsert_profile(body, user)


@app.put("/api/student/profile")
def save_profile_put(body: ProfileRequest, user=Depends(get_optional_user)):
    return _upsert_profile(body, user)


# ---------------------------------------------------------------------------
# Application Tracking Endpoint
# ---------------------------------------------------------------------------

@app.post("/api/applications/status")
def update_application_status(body: StatusUpdateRequest):
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO application_statuses (scholarship_id, status) VALUES (?, ?)",
            (body.scholarshipId, body.status or ""),
        )
        conn.commit()
        return {"ok": True, "scholarshipId": body.scholarshipId, "status": body.status}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Scholarships Endpoints (FR-20)
# ---------------------------------------------------------------------------

@app.get("/api/scholarships")
def get_scholarships():
    """Return formatted scholarships from the CSV for the frontend dashboard."""
    if _df is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    return _frontend_scholarships


@app.get("/api/scholarships/raw")
def get_raw_scholarships():
    """Return all 1,528 raw records from data/Scholarship_clean.csv."""
    if _df is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    records = _df.where(pd.notna(_df), None).to_dict(orient="records")
    return {"total": len(records), "scholarships": records}


@app.post("/api/scholarships/reload")
def reload_scholarships():
    """Reload the scholarship CSV and rebuild the TF-IDF index without restarting."""
    _load_ml_model()
    return {"message": f"Reloaded {len(_df)} scholarships."}


# ---------------------------------------------------------------------------
# Helper: Evaluate a single scholarship card with Rules + TF-IDF + Explainer
# ---------------------------------------------------------------------------

def _evaluate_student_against_card(student: dict, sch: dict, tfidf_sim: float) -> dict:
    """
    Combine rule-based eligibility checking with TF-IDF cosine similarity
    to produce the exact response schema required by the frontend.
    """
    nationality = student.get("nationality") or student.get("citizenship") or "Indian"
    is_indian = nationality == "Indian"
    student_cat = student.get("category", "General")
    student_inc = float(student.get("income") if student.get("income") is not None else student.get("annual_income", 200000))
    student_state = student.get("state", "Assam")
    student_marks = float(student.get("marks", 80))
    student_course = student.get("course", "Undergraduate (B.Tech / B.E.)")

    allowed_nat = sch.get("allowedNationalities", ["Indian"])
    allowed_cats = sch.get("allowedCategories", ["General", "OBC", "SC", "ST", "EWS", "Minority"])
    max_inc = float(sch.get("maxIncome", 800000))
    allowed_states = sch.get("allowedStates", ["All India"])
    min_marks = float(sch.get("minMarks", 50))
    allowed_courses = sch.get("allowedCourses", [student_course])

    criteria_breakdown = []

    # 1. Residency / Citizenship
    nat_pass = nationality in allowed_nat
    criteria_breakdown.append({
        "label": "Residency / Citizenship",
        "passed": nat_pass,
        "detail": f"Required: {', '.join(allowed_nat)} | Yours: {'Indian Citizen' if is_indian else 'International'}",
    })

    # 2. Social Category
    if is_indian:
        cat_pass = student_cat in allowed_cats
        criteria_breakdown.append({
            "label": "Social Category",
            "passed": cat_pass,
            "detail": f"Required: {'All Categories' if len(allowed_cats) >= 6 else ', '.join(allowed_cats)} | Yours: {student_cat}",
        })

    # 3. Family Income Ceiling
    inc_pass = student_inc <= max_inc
    criteria_breakdown.append({
        "label": "Family Income Ceiling",
        "passed": inc_pass,
        "detail": f"Max: ₹{int(max_inc):,} | Yours: ₹{int(student_inc):,}",
    })

    # 4. State Domicile
    state_pass = (
        ("All India" in allowed_states or student_state in allowed_states)
        if is_indian
        else ("Outside India" in allowed_states or "All India" in allowed_states)
    )
    criteria_breakdown.append({
        "label": "State Domicile" if is_indian else "Geographic Eligibility",
        "passed": state_pass,
        "detail": f"Eligible: {', '.join(allowed_states)} | Yours: {student_state}",
    })

    # 5. Academic Merit Cutoff
    marks_pass = student_marks >= min_marks
    criteria_breakdown.append({
        "label": "Academic Merit Cutoff",
        "passed": marks_pass,
        "detail": f"Min: {min_marks}% | Yours: {student_marks}%",
    })

    # 6. Course Level
    course_pass = student_course in allowed_courses
    criteria_breakdown.append({
        "label": "Course Level",
        "passed": course_pass,
        "detail": f"Yours: {student_course}",
    })

    total_count = len(criteria_breakdown)
    passed_count = sum(1 for c in criteria_breakdown if c["passed"])
    rule_ratio = passed_count / total_count if total_count else 1.0

    # Combine rule compliance (75% weight) + normalized TF-IDF similarity boost (25% weight)
    tfidf_boost = min(1.0, tfidf_sim * 3.2)
    if passed_count == total_count and nat_pass:
        status = "ELIGIBLE"
        match_score = int(round(82 + 17 * tfidf_boost))
    elif passed_count >= total_count - 2 and nat_pass:
        status = "PARTIAL"
        match_score = int(round(rule_ratio * 75 + 10 * tfidf_boost))
    else:
        status = "NOT_ELIGIBLE"
        match_score = int(round(rule_ratio * 55))

    failed_labels = [c["label"] for c in criteria_breakdown if not c["passed"]]
    title = sch.get("title") or sch.get("name", "this scholarship")

    if status == "ELIGIBLE":
        ai_reason = (
            f"Eligible (TF-IDF similarity: {tfidf_sim:.2f}). Your {student_marks}% marks, "
            f"{student_cat} profile, and ₹{int(student_inc):,} annual income satisfy all criteria for {title}."
        )
    elif status == "PARTIAL":
        ai_reason = (
            f"Partial match ({passed_count}/{total_count} rules met, TF-IDF: {tfidf_sim:.2f}). "
            f"Check requirement on: {', '.join(failed_labels)}."
        )
    else:
        ai_reason = f"Not eligible due to mismatch in {' & '.join(failed_labels)}."

    return {
        "scholarshipId": sch.get("id"),
        "matchScore": match_score,
        "tfidfScore": round(float(tfidf_sim), 4),
        "status": status,
        "aiReason": ai_reason,
        "criteriaBreakdown": criteria_breakdown,
    }


# ---------------------------------------------------------------------------
# ML Batch Eligibility & TF-IDF Ranking Endpoint (/ml/predict-eligibility)
# ---------------------------------------------------------------------------

@app.post("/ml/predict-eligibility")
@app.post("/api/ml/predict-eligibility")
def predict_eligibility_batch(body: BatchPredictRequest):
    """
    Runs rule-based eligibility + TF-IDF cosine similarity ranking for a list
    of scholarships and returns predictions in the frontend schema.
    """
    if _vectorizer is None:
        raise HTTPException(status_code=503, detail="ML model not loaded.")

    student = body.student or {}
    scholarships = body.scholarships or _frontend_scholarships

    student_profile_for_ml = {
        "category": student.get("category", "General"),
        "annual_income": student.get("income") or student.get("annual_income", 200000),
        "state": student.get("state", "Assam"),
        "course": student.get("course", "B.Tech Computer Science"),
        "marks": student.get("marks", 80),
        "gender": student.get("gender", "Any"),
        "citizenship": student.get("nationality", "Indian"),
    }

    student_vec = build_student_vector(student_profile_for_ml, _vectorizer)

    # Build text representation for each scholarship in the batch and compute TF-IDF cosine similarity
    sch_texts = [
        f"{s.get('title', '')} {s.get('course', '')} {' '.join(s.get('allowedCourses', []))} "
        f"{s.get('benefit', '')} {s.get('ministry', '')} {' '.join(s.get('allowedCategories', []))} "
        f"{' '.join(s.get('allowedStates', []))}"
        for s in scholarships
    ]
    sch_matrix = _vectorizer.transform(sch_texts) if sch_texts else None
    sims = cosine_similarity(student_vec, sch_matrix).flatten() if sch_matrix is not None else []

    predictions = []
    for idx, sch in enumerate(scholarships):
        sim_val = float(sims[idx]) if idx < len(sims) else 0.15
        pred = _evaluate_student_against_card(student, sch, sim_val)
        predictions.append(pred)

    return {"predictions": predictions}


# ---------------------------------------------------------------------------
# ML Single Scholarship Explanation Endpoint (/ml/explain-match)
# ---------------------------------------------------------------------------

@app.post("/ml/explain-match")
@app.post("/api/ml/explain-match")
def explain_single_match(body: ExplainSingleRequest):
    """
    Generates a grounded LLM or template explanation for a single scholarship
    using ml/explainer.py + rule breakdown.
    """
    student = body.student or {}
    sch = body.scholarship or {}

    student_profile_for_ml = {
        "category": student.get("category", "General"),
        "annual_income": student.get("income") or student.get("annual_income", 200000),
        "state": student.get("state", "Assam"),
        "course": student.get("course", "B.Tech Computer Science"),
        "marks": student.get("marks", 80),
        "gender": student.get("gender", "Any"),
        "citizenship": student.get("nationality", "Indian"),
    }

    student_vec = build_student_vector(student_profile_for_ml, _vectorizer)
    sch_text = (
        f"{sch.get('title', '')} {sch.get('course', '')} {' '.join(sch.get('allowedCourses', []))} "
        f"{sch.get('benefit', '')} {sch.get('ministry', '')}"
    )
    sim_val = float(cosine_similarity(student_vec, _vectorizer.transform([sch_text])).flatten()[0])
    eval_res = _evaluate_student_against_card(student, sch, sim_val)

    # Also invoke ml/explainer.py for grounded explanation
    scholarship_record = {
        "name": sch.get("title") or sch.get("name", "Scholarship"),
        "course": sch.get("course") or ", ".join(sch.get("allowedCourses", [])),
        "benefit": sch.get("benefit") or f"Annual scholarship grant from {sch.get('ministry', 'the provider')}",
        "benefit amount": sch.get("amount", ""),
        "eligible states": ", ".join(sch.get("allowedStates", [])),
        "caste": ", ".join(sch.get("allowedCategories", [])),
        "gender": sch.get("gender", "Any gender"),
        "income limit": sch.get("maxIncome", ""),
        "doc required": "; ".join(sch.get("documents", [])),
        "application deadline": sch.get("deadlineDate", ""),
    }
    expl = get_explanation(scholarship_record, student_profile_for_ml)

    # Clean markdown bold markers for clean modal text display
    clean_text = expl["explanation"].replace("**", "").replace("_", "")
    eval_res["aiReason"] = f"{eval_res['aiReason']} — {clean_text}"
    eval_res["explanationSource"] = expl["source"]
    return eval_res


# ---------------------------------------------------------------------------
# Direct CSV Recommendation Endpoint (/api/ml/recommend)
# ---------------------------------------------------------------------------

@app.post("/api/ml/recommend")
def ml_recommend(body: RecommendRequest):
    """
    Direct ML pipeline over all 1,528 records in data/Scholarship_clean.csv:
    1. Rule-based eligibility filter
    2. TF-IDF + cosine similarity ranking
    3. Plain-language explanation
    """
    if _df is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    student = {
        "category": body.category,
        "annual_income": body.annual_income,
        "state": body.state,
        "course": body.course,
        "marks": body.marks,
        "gender": body.gender,
        "citizenship": body.citizenship,
    }

    all_dicts = []
    for _, row in _df.iterrows():
        all_dicts.append({
            "name": row.get("name", ""),
            "category": row.get("caste", "all") or "all",
            "income_limit": row.get("income limit", 9_999_999) or 9_999_999,
            "eligible_states": row.get("eligible states", "all") or "all",
            "course": row.get("course", "all") or "all",
            "min_marks": row.get("min marks 10th", 0) or 0,
        })

    eligibility_profile = {
        "category": body.category or "General",
        "annual_income": body.annual_income,
        "state": body.state or "All India",
        "course": body.course,
        "marks": body.marks,
    }

    eligible_dicts = filter_eligible_scholarships(eligibility_profile, all_dicts)
    eligible_names = {s["name"] for s in eligible_dicts}

    eligible_df = (
        _df[_df["name"].isin(eligible_names)].reset_index(drop=True)
        if eligible_names
        else _df.reset_index(drop=True)
    )

    eligible_texts = prepare_scholarship_text(eligible_df)
    eligible_matrix = _vectorizer.transform(eligible_texts)

    effective_top_n = min(body.top_n, len(eligible_df))
    if effective_top_n == 0:
        return {"total_eligible": 0, "recommendations": []}

    recs = recommend_scholarships(
        student=student,
        df=eligible_df,
        tfidf_matrix=eligible_matrix,
        vectorizer=_vectorizer,
        top_n=effective_top_n,
    )

    explained = get_explanations_for_recommendations(recs, eligible_df, student)

    results = []
    for item in explained:
        full_row = eligible_df[eligible_df["name"] == item["scholarship"]]
        full = full_row.iloc[0].to_dict() if not full_row.empty else {}

        def _clean(v):
            return None if (v is None or (isinstance(v, float) and pd.isna(v))) else v

        results.append({
            "rank": item["rank"],
            "name": item["scholarship"],
            "course": _clean(full.get("course")),
            "benefit": _clean(full.get("benefit")),
            "benefit_amount": _clean(full.get("benefit amount")),
            "eligible_states": _clean(full.get("eligible states")),
            "caste": _clean(full.get("caste")),
            "gender": _clean(full.get("gender")),
            "income_limit": _clean(full.get("income limit")),
            "age_min": _clean(full.get("age min")),
            "age_max": _clean(full.get("age max")),
            "doc_required": _clean(full.get("doc required")),
            "application_deadline": _clean(full.get("application deadline")),
            "similarity_score": item["similarity_score"],
            "explanation": item["explanation"],
            "explanation_source": item["source"],
        })

    return {
        "total_eligible": len(eligible_df),
        "total_scholarships": len(_df),
        "recommendations": results,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=5000, reload=False)
