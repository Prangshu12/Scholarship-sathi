# PROJECT REQUIREMENTS DOCUMENT (PRD) — Scholarship Sathi

| Field | Team Response |
|---|---|
| **Document** | PRD (Updated with Final Implementation & Trained ML Models) |
| **Project Window** | 16–20 November 2026 |
| **PRD Preparation** | 14–15 November 2026 (Updated 18 November 2026) |
| **Group ID / Team** | F |
| **Assigned Project Title** | Scholarship Sathi |
| **Institution / Department** | SITM |
| **Programme / Course / Semester** | BTech (CSE), First Year |
| **Faculty Mentor** | Somuyajit Jalua |
| **Team Leader / Coordinator** | Sneha Kumari |
| **PRD Submission Date** | 18-11-2026 |

---

## Team Member Register

| No. | Student Name | Contact | Primary Ownership |
|---|---|---|---|
| 1 | Sneha Kumari | 6001338335 | Team Leader, Frontend / React UI & Responsive Design |
| 2 | Prangshu Pranjal Saikia | 6001033960 | Dataset Curation, ML Model Training (`.ipynb` & `.pkl`), TF-IDF Recommender, LLM Explainer & Evaluation |
| 3 | Saimon Sangma | 7005306098 | Backend Accounts, SQLite Database, Validation & Security |
| 4 | Kongbrailatpam Shrishant Sharma | 9436849352 | Rule-Based Eligibility Engine & API Endpoint Integration |

---

## 1. Project Summary

**Scholarship Sathi** is a mobile-friendly web application that helps Indian school and college students find scholarships they can actually get. Scholarship information is scattered across the National Scholarship Portal (NSP), AICTE, UGC, state portals, and university websites; the eligibility rules are written in complex language, and deadlines are easy to miss. A student registers and fills one short profile: category, annual family income, state, course, and marks. The system first applies rule-based filters to evaluate whether the student qualifies on each criterion. It then ranks and classifies scholarships using **TF-IDF vectorization, Cosine Similarity, and trained Supervised ML Classifiers (Logistic Regression, Random Forest, and a 2-layer MLP Neural Network)** trained on `(Student, Scholarship)` feature pairs (`ml/Scholarship_Model_Training.ipynb` & `ml/train_model.py`, saved in `ml/models/*.pkl`), displaying them as cards with a match score and an `Eligible`, `Partial Match`, or `Not Eligible` status with the reason. A Large Language Model (LLM — Google Gemini `gemini-1.5-flash`) writes a short plain-language explanation of why the student qualifies, what the benefit is, and how to apply, using only the dataset record and the profile; a deterministic template fallback is shown if the LLM fails. Deadline alerts warn about scholarships closing within 30 days. The stack is React, Python with FastAPI, pandas, and scikit-learn, with SQLite for accounts.

---

## 2. Background and Problem Statement

- **Background:** Many students lose financial aid only because they never hear about the schemes they qualify for. Scholarships are offered by central and state governments and other providers, and the details are spread over different websites (National Scholarship Portal, AICTE, UGC, the National Portal of India, and state portals). Each scheme has its own rules on category, family income, state, course, marks, and deadline.
- **Limitations of Current Approaches:** Students must read long eligibility notices, often in complex language, only to learn that a scheme is not for them. The portals do not start from the student's own situation, and parents or guardians who help with forms need clear reasons and document lists. Missed deadlines mean lost opportunities. This project is an academic prototype: it supports the search but does not replace the official portals or any official decision.
- **Problem Statement:** Students in India spend a lot of time reading scattered and complicated scholarship rules, and many miss scholarships they qualify for because they do not know about them or miss the deadline. There is no simple tool that takes a student's profile and returns only the scholarships they are eligible for, ranked by relevance, explained in plain language, and linked to the official application page.

---

## 3. Aim, Objectives and Success Indicators

**Overall Aim:** To build a working web prototype that, from a student's profile, shows the scholarships the student is eligible for, ranked by relevance, explains each match in simple language using only verified data, and warns about approaching deadlines.

| Objective ID | Objective & Success Indicator |
|---|---|
| **O1** | Build a curated dataset of real scholarships (`data/Scholarship_clean.csv`). **Success indicator:** 1,528 cleaned scholarship records (including 40 Indian NSP/AICTE/UGC/State schemes and 1,488 university/global fellowships) across 20 columns with zero duplicates. |
| **O2** | Implement rule-based eligibility filtering on category, income, state, course, and marks (`backend/services/eligibility.py`). **Success indicator:** Results match expected lists on 100% of test profiles, including boundary cases (`income == income_limit`, `marks == min_marks`). |
| **O3** | Train and evaluate the ML recommendation and classification models (`ml/reccomender.py`, `ml/train_model.py`, `ml/Scholarship_Model_Training.ipynb`, `ml/evaluate.py`). **Success indicator:** Average **Precision (Top 5)** of `0.700` (meeting the `>= 0.70` target) across the 8 test profiles (`Recall (Top 5)` and `F1-score` also reported), and `99.97%` test accuracy on the 80/20 `train_test_split` supervised classification benchmark, with trained models persisted to `ml/models/*.pkl`. |
| **O4** | Generate personalised LLM explanations (`ml/explainer.py`) that use only the dataset record and the profile, with a template fallback. **Success indicator:** Zero invented facts; template fallback shown automatically when the LLM is unconfigured or slow; explanation loads within 9–10 seconds with MD5 caching. |
| **O5** | Deliver a working, responsive end-to-end web application (`frontend/` + `backend/`). **Success indicator:** A new student can register, fill the profile, and see correct results in under 3 minutes; live demo runs cleanly via `./start.sh`. |

---

## 4. Project Scope

### Included in Scope
- **Student Accounts & Profiles:** Registration, login, and logout (`bcrypt` password hashing + JWT authentication), and an editable profile (nationality, category, annual family income, state, course, marks) with client-side and server-side validation stored in SQLite (`scholarship_sathi.db`).
- **Curated Scholarship Dataset:** `data/Scholarship_clean.csv` (1,528 records, 20 columns), dataset inspection script (`ml/inspect_data.py`), and live server reload (`POST /api/scholarships/reload`).
- **Rule-Based Eligibility Filter:** Evaluates residency, category, income ceiling, state domicile, academic marks cutoff, and course level (`Eligible`, `Partial Match`, or `Not Eligible` with exact reasons).
- **ML Recommendation & Supervised Model Training:**
  - Unsupervised NLP Ranking: `TfidfVectorizer` (`1528 × 2523` matrix) + `cosine_similarity` (`ml/reccomender.py`).
  - Supervised ML Classification: `LogisticRegression`, `RandomForestClassifier`, and `MLPClassifier` (Neural Network) trained on 15,280 `(Student, Scholarship)` pairs using an 80/20 `train_test_split` in `ml/Scholarship_Model_Training.ipynb` and `ml/train_model.py`, saved as `.pkl` files in `ml/models/`.
- **Search, Filters & 30-Day Deadline Alerts:** Keyword search, status/provider filters, sorting by ML Match % / Deadline / Amount, and pulsing alerts for scholarships closing within 30 days (`Closing Soon (≤30d)`).
- **Grounded LLM Explanations & Template Fallback:** `ml/explainer.py` using Google Gemini (`gemini-1.5-flash`) with a 9-second timeout, in-memory MD5 cache, and deterministic template fallback.
- **Testing & Evaluation:** 8 test profiles (`P01`–`P08`), `Precision (Top 5)`, `Recall (Top 5)`, `F1-score`, Unigrams vs. Bigrams comparison (`ml/evaluate.py`), and 11-check unit test suite (`ml/test_recommender.py`).

### Out of Scope
- Submitting scholarship applications on behalf of the student.
- Uploading or storing sensitive student documents (Aadhaar PDFs, certificates).
- Automatic live scraping of portals.
- Payments or financial transactions.

---

## 5. Functional Requirements (FR-01 to FR-22)

| ID | Functional Requirement | Priority | Acceptance Condition / How It Is Tested |
|---|---|---|---|
| **FR-01** | The system shall let a student register with name, email, and password. | Must | Valid details create an account in SQLite; duplicate email rejected (`409`); password stored hashed with `bcrypt`. |
| **FR-02** | The system shall let a registered student log in and log out. | Must | Correct credentials return a JWT and open the dashboard; wrong credentials rejected (`401`). |
| **FR-03** | The system shall let a student fill a profile: category, annual family income, state, course, and academic marks. | Must | Saved in SQLite `student_profiles` and `localStorage`, restored on login. |
| **FR-04** | The system shall let a student edit the profile at any time and update results accordingly. | Must | Saving profile (`PUT /api/student/profile`) updates SQLite and immediately recalculates ML scores. |
| **FR-05** | The system shall validate all inputs (income non-negative number, marks between 0 and 100). | Must | Invalid types or out-of-range marks/income rejected by FastAPI/Pydantic with HTTP `422`. |
| **FR-06** | The system shall filter scholarships by category, income, state, course, and marks using rule-based logic. | Must | `check_eligibility()` and `filter_eligible_scholarships()` pass 100% of test cases including boundary values. |
| **FR-07** | The system shall let a student search scholarships by keyword (name or provider/ministry). | Should | Keyword search filters cards in real time; unknown keyword shows the empty-state message. |
| **FR-08** | The system shall let a student apply filters (eligibility status, provider) and sort (ML score, deadline, amount). | Should | Each filter and sort option updates the displayed scholarship grid cleanly. |
| **FR-09** | If no scholarship matches, the system shall show a helpful message and suggest changing filters. | Must | Renders friendly empty-state box suggesting resetting filters or updating profile. |
| **FR-10** | The system shall rank scholarships using TF-IDF and cosine similarity (and trained ML models). | Must | Sorted by match score descending; average **Precision (Top 5)** is `0.700` (`>= 0.70`) across the 8 test profiles. |
| **FR-11** | Each scholarship card shall show an eligibility status with the reason. | Must | Every card shows `Eligible`, `Partial Match`, or `Not Eligible` and the `ML Eligibility Insight` reason. |
| **FR-12** | Recommended scholarships shall be shown as cards with name, provider, benefit, deadline, and match score. | Must | All five items are visible on every card on the dashboard. |
| **FR-13** | Clicking a card shall open a details modal with full eligibility breakdown, benefits, and required documents. | Must | Details modal shows Grant Amount, Deadline, Match Score, AI Explanation, PASS/MISMATCH breakdown, and Document Checklist. |
| **FR-14** | Every card and details modal shall have an Apply button linking to the official portal URL. | Must | Opens official portal in a new tab (`target="_blank"`). |
| **FR-15** | The dashboard shall highlight scholarships whose deadline is within the next 30 days. | Should | KPI card tracks `Closing Soon (≤30d)` and cards with `deadlineDays <= 30` show a pulsing `Closes in Xd` badge. |
| **FR-16** | Expired scholarships shall be hidden or marked as closed. | Should | Handled via deadline parsing in `backend/main.py`. |
| **FR-17** | For each matched scholarship, an LLM (or fallback template) shall write a short personalised explanation. | Must | Appears in the Details modal via `POST /ml/explain-match`. |
| **FR-18** | The AI explanation shall use only the dataset record and student profile so it does not invent facts. | Must | `_build_prompt()` passes only profile + dataset fields; never sends email or password. |
| **FR-19** | If the LLM is slow or fails, the system shall show a ready-made template explanation instead. | Must | 9-second timeout on Gemini API; automatic fallback to `template_explanation()`. |
| **FR-20** | The team shall be able to reload the dataset after editing the CSV without restarting the server. | Must | `POST /api/scholarships/reload` reloads the CSV and rebuilds the TF-IDF matrix in memory. |
| **FR-21** | The dataset shall be cleaned and inspected for duplicates and missing values. | Must | Verified by `ml/inspect_data.py` (1,528 records, 0 duplicate rows, 0 duplicate names). |
| **FR-22** | Simple admin page to add/edit scholarships. | Could | Optional / out of scope for demo. |

---

## 6. Applied ML & Algorithmic Approach (Section 8)

| Stage | Implemented Approach & Decision |
|---|---|
| **Problem Type** | Hybrid architecture combining: (1) Rule-based eligibility filtering, (2) Unsupervised NLP text ranking (`TfidfVectorizer` + `cosine_similarity`), (3) Supervised ML classification (`LogisticRegression`, `RandomForestClassifier`, `MLPClassifier` neural network), and (4) Grounded Generative AI explanation (`gemini-1.5-flash` + template fallback). |
| **Preprocessing & Feature Engineering** | `prepare_scholarship_text()` combines 8 text columns (`name`, `course`, `benefit`, `doc required`, `caste`, `gender`, `eligible states`, `citizenship`) with lower-casing, English stop-word removal, and L2 normalization (`1528 × 2523` sparse matrix). For supervised classification, 9 pair features are extracted (`tfidf_similarity`, `course_unrestricted`, `income_ratio`, `income_pass`, `marks_diff`, `marks_pass`, `category_match`, `state_match`, `gender_match`). |
| **Model Training (`train_test_split` & `.pkl` Artifacts)** | Implemented in `ml/Scholarship_Model_Training.ipynb` and `ml/train_model.py`. 15,280 labeled `(Student, Scholarship)` pairs are split 80/20 via stratified `train_test_split` (`12,224` train / `3,056` test). Trained models achieve: Logistic Regression (`99.84%` test acc), Random Forest (`100.0%` test acc), and Neural Network MLP (`99.97%` test acc across 30 epochs). Saved to `ml/models/tfidf_vectorizer.pkl`, `ml/models/tfidf_matrix.pkl`, and `ml/models/scholarship_classifier.pkl`. |
| **Ranking Evaluation Metrics** | Evaluated in `ml/evaluate.py` across 8 fictional student profiles (`P01`–`P08`) comparing Unigrams `(1,1)` vs. Bigrams `(1,2)`. Achieves average **Precision (Top 5) = `0.700`** (meeting the `>= 0.70` target), with **Recall (Top 5)** (`0.004`) and **F1-score** (`0.009`) also reported. |
