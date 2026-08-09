import os
import base64
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def analyze_image(image_path):

    image_base64 = encode_image(image_path)

    response = client.chat.completions.create(
      model="qwen/qwen3.6-27b",
      messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": """
Analyze this image.

Return only JSON.

{
    "problem":"",
    "severity":"",
    "department":"",
    "description":""
}
"""
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    }
                }
            ]
        }
    ]
)
    return response.choices[0].message.content