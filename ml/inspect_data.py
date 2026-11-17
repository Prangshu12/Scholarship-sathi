import pandas as pd
df = pd.read_csv("data/Scholarship_clean.csv")
print(df.head())
print("Dataset shape:", df.shape)
print("Columns:", df.columns.tolist())
print("\n--- MISSING VALUES ---")
print(df.isnull().sum())
print("Duplicate rows:", df.duplicated().sum())
print("Duplicate names:", df["name"].duplicated().sum())
print("\n--- SAMPLE ELIGIBILITY VALUES ---")

for column in ["caste", "course", "eligible states", "gender"]:
    print(f"\n{column}:")
    print(df[column].value_counts().head(10))
print("\n--- SAMPLE SCHOLARSHIP RECORDS ---")

print(
    df[["name", "income limit", "eligible states",
        "caste", "course", "benefit amount",
        "application deadline"]]
    .sample(10, random_state=42)
    .to_string(index=False)
)
print("\n--- SCHOLARSHIPS WITH NO COURSE INFORMATION ---")

missing_courses = df[df["course"].isna()]

print("Number of records:", len(missing_courses))
print(missing_courses[["name", "course", "eligible states"]].head(15).to_string(index=False))