PROJECT-BASED END-SEMESTER ASSESSMENT
PROJECT REQUIREMENTS
DOCUMENT (PRD)
Group project planning template | Complete one document per team


Document	PRD
Project window	16-20 November 2026
PRD preparation	14-15 November 2026
Team	F
Institution / Department	SITM
Course / Semester	Btech cse/ Bca
Status	
NOVEMBER 2026


Team and project details
Field	Team response
Group ID	F
Assigned project title	Scholarship Sathi
Programme / Course / Semester	BTech (CSE), first year
Faculty mentor	Somuyajit Jalua
Team leader / coordinator	Sneha Kumari
PRD Submission Date	18-11-2026

Team member register
No.	Student name	Contact
1	Sneha Kumari	6001338335
2	Prangshu Pranjal Saikia	6001033960
3	Saimon Sangma	7005306098
4	Kongbrailatpam Shrishant Sharma	9436849352


1. Project summary
Project summary
Scholarship Sathi is a mobile-friendly web application that helps Indian school and college students find scholarships they can actually get. Scholarship information is scattered across the National Scholarship Portal, AICTE, UGC and state portals, the eligibility rules are written in complex language, and deadlines are easy to miss. A student registers and fills one short profile: category, annual family income, state, course and marks. The system first applies rule-based filters to remove scholarships the student cannot get. It then ranks the rest using TF-IDF and cosine similarity between the student profile and each scholarship description, and shows them as cards with a match score and an Eligible or Not Eligible status with the reason. A Large Language Model (LLM) writes a short plain-language explanation of why the student qualifies, what the benefit is and how to apply, using only the dataset record and the profile; a ready-made template is shown if the LLM fails. Deadline alerts warn about scholarships closing within 30 days. The data is a hand-made, verified dataset built from official sources, and every record carries a source link. The stack is React, Python with FastAPI, pandas and scikit-learn, with SQLite for accounts. The expected outcome is a tested prototype that a new student can use in under three minutes.

2. Background and problem statement
Background. Many students lose financial aid only because they never hear about the schemes they qualify for. Scholarships are offered by central and state governments and other providers, and the details are spread over different websites (National Scholarship Portal, AICTE, UGC, the National Portal of India and state portals). Each scheme has its own rules on category, family income, state, course, marks and deadline.
Limitations of current approaches. Students must read long eligibility notices, often in complex language, only to learn that a scheme is not for them. The portals do not start from the student's own situation, and parents or guardians who help with forms need clear reasons and document lists. Missed deadlines mean lost opportunities. This project is an academic prototype: it supports the search but does not replace the official portals or any official decision.
Problem statement
Students in India spend a lot of time reading scattered and complicated scholarship rules, and many miss scholarships they qualify for because they do not know about them or miss the deadline. There is no simple tool that takes a student's profile and returns only the scholarships they are eligible for, ranked by relevance, explained in plain language and linked to the official application page.

3. Aim, objectives and success indicators
Overall aim. To build a working web prototype that, from a student's profile, shows the scholarships the student is eligible for, ranked by relevance, explains each match in simple language using only verified data, and warns about approaching deadlines.
Objective ID	Objective
O1	Build a curated dataset of real scholarships from official sources (NSP, AICTE, UGC, india.gov.in, state portals). Success indicator: at least 20 verified records by the end of Day 2 (stretch target 40), each with a source link, an official apply link and a last-checked date; dataset cleaned by script with no duplicates.
O2	Implement rule-based eligibility filtering on category, income, state, course and marks. Success indicator: results match the hand-made expected lists on 100% of the 8 to 10 test profiles, including boundary cases (income equal to the limit, marks equal to the minimum).
O3	Rank eligible scholarships using TF-IDF and cosine similarity. Success indicator: average Precision (Top 5) of 0.7 or higher on the test profiles; Recall (Top 5) and F1-score are also reported.
O4	Generate personalised LLM explanations that use only the dataset record and the profile, with a template fallback. Success indicator: zero invented facts in a manual check of at least 20 explanations; fallback shown when the LLM fails; explanation loads within 10 seconds without blocking the page.
O5	Deliver a working, responsive end-to-end web application. Success indicator: a new student can register, fill the profile and see correct results in under 3 minutes; live demo runs without crashing in Chrome, Edge and Firefox.

4. Project scope
Included in scope
Student accounts: registration, login and logout, and a profile (category, annual family income, state, course, marks) with client-side and server-side validation, editable at any time.
Hand-curated scholarship dataset: at least 20 verified real records (stretch target 40) with 17 columns including source URL, official apply URL and last-checked date; automatic cleaning; reload from the dataset file.
Rule-based eligibility filter on category, income, state, course and marks, with an Eligible or Not Eligible status and the reason.
TF-IDF and cosine-similarity ranking with a match score; scholarship cards; details page with benefits, required documents and an Apply button linking to the official URL.
Keyword search and extra filters (deadline month, provider, benefit amount); a helpful message when nothing matches.
Deadline alerts for scholarships closing within 30 days; expired scholarships marked Closed.
LLM-written personalised explanations grounded in the record and the profile, with a template fallback, caching and a note to verify details on the official portal.
Testing and evaluation: 8 to 10 test profiles, Precision (Top 5), Recall (Top 5) and F1-score, AI fact-check, bug log, usability test with 3 to 5 classmates, final report, slides and live demo.

Out of scope (not built in this project)
Submitting scholarship applications on behalf of the student.
Uploading or storing student documents (certificates, Aadhaar, etc.).
Automatic live scraping of scholarship portals; the dataset is curated by hand.
A native mobile app; the website is mobile-friendly instead.
Payments or any financial transaction.
Admin page to add or edit scholarships (FR-22, Could-have): attempted only if all Must-have and Should-have work is finished.

State any assumptions, constraints or dependencies (for example: available dataset, internet access, API keys, hardware, hosting or library availability).
    • Assumption: the dataset is collected by hand from official pages while preparing the project. Rules and deadlines can change, so the app always asks students to confirm details on the official portal.
    • Dependency: an LLM API key (free tier or credits) is obtained on Day 1. If it is unavailable or slow, the template fallback keeps the product working.
    • Constraint: the implementation window is only 16 to 18 November 2026, so all Must-have items are built first and Should-have and Could-have items only after the end-to-end flow works.
    • Assumption: team members have laptops with internet access, Python 3.11 or newer, Node.js (LTS), Git and VS Code. The demo runs locally; no paid hosting is needed.
    • Dependency: team members depend on each other, so the dataset columns and the API list are agreed on Day 1, and the frontend works on sample data until the backend is ready.
    • Assumption: all test profiles are fictional; no real student data is used.
5. Users / Project requirements
Target users
User	Description	What they need
Student (primary)	School or college student in India looking for financial aid.	Quickly find scholarships they qualify for and understand how to apply.
Parent or guardian	Helps the student with forms and income details.	Clear eligibility reasons and the list of required documents.
Admin (team member)	Maintains the scholarship dataset.	An easy way to add or update scholarship records (edit the dataset file and reload).

5.1 Functional requirements
ID	Functional requirement	Priority	Acceptance condition / how it will be tested
FR-01	The system shall let a student register with name, email and password.	Must	Valid details create an account; a duplicate email or invalid input is rejected with a clear message; the password is stored hashed.
FR-02	The system shall let a registered student log in and log out.	Must	Correct credentials open the dashboard; wrong credentials are rejected; after logout, private pages redirect to login.
FR-03	The system shall let a student fill a profile: category, annual family income, state, course and academic marks.	Must	All five fields are saved and shown again on the next visit.
FR-04	The system shall let a student edit the profile at any time and update the results accordingly.	Must	After saving a changed profile, the dashboard shows the new filtered and ranked list.
FR-05	The system shall validate all inputs (income must be a number, state must be from the list, marks between 0 and 100).	Must	Letters in income, marks of 101 and an unknown state are rejected by the server with a field-level message; no crash.
FR-06	The system shall filter scholarships by category, income, state and course using rule-based logic.	Must	For every test profile the result exactly equals the hand-made expected list (100%), including boundary cases.
FR-07	The system shall let a student search scholarships by keyword (name or provider).	Should	A known keyword returns matching scholarships; an unknown keyword shows the empty-result message.
FR-08	The system shall let a student apply extra filters (deadline month, provider, benefit amount).	Should	Each filter narrows the list correctly in manual tests; Clear filters restores the full list.
FR-09	If no scholarship matches, the system shall show a helpful message and suggest changing filters.	Must	A high-income test profile shows the message with suggestions, not a blank page.
FR-10	The system shall rank eligible scholarships using TF-IDF and cosine similarity between the student profile and scholarship descriptions.	Must	Results are sorted by match score, highest first; average Precision (Top 5) is 0.7 or higher on the test profiles.
FR-11	Each scholarship card shall show an eligibility status (Eligible or Not Eligible) with the reason.	Must	Every card shows a status and at least one reason; a Not Eligible reason names the rule that failed.
FR-12	Recommended scholarships shall be shown as cards with name, provider, benefit, deadline and match score.	Must	All five items are visible on every card for every test profile.
FR-13	Clicking a card shall open a details page with full eligibility, benefits and required documents.	Must	The details page opens for every card and shows all three sections.
FR-14	Every details page shall have an Apply button linking to the official application URL.	Must	The button opens the official link in a new tab; all links in the dataset are checked and working.
FR-15	The dashboard shall highlight scholarships whose deadline is within the next 30 days.	Should	With test records due in 3, 20 and 60 days, only the first two are highlighted.
FR-16	Expired scholarships shall be hidden or clearly marked as closed.	Should	A record with a past deadline is labelled Closed and its Apply button is disabled.
FR-17	For each matched scholarship, an LLM shall write a short personalised explanation: why the student qualifies, the benefits and the steps to apply.	Must	The explanation has three parts, is under about 150 words and appears on the details page for every scholarship opened.
FR-18	The AI explanation shall use only the dataset record and the student profile, so it does not invent facts.	Must	In a fact-check of at least 20 explanations there are zero invented facts; no email or password is sent to the LLM.
FR-19	If the LLM is slow or fails, the system shall show a ready-made template explanation instead.	Must	With a wrong API key or no internet, the template appears within the time limit and the page keeps working.
FR-20	The team shall be able to add or update scholarship records by editing the dataset file and reloading it.	Must	After editing the file and calling reload, the new record appears without restarting the server.
FR-21	The dataset shall be cleaned automatically: duplicates removed, missing values handled, categories spelled the same way.	Must	Running the cleaning script on a file with a planted duplicate, blank cells and variants like assam and obc gives a clean file and a problem report.
FR-22	A simple admin page shall let the team add or edit scholarships.	Could	Built only if all other work is finished; not needed for the demo.

5.2 Non-functional requirements
Area	Requirement for this project
Usability	Simple English and clear labels; a first-time user can finish the profile form in under 3 minutes; validation messages say exactly what to fix.
Performance	Filtered and ranked results appear within 3 seconds. The AI explanation may take up to 10 seconds and loads separately, without blocking the rest of the page.
Reliability	If the AI service fails, the site keeps working with template explanations. Bad input, a stopped backend or an unavailable LLM produce friendly messages and never crash the site.
Security and privacy	Passwords are stored hashed; API keys and secrets live in environment variables, never in code or on GitHub; all inputs are validated on the server. Only needed data is collected (no Aadhaar, no document uploads). The only data sent to the LLM is the five profile fields and one scholarship record, never email or password.
Compatibility	Latest versions of Chrome, Edge and Firefox; responsive layout for phones, tablets and desktops.
Maintainability	Shared Git repository with a README, a clear folder structure, comments in the code, API documentation and pull-request reviews.
Accuracy	Eligibility filtering is 100% correct against the official criteria on all test profiles. Recommendation quality target: Precision (Top 5) of 0.7 or higher.
Data quality	Every scholarship record has a source link and a last-checked date, and was verified against the official page.
Accessibility	Readable font sizes, good colour contrast, labels on all form fields, and status shown in words as well as colour.
Honesty	Every page tells students to confirm details on the official portal before applying; the product is presented as an academic prototype.
Scalability	Designed for at least 500 scholarship records and 20 simultaneous users, which is enough for a class demo.
6. Proposed solution and system design7
Architecture diagram

Figure 1. Architecture of Scholarship Sathi: frontend, backend API, SQLite, curated dataset, ML and AI module and the external LLM, with the direction of data flow.

How information moves
    • Step 1. The student opens the React website in a browser and registers or logs in.
    • Step 2. The frontend sends JSON requests to the FastAPI backend, with the login token.
    • Step 3. The backend validates the input and saves or reads the profile in SQLite.
    • Step 4. The backend loads the cleaned dataset and applies the rule-based filter (category, income, state, course, marks).
    • Step 5. The remaining scholarships are ranked by the ML module using TF-IDF and cosine similarity and returned with a match score.
    • Step 6. When the student opens a scholarship, the AI module sends the profile fields and the dataset record to the LLM; if it is slow, fails or returns an unsafe answer, the template explanation is used instead.
    • Step 7. The backend returns JSON and the website shows ranked cards, deadline alerts and the details page.
6.1 Modules and responsibilities
Module	Purpose / main functions	Owner (member ID)
Frontend / UI	React website: register and login, profile form with validation, search and filter panel, scholarship cards, details page with the AI explanation and Apply button, deadline alerts, responsive layout. Deliverables: working website, wireframes, frontend section of the report.	Sneha Kumari (Member 1)
Backend / API	FastAPI server: register and login with hashed passwords, profile save and update, server-side validation, secrets in environment variables, rule-based eligibility filter, recommendation, details, deadline and search endpoints, connection to the ML and AI functions, dataset reload, API documentation. Deliverables: working backend, API documentation, tested endpoints.	Saimon Sangma (Member 3): accounts, profiles, validation, security. Kongbrailatpam Shrishant Sharma (Member 4): eligibility rules, scholarship endpoints, integration.
Data / database	SQLite users and profiles tables; curated scholarship CSV with 17 columns; verification against official pages; cleaning script; one shared allowed-values file for categories, states and courses. Deliverables: verified dataset, cleaning script.	Prangshu (Member 2): dataset. Saimon Sangma (Member 3): SQLite.
ML / logic	Student profile to text query, TF-IDF vectoriser and cosine ranking with match score, LLM prompt grounded in the record and profile, fallback template, explanation cache. Deliverables: ranking module, AI explanation module.	Prangshu (Member 2)
Testing / integration	8 to 10 test profiles with a hand-made answer key, Precision (Top 5), Recall (Top 5) and F1-score, AI fact-check, bug log, end-to-end testing, usability test with 3 to 5 classmates, README, demo script and slides.	Led by Prangshu (Member 2). Every member tests their own part before handover; demo preparation led by Sneha Kumari and Prangshu.

Note: According to your project needs whatever required.
Evidence of contribution: Git commit history and pull requests per member, the task checklist for each role, the shared bug log and the test and evaluation sheets.

6.2 Technology stack
Layer	Chosen tool / technology	Reason for selection
Frontend	React.js with CSS (responsive design)	Component-based UI is quick to build and reuse (cards, forms) and works on phones, tablets and laptops.
Backend	Python with FastAPI (Flask is an accepted alternative)	Same language as the data and ML code; automatic API documentation; easy to test with Postman.
Database / storage	SQLite for user accounts and profiles; CSV or Excel file for the scholarship dataset	No server setup; the dataset is easy to edit and reload by hand (FR-20); enough for 500 records and a class demo.
ML / data libraries	pandas, scikit-learn (Tfidf Vectorizer, cosine similarity); an LLM through a hosted API (provider chosen on Day 1)	Standard, well-documented tools; TF-IDF needs no training data; the LLM writes plain-language explanations.
Development / version control	VS Code, Git and GitHub, Postman, Jupyter notebooks	Shared repository with pull-request reviews, API testing and quick ML experiments.
Deployment / hosting (if any)	Local setup on a team laptop for the demo; free hosting only if time remains	No cost and no dependency on external hosting during the presentation.

7. Dataset, inputs and data management
Item	Team response
Dataset / source name	Scholarship Sathi curated scholarship dataset: scholarships_raw.csv (typed by hand) and scholarships_clean.csv (output of the cleaning script).
Source URL / provider	National Scholarship Portal (https://scholarships.gov.in/); AICTE (https://www.aicte-india.org/); UGC (https://www.ugc.gov.in/); National Portal of India (https://www.india.gov.in/); official state scholarship portals. Each record stores its own source_url and application_url.
Access date and licence / usage terms	Each record stores a last_verified date, the day its official page was read. Records are typed by hand and summarised in the team's own words with a link back to the official page; nothing is copied in bulk or scraped. Where a portal states usage terms, the team follows them.
Privacy / safety measures	Only public information about scholarships is used. Test profiles are fictional. The app stores only name, email, hashed password and the five profile fields; no Aadhaar number or documents. Only the profile fields and one scholarship record are sent to the LLM.
Size and collection method	At least 20 verified records (stretch target 40; designed to handle 500). Collected by hand from official pages, split by source among members; Prangshu double-checks every row.
Data fields	scholarship_id, name, provider, category, income_limit, eligible_states, course, min_marks, qualification, deadline, benefits, benefit_amount, documents_required, application_url, source_url, description, last_verified.
Quality checks	The cleaning script removes duplicates, fills missing values with stated defaults, standardises category, state and course spellings from one shared allowed-values file, validates dates and links, and writes a problem report. Every record is checked against the official page.

8. Applied ML / algorithmic approach
Stage	Planned approach / decision
Problem type	Hybrid: rule-based eligibility filtering, text ranking and recommendation (TF-IDF and cosine similarity), and generative AI explanation (LLM) grounded in the dataset.
Preprocessing	pandas cleaning: trim spaces, remove duplicates, standardise categories, states and courses from the allowed list, fill missing values with stated defaults, parse dates and numbers; text lower-cased and common English stop words removed.
Feature engineering	A search_text column built from name, provider, category, course, state, qualification, benefits and description; one-hot columns for categories; a numeric benefit_amount. The student profile is converted to a short text query (category, course, state, income band and marks band words).
Baseline	Eligible scholarships listed without ranking (by deadline), and a simple keyword-overlap count; used to show whether TF-IDF improves Precision (Top 5).
Candidate model(s) / algorithm(s)	TF-IDF with cosine similarity (chosen: no labelled training data, small corpus, fast and explainable). Variants compared: unigrams versus unigrams plus bigrams, with and without stop words. LLM through an API for explanations.
Training / validation plan	No supervised training is needed. 8 to 10 fictional test profiles with a hand-made answer key (an eligible list and a best-fit list) are written before running the code, to avoid leakage. Settings are tuned on about half of the profiles and confirmed on the rest.
Evaluation metrics	Eligibility: exact match with the expected list (target 100%). Ranking: Precision (Top 5), Recall (Top 5) and F1-score, calculated using the top 5 recommendations (or top 3 when fewer than 5 results exist); target Precision (Top 5) of 0.7 or higher. AI: manual fact-check of at least 20 explanations (target zero invented facts) and response time.
Model serving / integration	Python modules called by the backend: the rule filter, then rank_scholarships, then get_explanation. The vectoriser is fitted once on the full dataset and refreshed after a reload. The explanation is fetched separately with a 9 to 10 second limit and cached; the template is returned on any failure.
Limitations / responsible use	Small hand-collected dataset; rules and deadlines can change; TF-IDF depends on how descriptions are worded; the match score is relative, not a probability; the LLM may invent facts, so it is given only dataset facts, its answer is checked and a template fallback exists. The prototype is not an official decision, and students must confirm everything on the official portal.


9. Team confirmation
We confirm that the information in this PRD reflects our current plan, that responsibilities have been discussed with all members, and that we will report changes or delays to our assigned faculty mentor.
Student name	Signature / acknowledgement	Date
Sneha Kumari	[Sign]	[Date]
Prangshu Pranjal Saikia	[Sign]	[Date]
Saimon Sangma	[Sign]	[Date]
Kongbrailatpam Shrishant Sharma	[Sign]	[Date]
