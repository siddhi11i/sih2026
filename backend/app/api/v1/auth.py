from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.auth_service import MOCK_USERS, create_access_token

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(req: LoginRequest):
    user = MOCK_USERS.get(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid departmental credentials")
    
    token = create_access_token(email=req.email, role=user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": req.email,
            "name": user["name"],
            "role": user["role"],
            "department": user["department"]
        }
    }
