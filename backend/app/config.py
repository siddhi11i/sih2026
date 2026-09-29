import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "BIS Standards Recommender"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    DB_PATH: str = os.path.join(DATA_DIR, "standards_portal.db")
    INCOMING_DIR: str = os.path.join(DATA_DIR, "incoming")
    STANDARDS_JSON: str = os.path.join(DATA_DIR, "standards.json")
    
    # Model & Retrieval Settings
    EMBEDDING_MODEL_NAME: str = "paraphrase-multilingual-MiniLM-L12-v2"
    LOCAL_MODEL_ONLY: bool = True
    ENABLE_BHASHINI: bool = False  # Bhashini integration is opt-in behind feature flag
    
    # Matching Thresholds
    TIER_HIGH_THRESHOLD: float = 0.75
    TIER_MEDIUM_THRESHOLD: float = 0.55
    TIER_LOW_THRESHOLD: float = 0.40
    NO_MATCH_THRESHOLD: float = 0.38
    
    # Security & Auth
    SECRET_KEY: str = "bis-standards-secret-key-sih26108-team-aavishkara"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    class Config:
        case_sensitive = True

settings = Settings()
