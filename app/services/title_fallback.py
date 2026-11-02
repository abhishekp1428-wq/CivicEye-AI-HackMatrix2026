RULES = [
    {"keywords": ["pani", "water", "leak", "pipeline", "drain", "naali"],
     "problem": "Water / Drainage Issue", "severity": "High", "department": "Water Supply Department"},
    {"keywords": ["bijli", "light", "electric", "power", "pole", "wire"],
     "problem": "Electricity Issue", "severity": "High", "department": "Electricity Department"},
    {"keywords": ["road", "sadak", "pothole", "gadda", "gaddha"],
     "problem": "Road Damage", "severity": "Medium", "department": "Public Works Department"},
    {"keywords": ["garbage", "kachra", "safai", "waste", "dustbin"],
     "problem": "Garbage / Sanitation Issue", "severity": "Medium", "department": "Sanitation Department"},
]


def analyze_by_title(title=""):
    t = (title or "").lower()
    for rule in RULES:
        if any(k in t for k in rule["keywords"]):
            return {
                "problem": rule["problem"],
                "severity": rule["severity"],
                "department": rule["department"],
                "description": f"{rule['problem']} reported by citizen: \"{title}\". Auto-classified from the complaint title (AI image analysis unavailable). Please verify manually.",
            }
    return {
        "problem": "Not Available",
        "severity": "Medium",
        "department": "General",
        "description": "Automatic analysis unavailable. Please review manually.",
    }
