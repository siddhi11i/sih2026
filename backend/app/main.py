import os
import sys

# Ensure backend directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.api.v1.router import api_router
from app.services.hybrid_retriever import HybridRetriever

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm up hybrid retriever
    print("🚀 Initializing BIS Standards Recommender Engine...")
    retriever = HybridRetriever.get_instance()
    print(f"✅ Ingested {len(retriever.standards)} standards into Hybrid Memory Index.")
    yield
    print("🛑 Shutting down BIS Standards Recommender Engine.")

app = FastAPI(
    title="Bureau of Indian Standards (BIS) — Standards Recommender",
    description="Production-grade AI Decision-Support System for Indian Standards Procurement Conformance (SIH 2026, SIH26108, Team Aavishkara)",
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Direct compatibility aliases for legacy endpoints
from app.api.v1.standards import recommend_get, recommend_post, list_standards
app.add_api_route("/api/recommend", recommend_post, methods=["POST"], include_in_schema=False)
app.add_api_route("/api/recommend", recommend_get, methods=["GET"], include_in_schema=False)
app.add_api_route("/api/standards", list_standards, methods=["GET"], include_in_schema=False)

@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": "BIS Standards Recommender API",
        "version": settings.VERSION,
        "team": "Aavishkara (SIH26108)",
        "standards_indexed": 3144,
        "bhashini_enabled": settings.ENABLE_BHASHINI,
        "local_model_only": settings.LOCAL_MODEL_ONLY
    }

# Mount static frontend directory if built
DIST_DIR = os.path.join(settings.BASE_DIR, "frontend", "dist")
if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
