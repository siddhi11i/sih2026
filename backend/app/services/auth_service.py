import datetime
import jwt
from typing import Optional, Dict, Any
from app.config import settings

MOCK_USERS = {
    "admin@bis.gov.in": {"name": "Chief Technical Director", "role": "admin", "department": "BIS Food & Dairy Division"},
    "reviewer@bis.gov.in": {"name": "Technical Verification Officer", "role": "reviewer", "department": "Standards Enforcement Cell"},
    "drafter@procure.gov.in": {"name": "Procurement Drafting Executive", "role": "drafter", "department": "Department of Consumer Affairs"}
}

def create_access_token(email: str, role: str, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = {"sub": email, "role": role}
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None
