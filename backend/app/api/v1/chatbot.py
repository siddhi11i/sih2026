from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.schemas.standards import ChatbotMessageRequest, ChatbotMessageResponse
from app.services.chatbot_service import handle_chatbot_query, create_support_ticket

router = APIRouter()

class TicketCreateRequest(BaseModel):
    user_query: str
    user_email: Optional[str] = "procurement.officer@gov.in"
    context_screen: Optional[str] = "search"
    reason: Optional[str] = "Escalated from AI Assistant"

@router.post("/message", response_model=ChatbotMessageResponse)
def post_chatbot_message(req: ChatbotMessageRequest):
    return handle_chatbot_query(
        message=req.message,
        current_screen=req.current_screen or "search",
        language=req.language or "en"
    )

@router.post("/ticket")
def post_support_ticket(req: TicketCreateRequest):
    return create_support_ticket(
        user_query=req.user_query,
        user_email=req.user_email,
        context_screen=req.context_screen or "search",
        reason=req.reason
    )
