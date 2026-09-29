from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.schemas.standards import ReviewSubmitRequest
from app.services.audit_service import record_human_review, get_recent_audit_logs, get_human_reviews

router = APIRouter()

@router.post("/review/submit")
def submit_human_review(req: ReviewSubmitRequest):
    row_id = record_human_review(
        query_text=req.query_text,
        standard_number=req.standard_number,
        decision=req.decision,
        reviewer_name=req.reviewer_name,
        reviewer_role=req.reviewer_role,
        feedback=req.feedback
    )
    return {"status": "SUCCESS", "review_id": row_id, "message": f"Review recorded: {req.decision}"}

@router.get("/logs")
def list_audit_logs(limit: int = 50):
    return get_recent_audit_logs(limit)

@router.get("/reviews")
def list_reviews(limit: int = 50):
    return get_human_reviews(limit)
