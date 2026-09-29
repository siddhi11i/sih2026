from fastapi import APIRouter, HTTPException, Query, Request
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.services.admin_service import (
    create_standard, update_standard, delete_standard,
    get_admin_activity_log, record_admin_activity
)
from app.services.auth_service import verify_access_token

router = APIRouter()

class StandardCreateSchema(BaseModel):
    is_number: str = Field(..., example="IS 19999:2026")
    title: str = Field(..., example="Fortified Organic Milk Powder - Specification")
    category: Optional[str] = "Milk & Dairy"
    year: Optional[str] = "2026"
    status: Optional[str] = "Current"
    scope_text: Optional[str] = None
    standard_type: Optional[str] = "Product Specification"
    admin_email: Optional[str] = "admin@bis.gov.in"
    admin_name: Optional[str] = "Chief Technical Director"

class StandardUpdateSchema(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    year: Optional[str] = None
    status: Optional[str] = None
    scope_text: Optional[str] = None
    standard_type: Optional[str] = None
    admin_email: Optional[str] = "admin@bis.gov.in"
    admin_name: Optional[str] = "Chief Technical Director"

@router.post("/standards")
def admin_create_standard(req: StandardCreateSchema, request: Request):
    try:
        admin_user = {"email": req.admin_email, "name": req.admin_name, "role": "admin"}
        result = create_standard(req.model_dump(), admin_user=admin_user)
        return {"status": "SUCCESS", "data": result}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/standards/{id_or_number}")
def admin_update_standard(id_or_number: str, req: StandardUpdateSchema, request: Request):
    try:
        admin_user = {"email": req.admin_email, "name": req.admin_name, "role": "admin"}
        result = update_standard(id_or_number, req.model_dump(exclude_unset=True), admin_user=admin_user)
        return {"status": "SUCCESS", "data": result}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/standards/{id_or_number}")
def admin_delete_standard(id_or_number: str, admin_email: Optional[str] = "admin@bis.gov.in", admin_name: Optional[str] = "Chief Technical Director"):
    try:
        admin_user = {"email": admin_email, "name": admin_name, "role": "admin"}
        result = delete_standard(id_or_number, admin_user=admin_user)
        return {"status": "SUCCESS", "data": result}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/activity")
def list_admin_activity(limit: int = Query(50, ge=1, le=200)):
    return get_admin_activity_log(limit=limit)
