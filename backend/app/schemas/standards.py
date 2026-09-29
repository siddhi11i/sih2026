from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class StandardItem(BaseModel):
    id: int
    sno: Optional[int] = None
    is_number: str
    clean_number: str
    title: str
    clean_title: str
    year: Optional[str] = None
    category: Optional[str] = "General & Allied"
    standard_type: Optional[str] = None
    status: Optional[str] = "Current"
    latest_version: Optional[str] = None
    amendment_no: Optional[str] = None
    scope_text: Optional[str] = None
    data_status: str = "REAL"
    last_verified: Optional[str] = None
    source: str = "BIS Official Dataset"
    is_amendment: bool = False

class AlliedStandardItem(BaseModel):
    standard_number: str
    year: Optional[str] = None
    title: str
    relationship_type: str  # test_method, sampling, packaging, labelling, terminology, safety, installation, related_product
    clause_reference: str
    mandatory: bool = True
    notes: Optional[str] = None
    data_status: str = "EXTRACTED-UNVERIFIED"

class AlliedGraphResponse(BaseModel):
    source_standard_number: str
    source_standard_title: str
    data_status: str
    has_verified_data: bool
    notice: Optional[str] = None
    grouped_allied: Dict[str, List[AlliedStandardItem]] = Field(default_factory=dict)
    all_allied: List[AlliedStandardItem] = Field(default_factory=list)

class ComplianceDetailResponse(BaseModel):
    standard_number: str
    year: Optional[str] = None
    title: Optional[str] = None
    qco_mandatory: bool = False
    qco_order_name: Optional[str] = None
    qco_notifying_ministry: Optional[str] = None
    qco_effective_date: Optional[str] = None
    isi_mark_mandatory: bool = False
    isi_certification_scheme: Optional[str] = None
    fssai_applicable: bool = False
    fssai_regulation: Optional[str] = None
    hsn_code: Optional[str] = None
    gem_category_id: Optional[str] = None
    gem_category_name: Optional[str] = None
    crs_applicable: bool = False
    crs_note: Optional[str] = "Not applicable to food products"
    hallmarking_applicable: bool = False
    hallmarking_note: Optional[str] = "Not applicable to food products"
    source: str = "BIS / Sample Registry"
    verification_url: Optional[str] = None
    last_verified: Optional[str] = None
    data_status: str = "SAMPLE - verify before use"
    has_verified_data: bool = False
    notice: str = "SAMPLE - verify before use in live tender documentation."

class RecommendationItem(BaseModel):
    id: int
    sno: Optional[int] = None
    is_number: str
    year: Optional[str] = None
    title: str
    category: Optional[str] = "General & Allied"
    standard_type: Optional[str] = None
    status: Optional[str] = "Current"
    amendment_no: Optional[str] = None
    data_status: str = "REAL"
    match_pct: int
    score: float
    match_tier: str  # High, Medium, Low
    why_matched: List[str] = Field(default_factory=list)
    matched_terms: List[str] = Field(default_factory=list)
    allied_count: int = 0
    compliance_summary: Optional[Dict[str, Any]] = None

class ClarificationChoice(BaseModel):
    label: str
    query_modifier: str
    description: Optional[str] = None

class ClarificationQuestion(BaseModel):
    topic: str
    question_text: str
    choices: List[ClarificationChoice]

class RecommendRequest(BaseModel):
    tender: str
    category_filter: Optional[str] = None
    standard_type_filter: Optional[str] = None
    status_filter: Optional[str] = None
    year_min: Optional[int] = None
    language: Optional[str] = "auto"
    top_k: Optional[int] = 12

class RecommendResponse(BaseModel):
    query_original: str
    query_cleaned: str
    detected_language: str
    is_non_food: bool
    requires_clarification: bool = False
    clarification: Optional[ClarificationQuestion] = None
    total_found: int
    standards: List[RecommendationItem]
    formatted: str
    data_version: str
    retrieval_method: str = "Hybrid BM25 + Dense Semantic + Cross-Ranking"

class CompareRequest(BaseModel):
    standard_ids: List[int]

class CompareResponse(BaseModel):
    standards: List[StandardItem]
    allied_comparison: Dict[str, Dict[str, Any]]
    compliance_comparison: Dict[str, Dict[str, Any]]

class DataReadinessResponse(BaseModel):
    timestamp: str
    canonical_standards_count: int
    real_standards_count: int
    allied_links_count: int
    compliance_rules_count: int
    eval_benchmark_queries: int
    data_readiness_pct: float
    data_version: str
    files_status: Dict[str, Any]

class TenderCheckRequest(BaseModel):
    tender_text: str
    tender_file_name: Optional[str] = None

class TenderCheckFinding(BaseModel):
    is_number_found: str
    found_in_dataset: bool
    canonical_standard: Optional[StandardItem] = None
    issue_type: str # valid, superseded, withdrawn, amendment_needed, missing_allied, not_in_dataset
    issue_severity: str # info, warning, critical
    message: str
    suggested_action: str
    allied_references_required: List[str] = Field(default_factory=list)

class TenderCheckResponse(BaseModel):
    tender_name: Optional[str] = "Tender Text Inspection"
    extracted_standards: List[str]
    total_standards_checked: int
    critical_issues_count: int
    warning_issues_count: int
    findings: List[TenderCheckFinding]
    compliance_summary_report: str

class ReviewSubmitRequest(BaseModel):
    query_text: str
    standard_number: str
    decision: str  # approved, rejected, edited
    reviewer_name: str
    reviewer_role: str  # drafter, reviewer, admin
    feedback: Optional[str] = None

class ChatbotMessageRequest(BaseModel):
    message: str
    current_screen: Optional[str] = "search"
    language: Optional[str] = "en"
    conversation_history: Optional[List[Dict[str, str]]] = Field(default_factory=list)

class ChatbotMessageResponse(BaseModel):
    reply: str
    sources_cited: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
    can_escalate: bool = False
    confidence_grounded: bool = True
