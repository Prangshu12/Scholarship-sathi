"""
Scholarship Sathi — Eligibility Filter
========================================
Module : backend/services/eligibility.py
Author : Saimon Sangma (eligibility logic)
Updated: Integrated with real CSV column values

Rule-based filter that removes scholarships a student cannot get.
Checks: category/caste, income, state, course, marks.

NOTE: This is NOT the ML engine. This runs BEFORE the recommender.
"""

import re


# ---------------------------------------------------------------------------
# Helper: check if a value matches an "allowed" field from the CSV
# ---------------------------------------------------------------------------

_OPEN_PATTERNS = [
    "all", "unrestricted", "all india", "all indian", "all indian states",
    "all indian states/uts", "n/a", "not india-state-specific", "any",
]


def _is_open(value: str) -> bool:
    """Return True if the field value means 'open to everyone'."""
    if not value:
        return True
    v = str(value).strip().lower()
    return any(p in v for p in _OPEN_PATTERNS)


def matches_allowed(student_value: str, scholarship_field: str) -> bool:
    """
    Return True if the student's value is permitted by the scholarship field.

    Rules:
    - If the scholarship field is blank or "all / unrestricted / N/A", it matches everyone.
    - Otherwise the student_value must appear (case-insensitive) in the
      semicolon- or comma-separated list of allowed values.
    """
    if not scholarship_field or _is_open(str(scholarship_field)):
        return True

    # Split on semicolons or commas to handle lists like "Assam; Manipur"
    allowed_values = re.split(r"[;,]", str(scholarship_field))
    allowed_lower  = [v.strip().lower() for v in allowed_values if v.strip()]

    student_lower = str(student_value).strip().lower()
    # Direct match or "all india" anywhere in the allowed list
    return student_lower in allowed_lower or any(_is_open(a) for a in allowed_lower)


# ---------------------------------------------------------------------------
# Single scholarship eligibility check
# ---------------------------------------------------------------------------

def check_eligibility(profile: dict, scholarship: dict) -> tuple[bool, list[str]]:
    """
    Check whether a student profile meets a scholarship's criteria.

    Parameters
    ----------
    profile : dict
        Keys: category, annual_income, state, course, marks
    scholarship : dict
        Keys: category, income_limit, eligible_states, course, min_marks

    Returns
    -------
    (is_eligible: bool, reasons: list[str])
        reasons is empty when eligible; lists all failed criteria otherwise.
    """
    reasons = []

    # --- Category / Caste ---
    schol_category = str(scholarship.get("category", "") or "").strip()
    if schol_category and not _is_open(schol_category):
        if not matches_allowed(profile.get("category", ""), schol_category):
            reasons.append(f"Category not eligible (requires {schol_category})")

    # --- Income ---
    try:
        income_limit = float(scholarship.get("income_limit") or 9_999_999)
        student_income = float(profile.get("annual_income") or 0)
        if student_income > income_limit:
            reasons.append(
                f"Family income ₹{int(student_income):,} exceeds limit ₹{int(income_limit):,}"
            )
    except (TypeError, ValueError):
        pass   # unparseable income limit → skip the check

    # --- State ---
    schol_states = str(scholarship.get("eligible_states", "") or "")
    if not _is_open(schol_states):
        if not matches_allowed(profile.get("state", ""), schol_states):
            reasons.append(f"State not eligible (requires {schol_states})")

    # --- Course ---
    schol_course = str(scholarship.get("course", "") or "").strip()
    if schol_course and not _is_open(schol_course):
        if not matches_allowed(profile.get("course", ""), schol_course):
            reasons.append(f"Course not eligible (requires {schol_course})")

    # --- Marks ---
    try:
        min_marks = float(scholarship.get("min_marks") or 0)
        student_marks = float(profile.get("marks") or 0)
        if min_marks > 0 and student_marks < min_marks:
            reasons.append(
                f"Marks {student_marks}% below minimum {min_marks}%"
            )
    except (TypeError, ValueError):
        pass

    return len(reasons) == 0, reasons


# ---------------------------------------------------------------------------
# Batch filter
# ---------------------------------------------------------------------------

def filter_eligible_scholarships(profile: dict, scholarships: list[dict]) -> list[dict]:
    """
    Return only the scholarships the student is eligible for.

    Parameters
    ----------
    profile : dict
        Student profile.
    scholarships : list[dict]
        List of scholarship dicts (each with the keys checked_eligibility uses).

    Returns
    -------
    list[dict] — subset of scholarships that passed all checks.
    """
    eligible = []
    for scholarship in scholarships:
        is_eligible, _ = check_eligibility(profile, scholarship)
        if is_eligible:
            eligible.append(scholarship)
    return eligible
