from fastapi import APIRouter
from pydantic import BaseModel
import uuid

router = APIRouter()

class ApiKeyGenerateRequest(BaseModel):
    department: str
    contact_email: str

@router.post("/keys/generate")
def generate_api_key(req: ApiKeyGenerateRequest):
    key = f"bis_live_{uuid.uuid4().hex}"
    return {
        "api_key": key,
        "department": req.department,
        "rate_limit": "1000 requests/minute",
        "created_at": "2026-09-28T14:40:00Z"
    }

@router.get("/docs-samples")
def get_developer_samples():
    return {
        "python_sample": (
            "import requests\n"
            "headers = {'Content-Type': 'application/json'}\n"
            "payload = {'tender': 'Supply of whole milk powder and butter'}\n"
            "res = requests.post('http://localhost:8080/api/v1/recommend', json=payload, headers=headers)\n"
            "print(res.json()['standards'])"
        ),
        "curl_sample": (
            "curl -X POST http://localhost:8080/api/v1/recommend \\\n"
            "  -H 'Content-Type: application/json' \\\n"
            "  -d '{\"tender\": \"Procurement of edible sunflower oil and vanaspati\"}'"
        ),
        "embed_widget_script": (
            "<script src=\"http://localhost:8080/assets/bis-widget.js\"></script>\n"
            "<div id=\"bis-standards-widget\" data-theme=\"dark\" data-division=\"food_dairy\"></div>"
        )
    }
