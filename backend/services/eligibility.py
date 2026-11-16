
def matches_allowed(value, allowed):
    if isinstance(allowed, str):
        if allowed.strip().lower() == "all":
            return True

        allowed = [item.strip() for item in allowed.split(",")]

    if not allowed:
        return False

    return str(value).strip().lower() in [
        str(item).strip().lower() for item in allowed
    ]


def check_eligibility(profile, scholarship):
    reasons = []

    if not matches_allowed(profile["category"], scholarship["category"]):
        reasons.append("Category not eligible")

    if float(profile["annual_income"]) > float(scholarship["income_limit"]):
        reasons.append("Family income exceeds limit")

    if not matches_allowed(profile["state"], scholarship["eligible_states"]):
        reasons.append("State not eligible")

    if not matches_allowed(profile["course"], scholarship["course"]):
        reasons.append("Course not eligible")

    if float(profile["marks"]) < float(scholarship["min_marks"]):
        reasons.append("Marks below minimum requirement")

    return len(reasons) == 0, reasons


def filter_eligible_scholarships(profile, scholarships):
    eligible_scholarships = []

    for scholarship in scholarships:
        eligible, reasons = check_eligibility(profile, scholarship)

        if eligible:
            eligible_scholarships.append(scholarship)

    return eligible_scholarships
