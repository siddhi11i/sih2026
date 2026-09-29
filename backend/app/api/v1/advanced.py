from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import datetime
import json
from app.db.database import execute_query, execute_insert_or_update
from app.services.advanced_features import (
    detect_restrictive_spec,
    get_testing_labs_and_methods,
    get_international_equivalents,
    generate_draft_specification,
    extract_requirements_and_recommend_bulk
)

router = APIRouter()

class BulkRecommendRequest(BaseModel):
    tender_text: str

class RestrictiveSpecCheckRequest(BaseModel):
    specification_text: str

class SaveTenderRequest(BaseModel):
    tender_title: str
    organization: Optional[str] = "Procuring Authority"
    items: List[Dict[str, Any]]

class SupplierCheckRequest(BaseModel):
    tender_standard_required: str
    supplier_product_name: str
    supplier_standard_certified: str
    has_isi_license: bool
    isi_license_number: Optional[str] = None
    test_lab_accredited: bool = True

@router.post("/bulk-recommend")
def bulk_recommend(req: BulkRecommendRequest):
    if not req.tender_text or len(req.tender_text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Tender text cannot be empty")
    return extract_requirements_and_recommend_bulk(req.tender_text)

@router.post("/detect-restrictive-spec")
def check_restrictive_spec(req: RestrictiveSpecCheckRequest):
    return detect_restrictive_spec(req.specification_text)

@router.get("/testing-labs/{standard_number}")
def get_labs(standard_number: str):
    return get_testing_labs_and_methods(standard_number)

@router.get("/international-equivalents/{standard_number}")
def get_intl_equivalents(standard_number: str):
    return get_international_equivalents(standard_number)

@router.get("/draft-specification/{standard_number}")
def get_draft_spec(standard_number: str):
    return generate_draft_specification(standard_number)

@router.post("/saved-tenders")
def save_tender(req: SaveTenderRequest):
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    items_json = json.dumps(req.items)
    
    # Check for revision alerts on referenced standards
    alerts = []
    for item in req.items:
        is_num = item.get("is_number", "")
        if "1165" in is_num:
            alerts.append(f"Notice for {is_num}: Amendment 1 active (2025). Ensure latest Clause 2 test methods are referenced.")

    row_id = execute_insert_or_update(
        """
        INSERT INTO saved_tenders (tender_title, organization, created_at, updated_at, items_json, status_alerts)
        VALUES (?, ?, ?, ?, ?, ?);
        """,
        (req.tender_title, req.organization, now_str, now_str, items_json, "; ".join(alerts))
    )
    return {"status": "SUCCESS", "tender_id": row_id, "alerts": alerts}

@router.get("/saved-tenders")
def list_saved_tenders():
    rows = execute_query("SELECT * FROM saved_tenders ORDER BY id DESC LIMIT 50;")
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "tender_title": r["tender_title"],
            "organization": r["organization"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "items": json.loads(r["items_json"]) if r["items_json"] else [],
            "status_alerts": r["status_alerts"]
        })
    return result

@router.post("/supplier-check")
def check_supplier_conformance(req: SupplierCheckRequest):
    req_clean = req.tender_standard_required.lower().strip()
    sup_clean = req.supplier_standard_certified.lower().strip()

    is_standard_matched = (
        req_clean in sup_clean or
        sup_clean in req_clean or
        ("1165" in req_clean and "1165" in sup_clean) or
        ("1005" in req_clean and "1005" in sup_clean)
    )

    is_compliant = is_standard_matched and req.has_isi_license and req.test_lab_accredited

    findings = []
    if not is_standard_matched:
        findings.append(f"Standard Mismatch: Tender requires '{req.tender_standard_required}' but product is certified to '{req.supplier_standard_certified}'.")
    if not req.has_isi_license:
        findings.append("Missing BIS ISI Mark License: Product does not carry mandatory BIS certification marking.")
    if not req.test_lab_accredited:
        findings.append("Lab Accreditation Warning: Test certificate is not issued by a NABL/BIS accredited laboratory.")

    return {
        "conformance_status": "COMPLIANT" if is_compliant else "NON_COMPLIANT",
        "conformance_score_pct": 100 if is_compliant else (50 if is_standard_matched else 15),
        "is_eligible_to_bid": is_compliant,
        "findings": findings,
        "actionable_guidance": "Product meets tender standards specifications. Ensure valid ISI license copy is attached." if is_compliant else "Resolve compliance gaps before submitting bid."
    }
