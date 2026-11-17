"""
Scholarship Sathi — Recommender Test Suite
==========================================
Module : ml/test_recommender.py
Run    : python ml/test_recommender.py   (from project root)

This file contains a structured test for the ML recommendation engine.
It is separate from the engine itself so the engine can be imported
cleanly by the backend without running any test code.

Tests covered
-------------
1. Dataset loads successfully and contains the expected number of records.
2. Scholarship text preparation produces one string per scholarship row.
3. TF-IDF matrix has the correct number of rows (= number of scholarships).
4. The student vector has the correct shape (1 row, same vocab as matrix).
5. Recommendations return exactly top_n results with required columns.
6. Similarity scores are in the valid range [0, 1].
7. Full end-to-end run with the example student profile prints results.
"""

import sys
import os

# Allow running from the project root: python ml/test_recommender.py
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.reccomender import (
    load_scholarships,
    prepare_scholarship_text,
    build_tfidf_matrix,
    build_student_vector,
    recommend_scholarships,
)

PASS = "  PASS"
FAIL = "  FAIL"


def run_test(description: str, condition: bool, detail: str = "") -> bool:
    status = PASS if condition else FAIL
    print(f"{status}  {description}")
    if detail:
        print(f"        {detail}")
    return condition


# ---------------------------------------------------------------------------
# Example student profile (matches the spec exactly)
# ---------------------------------------------------------------------------

STUDENT_PROFILE = {
    "category": "General",
    "annual_income": 250000,
    "state": "Assam",
    "course": "B.Tech Computer Science",
    "marks": 85,
    "gender": "Male",
    "citizenship": "Indian",
}

EXPECTED_ROW_COUNT = 1528
CSV_PATH = "data/Scholarship_clean.csv"
TOP_N = 5


def main():
    print("=" * 65)
    print("Scholarship Sathi — Recommendation Engine Test Suite")
    print("=" * 65)

    all_passed = True

    # ------------------------------------------------------------------
    # TEST 1: Dataset loads successfully
    # ------------------------------------------------------------------
    print("\n── Test 1: Dataset Loading ──")
    try:
        df = load_scholarships(CSV_PATH)
        ok = len(df) == EXPECTED_ROW_COUNT
        all_passed &= run_test(
            f"Dataset loaded with {len(df)} records",
            ok,
            f"Expected {EXPECTED_ROW_COUNT}, got {len(df)}"
            if not ok else f"All {len(df)} scholarship records preserved ✓",
        )
        all_passed &= run_test(
            "DataFrame has 20 columns",
            len(df.columns) == 20,
            f"Columns: {df.columns.tolist()}",
        )
    except Exception as e:
        run_test("Dataset loading raised an exception", False, str(e))
        print("\nCannot continue — dataset failed to load.")
        sys.exit(1)

    # ------------------------------------------------------------------
    # TEST 2: Text preparation
    # ------------------------------------------------------------------
    print("\n── Test 2: Scholarship Text Preparation ──")
    scholarship_texts = prepare_scholarship_text(df)

    all_passed &= run_test(
        "One text string generated per scholarship",
        len(scholarship_texts) == len(df),
        f"Text series length: {len(scholarship_texts)}",
    )
    all_passed &= run_test(
        "No NaN values in prepared texts",
        scholarship_texts.isna().sum() == 0,
        f"NaN count: {scholarship_texts.isna().sum()}",
    )
    all_passed &= run_test(
        "No empty text strings (all scholarships have at least some text)",
        (scholarship_texts.str.strip() == "").sum() == 0,
        f"Empty count: {(scholarship_texts.str.strip() == '').sum()}",
    )

    print(f"\n  Sample text (scholarship #1):")
    print(f"  → {scholarship_texts.iloc[0][:120]}...")

    # ------------------------------------------------------------------
    # TEST 3: TF-IDF matrix
    # ------------------------------------------------------------------
    print("\n── Test 3: TF-IDF Matrix ──")
    tfidf_matrix, vectorizer = build_tfidf_matrix(scholarship_texts)

    expected_rows = len(df)
    actual_rows, vocab_size = tfidf_matrix.shape

    all_passed &= run_test(
        f"TF-IDF matrix has correct number of rows ({expected_rows})",
        actual_rows == expected_rows,
        f"Matrix shape: {tfidf_matrix.shape}  (rows=scholarships, cols=vocabulary)",
    )
    all_passed &= run_test(
        "Vocabulary size is positive",
        vocab_size > 0,
        f"Vocabulary contains {vocab_size} unique tokens",
    )

    print(f"\n  TF-IDF matrix shape : {tfidf_matrix.shape}")
    print(f"  Vocabulary size     : {vocab_size} tokens")
    print(f"  Matrix type         : {type(tfidf_matrix).__name__} (sparse — memory efficient)")

    # ------------------------------------------------------------------
    # TEST 4: Student vector
    # ------------------------------------------------------------------
    print("\n── Test 4: Student Profile → Vector Conversion ──")
    student_vector = build_student_vector(STUDENT_PROFILE, vectorizer)

    all_passed &= run_test(
        "Student vector has 1 row",
        student_vector.shape[0] == 1,
        f"Shape: {student_vector.shape}",
    )
    all_passed &= run_test(
        "Student vector vocabulary matches scholarship vocabulary",
        student_vector.shape[1] == vocab_size,
        f"Student vocab dim: {student_vector.shape[1]}, Scholarship vocab dim: {vocab_size}",
    )

    # ------------------------------------------------------------------
    # TEST 5: Recommendations
    # ------------------------------------------------------------------
    print("\n── Test 5: End-to-End Recommendation ──")
    recommendations = recommend_scholarships(
        student=STUDENT_PROFILE,
        df=df,
        tfidf_matrix=tfidf_matrix,
        vectorizer=vectorizer,
        top_n=TOP_N,
    )

    all_passed &= run_test(
        f"Returned exactly {TOP_N} recommendations",
        len(recommendations) == TOP_N,
        f"Got {len(recommendations)} rows",
    )
    all_passed &= run_test(
        "'name' column present in results",
        "name" in recommendations.columns,
    )
    all_passed &= run_test(
        "'similarity_score' column present in results",
        "similarity_score" in recommendations.columns,
    )

    # ------------------------------------------------------------------
    # TEST 6: Score validity
    # ------------------------------------------------------------------
    print("\n── Test 6: Similarity Score Validity ──")
    scores = recommendations["similarity_score"]
    all_passed &= run_test(
        "All scores are in range [0, 1]",
        ((scores >= 0.0) & (scores <= 1.0)).all(),
        f"Min={scores.min():.4f}, Max={scores.max():.4f}",
    )
    all_passed &= run_test(
        "Scores are sorted descending (best match first)",
        (scores.diff().dropna() <= 0).all(),
        f"Scores: {scores.tolist()}",
    )

    # ------------------------------------------------------------------
    # Display results
    # ------------------------------------------------------------------
    print("\n" + "=" * 65)
    print("STUDENT PROFILE")
    print("=" * 65)
    for k, v in STUDENT_PROFILE.items():
        print(f"  {k:<18}: {v}")

    print("\n" + "=" * 65)
    print("TOP 5 RECOMMENDED SCHOLARSHIPS")
    print("=" * 65)
    print("Score = text similarity (0–1). NOT an eligibility decision.\n")

    for rank, row in recommendations.iterrows():
        score = row["similarity_score"]
        name  = row["name"]
        course = row.get("course", "N/A")
        print(f"  #{rank + 1}  Score: {score:.4f}  │  {name}")
        if course and str(course) not in ("nan", "None", ""):
            print(f"       Course: {course}")
        print()

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    print("=" * 65)
    if all_passed:
        print("ALL TESTS PASSED ✓")
    else:
        print("SOME TESTS FAILED ✗  — Review the FAIL lines above.")
    print("=" * 65)

    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()

