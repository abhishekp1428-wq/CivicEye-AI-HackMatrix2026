
import os
import json
import base64
import mimetypes
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(
    Path(__file__).resolve().parents[2] / ".env",
    override=False
)

MODEL_NAME = "muse-spark-1.3"

PROMPT = """
Analyze this civic issue image, such as road damage,
garbage, water leakage or a broken streetlight.

Return only valid JSON with exactly these keys:
{
    "problem": "short title",
    "severity": "Low, Medium or High",
    "department": "responsible municipal department",
    "description": "2-3 sentence description"
}

Describe only visible details. Do not invent information.
"""


def analyze_image(image_path):
    api_key = os.getenv("MODEL_API_KEY")

    if not api_key:
        raise RuntimeError("MODEL_API_KEY is not configured")

    path = Path(image_path)

    if not path.is_file():
        raise FileNotFoundError(f"Image not found: {path}")

    mime_type = mimetypes.guess_type(str(path))[0] or "image/jpeg"
    encoded = base64.b64encode(path.read_bytes()).decode("utf-8")
    image_data_url = f"data:{mime_type};base64,{encoded}"

    client = OpenAI(
        base_url="https://api.meta.ai/v1",
        api_key=api_key
    )

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {"url": image_data_url}
                    }
                ]
            }
        ]
    )

    result = response.choices[0].message.content

    if not result:
        raise ValueError("Meta API returned an empty response")

    parsed = json.loads(result)

    required = {"problem", "severity", "department", "description"}

    if set(parsed.keys()) != required:
        raise ValueError("Invalid AI response structure")

    if parsed["severity"] not in {"Low", "Medium", "High"}:
        raise ValueError("Invalid severity value")

    return json.dumps(parsed, ensure_ascii=False)
