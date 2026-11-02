import os
import json
import mimetypes
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)

MODEL_NAME = "gemini-3.8-flash"


def analyze_image(image_path, complaint_title=""):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    path = Path(image_path)

    if not path.is_file():
        raise FileNotFoundError(f"Image not found: {path}")

    mime_type = mimetypes.guess_type(str(path))[0] or "image/jpeg"

    prompt = f"""
    Analyze this civic complaint using BOTH the title and image.

    User complaint title: {complaint_title}

    Identify the actual issue visible in the image.
    Compare it with the user's title.
    If they do not match, mention the mismatch in the description.

    Return only valid JSON with exactly these keys:
    {{
        "problem": "short problem title",
        "severity": "Low, Medium or High",
        "department": "responsible municipal department",
        "description": "2-3 sentence explanation"
    }}

    Do not invent details that are not visible.
    """

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[
            prompt,
            types.Part.from_bytes(
                data=path.read_bytes(),
                mime_type=mime_type
            )
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    if not response.text:
        raise ValueError("Gemini returned an empty response")

    parsed = json.loads(response.text)

    required = {"problem", "severity", "department", "description"}

    if not isinstance(parsed, dict) or set(parsed.keys()) != required:
        raise ValueError("Invalid AI response structure")

    if parsed["severity"] not in {"Low", "Medium", "High"}:
        raise ValueError("Invalid severity value")

    return json.dumps(parsed, ensure_ascii=False)
