
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.eligibility import filter_eligible_scholarships

profile = {
    "category": "General",
    "annual_income": 200000,
    "state": "Assam",
    "course": "BTech",
    "marks": 85
}

scholarships = [
    {
        "name": "Scholarship A",
        "category": "General",
        "income_limit": 300000,
        "eligible_states": "Assam, Manipur",
        "course": "BTech",
        "min_marks": 75
    },
    {
        "name": "Scholarship B",
        "category": "OBC",
        "income_limit": 300000,
        "eligible_states": "Assam",
        "course": "BTech",
        "min_marks": 75
    },
    {
        "name": "Scholarship C",
        "category": "General",
        "income_limit": 150000,
        "eligible_states": "Assam",
        "course": "BTech",
        "min_marks": 75
    }
]

result = filter_eligible_scholarships(profile, scholarships)

print("Eligible scholarships:")

for scholarship in result:
    print(scholarship["name"])
