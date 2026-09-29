from fastapi import APIRouter
from app.api.v1.standards import router as standards_router
from app.api.v1.tender import router as tender_router
from app.api.v1.data import router as data_router
from app.api.v1.eval import router as eval_router
from app.api.v1.audit import router as audit_router
from app.api.v1.chatbot import router as chatbot_router
from app.api.v1.auth import router as auth_router
from app.api.v1.advanced import router as advanced_router
from app.api.v1.developer import router as developer_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter()

api_router.include_router(standards_router, tags=["Standards Recommendation"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin Control & Standard Management"])
api_router.include_router(tender_router, prefix="/tender", tags=["Tender Checker & Parser"])
api_router.include_router(data_router, prefix="/data", tags=["Data Readiness & Governance"])
api_router.include_router(eval_router, prefix="/eval", tags=["Evaluation Harness"])
api_router.include_router(audit_router, prefix="/audit", tags=["Audit Trail & Reviews"])
api_router.include_router(chatbot_router, prefix="/chatbot", tags=["AI Support Assistant"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(advanced_router, prefix="/advanced", tags=["Advanced Procurement & Supplier Features"])
api_router.include_router(developer_router, prefix="/developer", tags=["Developer Portal & Embeddable Widget"])

