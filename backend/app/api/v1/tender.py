from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.schemas.standards import TenderCheckRequest, TenderCheckResponse
from app.services.tender_parser import extract_text_from_file, check_tender_compliance

router = APIRouter()

@router.post("/check", response_model=TenderCheckResponse)
def check_tender_text(req: TenderCheckRequest):
    if not req.tender_text or len(req.tender_text.strip()) < 5:
        raise HTTPException(status_code=400, detail="Tender text cannot be empty.")
    return check_tender_compliance(req.tender_text, req.tender_file_name or "Tender Specification Text")

@router.post("/upload-and-check", response_model=TenderCheckResponse)
async def upload_and_check_tender(file: UploadFile = File(...)):
    contents = await file.read()
    extracted_text = extract_text_from_file(contents, file.filename)
    return check_tender_compliance(extracted_text, file.filename)
