from fastapi import APIRouter, Query, HTTPException, Response, Request
from typing import Optional, List
from app.schemas.standards import (
    RecommendRequest, RecommendResponse, RecommendationItem,
    StandardItem, CompareRequest, CompareResponse,
    AlliedGraphResponse, ComplianceDetailResponse
)
from app.services.query_preprocessor import clean_and_normalize_query
from app.services.hybrid_retriever import HybridRetriever
from app.services.clarifier import check_clarification_needed
from app.services.allied_service import get_allied_standards
from app.services.compliance_service import get_compliance_details
from app.services.export_service import generate_docx_tender_report, generate_csv_export
from app.services.audit_service import log_recommendation_audit
from app.db.database import execute_query

router = APIRouter()

@router.post("/recommend", response_model=RecommendResponse)
def recommend_post(req: RecommendRequest, request: Request):
    return handle_recommendation(
        tender_text=req.tender,
        category_filter=req.category_filter,
        standard_type_filter=req.standard_type_filter,
        status_filter=req.status_filter,
        year_min=req.year_min,
        top_k=req.top_k or 12,
        client_ip=request.client.host if request.client else "127.0.0.1"
    )

@router.get("/recommend", response_model=RecommendResponse)
def recommend_get(
    q: str = Query(..., description="Procurement technical statement or IS code"),
    category: Optional[str] = None,
    standard_type: Optional[str] = None,
    status: Optional[str] = None,
    year_min: Optional[int] = None,
    top_k: int = 12,
    request: Request = None
):
    client_ip = request.client.host if request and request.client else "127.0.0.1"
    return handle_recommendation(
        tender_text=q,
        category_filter=category,
        standard_type_filter=standard_type,
        status_filter=status,
        year_min=year_min,
        top_k=top_k,
        client_ip=client_ip
    )

def handle_recommendation(
    tender_text: str,
    category_filter: Optional[str] = None,
    standard_type_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    year_min: Optional[int] = None,
    top_k: int = 12,
    client_ip: str = "127.0.0.1"
) -> RecommendResponse:
    cleaned_q, detected_lang, expanded_tokens = clean_and_normalize_query(tender_text)
    
    # Check for clarification needs on ambiguous inputs
    clarification_q = check_clarification_needed(tender_text)
    
    retriever = HybridRetriever.get_instance()
    results, is_non_food = retriever.retrieve(
        cleaned_query=cleaned_q,
        category_filter=category_filter,
        standard_type_filter=standard_type_filter,
        status_filter=status_filter,
        year_min=year_min,
        top_k=top_k
    )

    rec_items = [RecommendationItem(**r) for r in results]

    # Generate formatted text
    formatted_lines = [
        f"Input Scope: {tender_text.strip()}",
        f"Detected Language: {detected_lang.upper()} | Cleaned Query: {cleaned_q}",
        f"Recommended Indian Standards ({len(rec_items)} matches found):",
        ""
    ]
    for idx, r in enumerate(rec_items, 1):
        formatted_lines.append(f"{idx}) {r.is_number} ({r.year or 'N/A'}) - {r.title} [Match: {r.match_pct}% | Tier: {r.match_tier}]")
        if r.why_matched:
            formatted_lines.append(f"   Why: {', '.join(r.why_matched)}")

    if is_non_food:
        formatted_lines.append("\nNote: The input appears to be non-food or out of the Food & Dairy scope. General quality assurance standards are shown.")

    # Audit log
    top_std = rec_items[0].is_number if rec_items else None
    log_recommendation_audit(
        query_text=tender_text,
        results_count=len(rec_items),
        top_standard=top_std,
        data_version="v1.0.0",
        client_ip=client_ip
    )

    return RecommendResponse(
        query_original=tender_text,
        query_cleaned=cleaned_q,
        detected_language=detected_lang,
        is_non_food=is_non_food,
        requires_clarification=clarification_q is not None,
        clarification=clarification_q,
        total_found=len(rec_items),
        standards=rec_items,
        formatted="\n".join(formatted_lines),
        data_version="v1.0.0"
    )

@router.get("/standards", response_model=List[StandardItem])
def list_standards(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    category: Optional[str] = None,
    search: Optional[str] = None
):
    query = "SELECT * FROM standards WHERE 1=1"
    params = []
    if category:
        query += " AND category LIKE ?"
        params.append(f"%{category}%")
    if search:
        query += " AND (is_number LIKE ? OR title LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    query += " LIMIT ? OFFSET ?;"
    params.extend([limit, offset])

    rows = execute_query(query, tuple(params))
    return [StandardItem(**r) for r in rows]

@router.get("/standards/{id_or_number}")
def get_standard_by_id(id_or_number: str):
    if id_or_number.isdigit():
        rows = execute_query("SELECT * FROM standards WHERE id = ?;", (int(id_or_number),))
    else:
        rows = execute_query("SELECT * FROM standards WHERE is_number LIKE ? OR clean_number LIKE ?;", (f"%{id_or_number}%", f"%{id_or_number}%"))
    if not rows:
        raise HTTPException(status_code=404, detail=f"Standard '{id_or_number}' not found")
    
    std = dict(rows[0])
    allied = get_allied_standards(std["is_number"])
    compliance = get_compliance_details(std["is_number"])
    return {
        "standard": std,
        "allied_data": allied,
        "compliance_data": compliance
    }

@router.get("/allied/{id_or_number}", response_model=AlliedGraphResponse)
def get_allied_graph(id_or_number: str):
    return get_allied_standards(id_or_number)

@router.get("/compliance/{id_or_number}", response_model=ComplianceDetailResponse)
def get_compliance_info(id_or_number: str):
    return get_compliance_details(id_or_number)

@router.post("/compare", response_model=CompareResponse)
def compare_standards(req: CompareRequest):
    if not req.standard_ids or len(req.standard_ids) < 2 or len(req.standard_ids) > 4:
        raise HTTPException(status_code=400, detail="Please select between 2 and 4 standards for comparison")

    placeholders = ",".join("?" for _ in req.standard_ids)
    rows = execute_query(f"SELECT * FROM standards WHERE id IN ({placeholders}) OR sno IN ({placeholders});", tuple(req.standard_ids) + tuple(req.standard_ids))
    
    if not rows:
        # Fallback to in-memory retriever standards if db query empty
        retriever = HybridRetriever.get_instance()
        matched = [s for s in retriever.standards if s.get("id") in req.standard_ids or s.get("sno") in req.standard_ids][:len(req.standard_ids)]
        rows = matched

    standards = [StandardItem(**r) for r in rows]

    allied_comp = {}
    comp_comp = {}
    for s in standards:
        allied_comp[s.is_number] = get_allied_standards(s.is_number).model_dump()
        comp_comp[s.is_number] = get_compliance_details(s.is_number).model_dump()

    return CompareResponse(
        standards=standards,
        allied_comparison=allied_comp,
        compliance_comparison=comp_comp
    )

@router.post("/export/docx")
def export_docx(req: RecommendRequest):
    cleaned_q, _, _ = clean_and_normalize_query(req.tender)
    retriever = HybridRetriever.get_instance()
    results, _ = retriever.retrieve(cleaned_q, top_k=req.top_k or 12)
    docx_bytes = generate_docx_tender_report(results, req.tender)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=BIS_Standards_Annexure.docx"}
    )

@router.post("/export/csv")
def export_csv(req: RecommendRequest):
    cleaned_q, _, _ = clean_and_normalize_query(req.tender)
    retriever = HybridRetriever.get_instance()
    results, _ = retriever.retrieve(cleaned_q, top_k=req.top_k or 12)
    csv_text = generate_csv_export(results, req.tender)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=BIS_Standards_Schedule.csv"}
    )
