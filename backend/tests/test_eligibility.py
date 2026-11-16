
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.eligibility import check_eligibility


profile = {
    "category": "General",
    "annual_income": 300000,
    "state": "Assam",
    "course": "BTech",
    "marks": 79
}

scholarship = {
    "category": "General",
    "income_limit": 300000,
    "eligible_states": "Assam, Manipur",
    "course": "BTech",
    "min_marks": 75
}

eligible, reasons = check_eligibility(profile, scholarship)

print("Eligible:", eligible)
print("Reasons:", reasons)
