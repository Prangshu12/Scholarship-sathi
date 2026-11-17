"""
Scholarship Sathi — ML Recommendation Engine
=============================================
Module : ml/reccomender.py
Author : Scholarship Sathi ML Team

Purpose
-------
Content-based scholarship recommendation using TF-IDF vectorization and
cosine similarity.  Given a student profile (dict), the engine ranks
scholarship records by textual similarity and returns the top-N matches.

Architecture note
-----------------
Eligibility filtering is handled by a separate backend module.
This engine intentionally has NO eligibility logic.  It is designed to
receive a pre-filtered list of scholarships and rank them by relevance.
For initial testing it ranks all 1,528 CSV records directly.

ML concepts used
----------------
* TF-IDF  — Term Frequency–Inverse Document Frequency
* Cosine Similarity — angle-based distance between two vectors in
  high-dimensional TF-IDF space
"""

import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ---------------------------------------------------------------------------
# STEP 1 — Load the dataset
# ---------------------------------------------------------------------------

def load_scholarships(csv_path: str = "data/Scholarship_clean.csv") -> pd.DataFrame:
    """
    Load the scholarship CSV into a Pandas DataFrame.

    What it does
    ------------
    Reads the CSV file from disk and returns it as a DataFrame — a
    spreadsheet-like structure where each row is one scholarship and
    each column is one attribute.

    Why we need it
    --------------
    Every subsequent step depends on having the data in memory.
    Isolating the load step makes it easy to swap the data source later
    (e.g. a database query) without touching any other function.

    ML concept
    ----------
    Before any ML algorithm can run, raw data must be loaded into a
    structure the algorithm understands.  Pandas DataFrames are the
    standard container for tabular ML data in Python.

    Parameters
    ----------
    csv_path : str
        Path to the CSV file, relative to the project root directory.

    Returns
    -------
    pd.DataFrame
        All scholarship records. Original data is never modified.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(
            f"Dataset not found at '{csv_path}'.\n"
            "Make sure you are running this script from the project root:\n"
            "    python ml/reccomender.py"
        )

    df = pd.read_csv(csv_path)
    return df


# ---------------------------------------------------------------------------
# STEP 2 — Build a text representation for each scholarship
# ---------------------------------------------------------------------------

def prepare_scholarship_text(df: pd.DataFrame) -> pd.Series:
    """
    Combine selected columns into a single descriptive text string per row.

    What it does
    ------------
    For each scholarship record, it concatenates the values of the most
    semantically meaningful columns into one sentence-like string.
    Missing (NaN) values are replaced with an empty string so they
    contribute nothing without raising errors or dropping rows.

    Why we need it
    --------------
    TF-IDF works on plain text.  Our dataset is a table of mixed types
    (strings, numbers, dates).  We select only the columns that carry
    *descriptive meaning* a student profile can match against, and
    combine them into a single text field per scholarship.

    ML concept — Feature Engineering
    ----------------------------------
    "Feature engineering" is the process of transforming raw data into a
    format that an ML model can learn from.  Here we are manually
    choosing which columns are informative for matching (name, course,
    benefit description, documents, caste, gender, state, citizenship)
    and discarding columns that are numeric thresholds (marks, income,
    age) — those belong in the eligibility filter, not the text ranker.

    Parameters
    ----------
    df : pd.DataFrame
        The raw scholarship DataFrame returned by load_scholarships().

    Returns
    -------
    pd.Series
        One combined text string per row, indexed the same as df.
    """
    # Columns chosen because they carry textual meaning relevant to a
    # student's profile.  Numeric threshold columns (income limit, marks,
    # age) are intentionally excluded — they are for eligibility, not ranking.
    text_columns = [
        "name",
        "course",
        "benefit",
        "doc required",
        "caste",
        "gender",
        "eligible states",
        "citizenship",
    ]

    def row_to_text(row: pd.Series) -> str:
        """
        Join non-null column values for one scholarship into a single string.
        NaN values are silently skipped so no row is lost.
        """
        parts = []
        for col in text_columns:
            value = row.get(col, "")
            # fillna-style check: skip NaN / None / float-NaN
            if pd.notna(value) and str(value).strip():
                parts.append(str(value).strip())
        return " ".join(parts)

    return df.apply(row_to_text, axis=1)


# ---------------------------------------------------------------------------
# STEP 3 — Build the TF-IDF matrix
# ---------------------------------------------------------------------------

def build_tfidf_matrix(scholarship_texts: pd.Series):
    """
    Fit a TF-IDF vectorizer on scholarship texts and transform them into
    a numerical matrix.

    What it does
    ------------
    1. Fits a TfidfVectorizer on all scholarship text strings.
       "Fitting" means the vectorizer scans all texts and builds a
       vocabulary (every unique word it has seen) and learns the IDF
       weight for each word.
    2. Transforms those same texts into a 2-D sparse matrix where:
       - rows    = scholarships (1,528 rows)
       - columns = vocabulary words (thousands of unique tokens)
       - values  = TF-IDF score of that word in that scholarship

    Why we need it
    --------------
    Computers cannot directly compare words — they need numbers.
    TF-IDF converts text into a numeric vector in a way that highlights
    words that are *specific and important* to a document while
    downweighting words that appear everywhere (like "the", "and").

    ML concept — TF-IDF
    --------------------
    TF  (Term Frequency)    = how often a word appears in one document.
    IDF (Inverse Doc Freq)  = log(total docs / docs containing the word).
                              Rare words get a high IDF; common words get
                              a low IDF.
    TF-IDF score            = TF × IDF

    Example: "Engineering" appears in many scholarships → low IDF (not
    very distinguishing).  "Manipur" appears in only 3 scholarships →
    high IDF (very distinguishing for state-specific matching).

    Parameters
    ----------
    scholarship_texts : pd.Series
        Output of prepare_scholarship_text().

    Returns
    -------
    tfidf_matrix : scipy.sparse matrix, shape (n_scholarships, n_vocab)
        Numerical TF-IDF representation of all scholarships.
    vectorizer : TfidfVectorizer (fitted)
        The fitted vectorizer.  Must be reused to transform the student
        profile so both vectors share the same vocabulary space.
    """
    vectorizer = TfidfVectorizer(
        # Break text into individual words (unigrams).
        analyzer="word",
        # Ignore very common English stop-words ("the", "and", "is", …).
        # These add noise without helping distinguish scholarships.
        stop_words="english",
        # Normalize each row vector to unit length so cosine similarity
        # is not affected by the length of the scholarship description.
        norm="l2",
        # Minimum document frequency: ignore tokens that appear in fewer
        # than 1 document (keeps rare typos / one-off tokens).
        min_df=1,
    )

    tfidf_matrix = vectorizer.fit_transform(scholarship_texts)
    return tfidf_matrix, vectorizer


# ---------------------------------------------------------------------------
# STEP 4 — Convert the student profile into a query vector
# ---------------------------------------------------------------------------

def build_student_vector(student: dict, vectorizer: TfidfVectorizer):
    """
    Convert a student profile dictionary into a TF-IDF vector using the
    already-fitted scholarship vectorizer.

    What it does
    ------------
    Takes the student's attributes, assembles them into a text string
    (same style as scholarship texts), and calls vectorizer.transform()
    — NOT fit_transform() — to convert it into a TF-IDF vector within
    the *same vocabulary* as the scholarship matrix.

    Why we need it
    --------------
    For cosine similarity to be meaningful, both vectors (scholarship
    and student) must live in the same vector space — i.e. they must use
    exactly the same vocabulary dimensions.  Using transform() on the
    already-fitted vectorizer guarantees this.  Using fit_transform()
    here would create a *different* vocabulary and make the similarity
    scores meaningless.

    ML concept — Query Vector
    --------------------------
    In information retrieval, the user's query is turned into the same
    kind of vector as the documents.  Similarity between the query
    vector and each document vector tells us how relevant that document
    is to the query.  Here the student profile is the "query".

    Parameters
    ----------
    student : dict
        Dictionary with keys: category, annual_income, state, course,
        marks, gender, citizenship.
    vectorizer : TfidfVectorizer
        The fitted vectorizer from build_tfidf_matrix().

    Returns
    -------
    scipy.sparse matrix, shape (1, n_vocab)
        TF-IDF vector representing the student's profile.
    """
    # Build a text string from the student profile.
    # We only include fields that have textual counterparts in scholarship
    # text (category → caste column, state → eligible states column, etc.).
    # Numeric fields (annual_income, marks) are skipped here — they belong
    # in the eligibility filter, not in the text similarity step.
    student_text = " ".join([
        str(student.get("category", "")).strip(),
        str(student.get("state", "")).strip(),
        str(student.get("course", "")).strip(),
        str(student.get("gender", "")).strip(),
        str(student.get("citizenship", "")).strip(),
    ])

    # transform() (not fit_transform!) keeps the same vocabulary
    student_vector = vectorizer.transform([student_text])
    return student_vector


# ---------------------------------------------------------------------------
# STEP 5 — Compute similarity and return ranked results
# ---------------------------------------------------------------------------

def recommend_scholarships(
    student: dict,
    df: pd.DataFrame,
    tfidf_matrix,
    vectorizer: TfidfVectorizer,
    top_n: int = 5,
) -> pd.DataFrame:
    """
    Rank scholarships by cosine similarity to the student profile and
    return the top-N results.

    What it does
    ------------
    1. Converts the student profile into a TF-IDF vector (via
       build_student_vector).
    2. Computes cosine similarity between the student vector and every
       row in the scholarship TF-IDF matrix.
    3. Sorts scholarships from highest to lowest similarity score.
    4. Returns the top-N scholarships with their scores as a DataFrame.

    Why we need it
    --------------
    This is the core ranking step.  All previous steps (loading,
    text preparation, TF-IDF building) exist to make this step possible.

    ML concept — Cosine Similarity
    --------------------------------
    Cosine similarity measures the *angle* between two vectors, not
    their magnitude.  It is defined as:

        cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)

    Result is in the range [0, 1]:
        1.0 → vectors point in exactly the same direction (maximum match)
        0.0 → vectors are orthogonal (no shared vocabulary at all)

    It is preferred over Euclidean distance for text because it ignores
    how many times words appear (magnitude) and focuses purely on which
    words appear (direction).

    IMPORTANT — What the score means
    ----------------------------------
    The similarity score is a *relative text similarity measure*.
    It does NOT represent the probability of receiving the scholarship
    or any eligibility decision.  A score of 0.45 simply means that
    scholarship's text overlaps more with the student's profile than
    one with a score of 0.20.

    Parameters
    ----------
    student : dict
        Student profile dictionary.
    df : pd.DataFrame
        Full scholarship DataFrame (or a pre-filtered subset).
    tfidf_matrix : sparse matrix
        TF-IDF matrix aligned with df (same row order).
    vectorizer : TfidfVectorizer
        The fitted vectorizer used to build tfidf_matrix.
    top_n : int
        Number of top results to return (default: 5).

    Returns
    -------
    pd.DataFrame
        Columns: 'name', 'course', 'benefit', 'similarity_score'
        Sorted descending by similarity_score.
    """
    # Build the student query vector
    student_vector = build_student_vector(student, vectorizer)

    # Compute cosine similarity: 1 student vs. all scholarships
    # Result shape: (1, n_scholarships) → flatten to 1-D array
    similarity_scores = cosine_similarity(student_vector, tfidf_matrix).flatten()

    # Attach scores to the DataFrame (without modifying the original df)
    results = df.copy()
    results["similarity_score"] = similarity_scores

    # Sort descending so the best match is first
    results = results.sort_values("similarity_score", ascending=False)

    # Return only the most useful columns for display
    display_columns = ["name", "course", "benefit", "similarity_score"]
    # Keep only columns that actually exist (defensive check)
    display_columns = [c for c in display_columns if c in results.columns]

    return results[display_columns].head(top_n).reset_index(drop=True)


# ---------------------------------------------------------------------------
# How the functions work together (pipeline summary)
# ---------------------------------------------------------------------------
#
#  load_scholarships()
#       │  returns DataFrame (1528 rows)
#       ▼
#  prepare_scholarship_text()
#       │  returns Series of text strings (1528 strings)
#       ▼
#  build_tfidf_matrix()
#       │  returns (sparse matrix 1528×vocab, fitted vectorizer)
#       ▼
#  recommend_scholarships()   ◄── student dict
#       │  internally calls build_student_vector()
#       │  then cosine_similarity()
#       ▼
#  Top-N ranked DataFrame
#
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Quick smoke test — run directly with: python ml/reccomender.py
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 60)
    print("Scholarship Sathi — Recommendation Engine (smoke test)")
    print("=" * 60)

    # Example student profile (as specified in requirements)
    student_profile = {
        "category": "General",
        "annual_income": 250000,   # numeric — not used in text similarity
        "state": "Assam",
        "course": "B.Tech Computer Science",
        "marks": 85,               # numeric — not used in text similarity
        "gender": "Male",
        "citizenship": "Indian",
    }

    print("\nStudent Profile:")
    for key, value in student_profile.items():
        print(f"  {key}: {value}")

    print("\n[1] Loading scholarship dataset...")
    df = load_scholarships("data/Scholarship_clean.csv")
    print(f"    ✓ Loaded {len(df)} scholarships, {len(df.columns)} columns")

    print("\n[2] Preparing scholarship text representations...")
    scholarship_texts = prepare_scholarship_text(df)
    print(f"    ✓ Generated {len(scholarship_texts)} text strings")
    print(f"    Sample: {scholarship_texts.iloc[0][:100]}...")

    print("\n[3] Building TF-IDF matrix...")
    tfidf_matrix, vectorizer = build_tfidf_matrix(scholarship_texts)
    print(f"    ✓ TF-IDF matrix shape: {tfidf_matrix.shape}")
    print(f"      (rows=scholarships, columns=vocabulary size)")

    print("\n[4] Computing recommendations...")
    recommendations = recommend_scholarships(
        student=student_profile,
        df=df,
        tfidf_matrix=tfidf_matrix,
        vectorizer=vectorizer,
        top_n=5,
    )

    print("\n" + "=" * 60)
    print("TOP 5 RECOMMENDED SCHOLARSHIPS")
    print("=" * 60)
    print("(Score = text similarity [0–1], NOT eligibility probability)\n")

    for rank, row in recommendations.iterrows():
        print(f"  Rank {rank + 1}  |  Score: {row['similarity_score']:.4f}")
        print(f"  Name   : {row['name']}")
        if pd.notna(row.get('course')):
            print(f"  Course : {row['course']}")
        print()

    print("=" * 60)
    print("Engine test complete.")
