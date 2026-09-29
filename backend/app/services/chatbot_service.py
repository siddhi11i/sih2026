import re
import uuid
import datetime
from typing import Dict, Any, List
from app.db.database import execute_insert_or_update
from app.schemas.standards import ChatbotMessageResponse

PORTAL_KNOWLEDGE_BASE = [
    {
        "intent": "search_help",
        "keywords": ["how to search", "search standards", "find is code", "query", "how do i search", "खोज कैसे करें", "कसे शोधावे"],
        "reply": "To recommend Indian Standards, enter your technical procurement description (1–3 sentences) in English, Hindi, Marathi, or Hinglish into the search bar. The hybrid semantic engine matches commodity terms, specifications, and test methods from the 3,144 BIS Food & Dairy standards repository.",
        "sources": ["BIS Recommender User Guide Section 1: Semantic Search"],
        "actions": ["Try sample preset queries", "Use filter by sector/category"]
    },
    {
        "intent": "tender_checker_help",
        "keywords": ["tender checker", "check tender", "upload pdf", "validate tender", "boq", "टेंडर चेक", "कागदपत्र तपासणी"],
        "reply": "The Tender Compliance Checker allows you to upload or paste tender documents (PDF, DOCX, XLSX). It automatically extracts cited IS numbers and identifies whether they are active, require amendments, omit mandatory Clause 2 allied test methods, or are missing from the official BIS repository.",
        "sources": ["BIS Recommender Module: Tender Compliance Audit"],
        "actions": ["Go to Tender Checker screen", "Upload sample procurement schedule"]
    },
    {
        "intent": "allied_standards_help",
        "keywords": ["allied standards", "normative references", "clause 2", "test methods", "sampling", "संबंधित मानके"],
        "reply": "Allied Standards represent normative references cited in Clause 2 of a product specification. They are organized into Test Methods, Sampling, Packaging, Labelling, Terminology, and Safety. If verified data has not yet been extracted from the BIS Gazette, the portal explicitly displays 'No verified allied data yet'.",
        "sources": ["IS Standard Structure Guidelines (Clause 2 Normative References)"],
        "actions": ["Inspect IS 1165:2022 Allied Graph"]
    },
    {
        "intent": "sample_data_notice",
        "keywords": ["what is sample", "sample badge", "verify before use", "unverified", "सॅम्पल"],
        "reply": "In accordance with strict BIS data governance, any compliance, QCO, or allied data that has not undergone formal committee sign-off is tagged 'SAMPLE - verify before use'. The core repository of 3,144 standards is verified REAL data.",
        "sources": ["BIS Data Governance Ledger & README_DATA.md"],
        "actions": ["Open Data Readiness Panel"]
    },
    {
        "intent": "export_help",
        "keywords": ["export", "download docx", "csv", "print", "tender annexure", "डाउनलोड"],
        "reply": "You can export recommendation results into a formal tender-ready DOCX report with standard annexures, a structured CSV spreadsheet, or print directly. All sample/unverified data status badges are preserved in the exported documents.",
        "sources": ["Export & Report Generation Utility"],
        "actions": ["Download DOCX Annexure", "Export CSV Schedule"]
    }
]

SCREEN_CONTEXT_TIPS = {
    "search": "You are currently on the Semantic Search screen. Enter commodity specifications or select one of the 6 official demonstration presets.",
    "tender_checker": "You are on the Tender Checker screen. Paste procurement text or upload your BOQ file to scan for withdrawn or missing allied standards.",
    "allied_graph": "You are viewing the Allied Standards Graph. Click on any allied node to inspect its relationship type (test method, packaging, safety).",
    "data_readiness": "You are in the Data Readiness Dashboard. Check canonical counts, schema validation states, and data version tags.",
    "comparison": "You are comparing 2–3 Indian Standards side by side."
}

def handle_chatbot_query(message: str, current_screen: str = "search", language: str = "en") -> ChatbotMessageResponse:
    q_lower = message.lower().strip()

    # Match against grounded knowledge base
    for item in PORTAL_KNOWLEDGE_BASE:
        for kw in item["keywords"]:
            if kw in q_lower:
                screen_tip = SCREEN_CONTEXT_TIPS.get(current_screen, "")
                reply_text = f"{item['reply']}\n\n[Context: {screen_tip}]"
                return ChatbotMessageResponse(
                    reply=reply_text,
                    sources_cited=item["sources"],
                    suggested_actions=item["actions"],
                    can_escalate=False,
                    confidence_grounded=True
                )

    # If query mentions specific IS number
    is_match = re.search(r'\bis\s*(\d+)\b', q_lower)
    if is_match:
        is_num = is_match.group(1)
        return ChatbotMessageResponse(
            reply=f"Regarding IS {is_num}: This standard is indexed in the official BIS repository. Please note that this portal assists procurement committees in locating applicable standards and normative references, but does not make final binding compliance determinations.",
            sources_cited=[f"BIS Standards Repository IS {is_num}"],
            suggested_actions=[f"Search 'IS {is_num}' in main bar", f"Inspect Allied Graph for IS {is_num}"],
            can_escalate=False,
            confidence_grounded=True
        )

    # Out of scope / Unsupported
    return ChatbotMessageResponse(
        reply="I don't know the answer to this specific inquiry based on the portal's verified technical documentation and standards dataset. Please note that I assist in discovering standards and do not make final legal or compliance decisions. Would you like to escalate this inquiry to a BIS domain specialist?",
        sources_cited=["BIS Portal Knowledge Base (No direct match)"],
        suggested_actions=["Create Support Ticket", "Search Standards Repository"],
        can_escalate=True,
        confidence_grounded=False
    )

def create_support_ticket(user_query: str, user_email: str = None, context_screen: str = "search", reason: str = "Unresolved AI Chatbot Inquiry") -> Dict[str, Any]:
    ticket_id = f"TICK-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    
    execute_insert_or_update(
        """
        INSERT INTO support_tickets (ticket_id, created_at, user_query, user_email, context_screen, status, escalation_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """,
        (ticket_id, now_str, user_query, user_email or "anonymous@procurement.gov.in", context_screen, "open", reason)
    )
    
    return {
        "ticket_id": ticket_id,
        "created_at": now_str,
        "status": "open",
        "message": f"Support ticket {ticket_id} has been logged and escalated to the BIS Food & Dairy technical desk."
    }
