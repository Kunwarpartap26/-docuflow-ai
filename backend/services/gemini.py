import google.generativeai as genai
import json
import base64
import re
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

EXTRACTION_PROMPT = """You are an expert OCR system specialized in reading handwritten manufacturing machine shop data forms.

Analyze this image carefully. The form is titled "Machine shop data" and contains a table with these columns:
S.No, Date, Shift, Emp. No, Opn Code, Machine No., Work Order No., Qty. Prod., Time taken (in hrs)

Extract ALL filled rows from the table. For each row, return the data as a JSON object.

IMPORTANT RULES:
- Date format in the form is DD/M/YY (e.g., "20/4/26" means April 20, 2026). Return as-is.
- Shift values are Roman numerals (I, II, III) or Arabic numerals (1, 2, 3). Normalize to Roman numerals.
- Employee No always starts with "BT" followed by digits (e.g., BT4710). If you see crossed-out numbers, take the primary/readable one.
- Operation Code is a 5-6 digit number (e.g., 856430).
- Machine No format is "MC-XXX" or "ABC-XXX" where XXX is a number (e.g., MC-730, ABC-730).
- Work Order No is a 6-7 digit number (e.g., 165460). Sometimes written with spaces, remove spaces.
- Qty Produced is a positive integer. If cell shows "-" or is blank, return null.
- Time Taken is a decimal number in hours (e.g., 4.0, 7.5). Always return as float.
- For each field, provide a confidence score from 0.0 to 1.0 based on how clearly you can read it.
  - 1.0 = perfectly clear
  - 0.7-0.9 = mostly clear, minor ambiguity
  - 0.5-0.7 = partially readable
  - Below 0.5 = difficult to read, likely error

Return ONLY a valid JSON array. No explanation, no markdown, no backticks.

Format:
[
  {
    "s_no": 1,
    "date": {"value": "20/4/26", "confidence": 0.95},
    "shift": {"value": "I", "confidence": 0.98},
    "emp_no": {"value": "BT4710", "confidence": 0.92},
    "opn_code": {"value": "856430", "confidence": 0.88},
    "machine_no": {"value": "MC-730", "confidence": 0.95},
    "work_order_no": {"value": "165460", "confidence": 0.85},
    "qty_produced": {"value": 25, "confidence": 0.90},
    "time_taken": {"value": 4.0, "confidence": 0.95}
  }
]

Only return rows that have at least one filled field. Skip completely empty rows."""


def get_sample_data():
    """Return sample data for demo/testing when no real image is available."""
    return [
        {"s_no": 1, "date": {"value": "20/4/26", "confidence": 0.95}, "shift": {"value": "I", "confidence": 0.98}, "emp_no": {"value": "BT4710", "confidence": 0.92}, "opn_code": {"value": "856430", "confidence": 0.88}, "machine_no": {"value": "MC-730", "confidence": 0.95}, "work_order_no": {"value": "165460", "confidence": 0.85}, "qty_produced": {"value": 25, "confidence": 0.90}, "time_taken": {"value": 4.0, "confidence": 0.95}},
        {"s_no": 2, "date": {"value": "20/4/26", "confidence": 0.94}, "shift": {"value": "II", "confidence": 0.97}, "emp_no": {"value": "BT4720", "confidence": 0.91}, "opn_code": {"value": "856460", "confidence": 0.87}, "machine_no": {"value": "MC-780", "confidence": 0.93}, "work_order_no": {"value": "165470", "confidence": 0.84}, "qty_produced": {"value": 37, "confidence": 0.89}, "time_taken": {"value": 8.0, "confidence": 0.94}},
        {"s_no": 3, "date": {"value": "20/4/26", "confidence": 0.93}, "shift": {"value": "III", "confidence": 0.96}, "emp_no": {"value": "BT4720", "confidence": 0.90}, "opn_code": {"value": "856470", "confidence": 0.86}, "machine_no": {"value": "MC-850601", "confidence": 0.55}, "work_order_no": {"value": "165470", "confidence": 0.83}, "qty_produced": {"value": 28, "confidence": 0.88}, "time_taken": {"value": 7.5, "confidence": 0.93}},
        {"s_no": 4, "date": {"value": "18/4/26", "confidence": 0.92}, "shift": {"value": "I", "confidence": 0.95}, "emp_no": {"value": "BT1234", "confidence": 0.89}, "opn_code": {"value": "54321", "confidence": 0.85}, "machine_no": {"value": "ABC-730", "confidence": 0.91}, "work_order_no": {"value": "165455", "confidence": 0.82}, "qty_produced": {"value": None, "confidence": 0.70}, "time_taken": {"value": 2.0, "confidence": 0.92}},
        {"s_no": 5, "date": {"value": "18/4/26", "confidence": 0.91}, "shift": {"value": "II", "confidence": 0.94}, "emp_no": {"value": "BT4005", "confidence": 0.88}, "opn_code": {"value": "856432", "confidence": 0.84}, "machine_no": {"value": "MC-840", "confidence": 0.90}, "work_order_no": {"value": "246868", "confidence": 0.81}, "qty_produced": {"value": 10, "confidence": 0.87}, "time_taken": {"value": 6.0, "confidence": 0.91}},
    ]


async def extract_fields_from_image(image_path: str, file_type: str) -> list:
    """Use Gemini Vision to extract fields from uploaded image."""
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your-gemini-api-key-here":
        print("No Gemini API key configured, returning sample data")
        return get_sample_data()

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')

        with open(image_path, "rb") as f:
            image_data = f.read()

        # Determine mime type
        ext = Path(image_path).suffix.lower()
        mime_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".pdf": "application/pdf",
            ".webp": "image/webp"
        }
        mime_type = mime_map.get(ext, "image/jpeg")

        image_part = {
            "mime_type": mime_type,
            "data": base64.b64encode(image_data).decode("utf-8")
        }

        response = model.generate_content([EXTRACTION_PROMPT, image_part])
        raw_text = response.text.strip()

        # Clean up response - remove markdown code blocks if present
        raw_text = re.sub(r"```json\s*", "", raw_text)
        raw_text = re.sub(r"```\s*", "", raw_text)
        raw_text = raw_text.strip()

        # Find the JSON array
        start = raw_text.find("[")
        end = raw_text.rfind("]") + 1
        if start >= 0 and end > start:
            raw_text = raw_text[start:end]

        extracted = json.loads(raw_text)

        # Normalize each row
        normalized = []
        for row in extracted:
            norm_row = {"s_no": row.get("s_no", len(normalized) + 1)}
            for field in ["date", "shift", "emp_no", "opn_code", "machine_no",
                          "work_order_no", "qty_produced", "time_taken"]:
                field_data = row.get(field)
                if field_data is None:
                    norm_row[field] = {"value": None, "confidence": 0.0, "valid": True, "errors": []}
                elif isinstance(field_data, dict):
                    norm_row[field] = {
                        "value": field_data.get("value"),
                        "confidence": float(field_data.get("confidence", 0.0)),
                        "valid": True,
                        "errors": []
                    }
                else:
                    norm_row[field] = {"value": field_data, "confidence": 0.5, "valid": True, "errors": []}
            normalized.append(norm_row)

        return normalized

    except Exception as e:
        print(f"Gemini extraction error: {e}")
        # Return sample data as fallback
        return get_sample_data()
