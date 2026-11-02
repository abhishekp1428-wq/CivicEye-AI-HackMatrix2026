# Order matters: pehla match jeetta hai, isliye specific categories upar rakhi hain.
RULES = [
    {"keywords": ["street light", "streetlight", "light pole", "lamp post", "andhera", "light band", "batti band"],
     "problem": "Street Light Not Working", "severity": "Medium", "department": "Electricity Department"},
    {"keywords": ["sewage", "sewer", "manhole", "gutter", "naali", "nali", "drain", "drainage", "overflow", "nala"],
     "problem": "Sewage / Drainage Issue", "severity": "High", "department": "Sewerage & Drainage Department"},
    {"keywords": ["flood", "waterlogging", "water logging", "jal bharav", "baadh", "paani bhar"],
     "problem": "Waterlogging / Flooding", "severity": "High", "department": "Disaster Management / Drainage Department"},
    {"keywords": ["pani", "paani", "water", "leak", "pipeline", "pipe", "tanker", "nal", "tap", "supply"],
     "problem": "Water Supply Issue", "severity": "High", "department": "Water Supply Department"},
    {"keywords": ["bijli", "electric", "power cut", "transformer", "wire", "tar", "current", "short circuit", "voltage", "meter"],
     "problem": "Electricity Issue", "severity": "High", "department": "Electricity Department"},
    {"keywords": ["pothole", "gadda", "gaddha", "gade", "road", "sadak", "crack", "tuti", "damaged road", "speed breaker"],
     "problem": "Road Damage", "severity": "Medium", "department": "Public Works Department"},
    {"keywords": ["footpath", "pavement", "sidewalk", "patri"],
     "problem": "Footpath Damage", "severity": "Low", "department": "Public Works Department"},
    {"keywords": ["bridge", "pul", "flyover", "overbridge", "underpass"],
     "problem": "Bridge / Flyover Issue", "severity": "High", "department": "Public Works Department"},
    {"keywords": ["garbage", "kachra", "kooda", "kuda", "waste", "dustbin", "trash", "safai", "dump", "gandagi", "sweeping"],
     "problem": "Garbage / Sanitation Issue", "severity": "Medium", "department": "Sanitation Department"},
    {"keywords": ["toilet", "shauchalay", "public toilet", "urinal", "washroom"],
     "problem": "Public Toilet Issue", "severity": "Medium", "department": "Sanitation Department"},
    {"keywords": ["stray", "dog", "kutta", "kutte", "cow", "gai", "gaay", "cattle", "animal", "awara", "monkey", "bandar", "pig", "suar"],
     "problem": "Stray Animal Problem", "severity": "Medium", "department": "Animal Control / Municipal Corporation"},
    {"keywords": ["encroachment", "atikraman", "illegal construction", "illegal", "avaidh", "kabza", "illegal shop", "thela"],
     "problem": "Illegal Construction / Encroachment", "severity": "Medium", "department": "Town Planning Department"},
    {"keywords": ["traffic", "jam", "signal", "parking", "wrong parking", "no parking", "zebra", "traffic light"],
     "problem": "Traffic / Parking Issue", "severity": "Medium", "department": "Traffic Police / Transport Department"},
    {"keywords": ["tree", "ped", "branch", "fallen tree", "park", "garden", "bagicha", "bench", "playground"],
     "problem": "Tree / Park Maintenance", "severity": "Low", "department": "Horticulture / Parks Department"},
    {"keywords": ["noise", "shor", "loudspeaker", "dj", "speaker", "awaaz"],
     "problem": "Noise Pollution", "severity": "Low", "department": "Pollution Control Board"},
    {"keywords": ["smoke", "dhuan", "dhua", "pollution", "burning", "jalana", "air quality", "dust", "dhool", "factory"],
     "problem": "Air Pollution / Burning", "severity": "High", "department": "Pollution Control Board"},
    {"keywords": ["mosquito", "machhar", "dengue", "malaria", "fogging", "stagnant", "jama pani", "disease", "epidemic"],
     "problem": "Mosquito / Health Hazard", "severity": "High", "department": "Health Department"},
    {"keywords": ["school", "hospital", "dispensary", "clinic", "anganwadi", "building damage", "dilapidated", "jarjar"],
     "problem": "Public Building Issue", "severity": "Medium", "department": "Public Works Department"},
    {"keywords": ["bus stop", "bus stand", "shelter", "auto stand", "metro", "station"],
     "problem": "Public Transport Facility Issue", "severity": "Low", "department": "Transport Department"},
    {"keywords": ["hoarding", "banner", "poster", "billboard", "flex"],
     "problem": "Illegal Hoarding / Banner", "severity": "Low", "department": "Town Planning Department"},
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
