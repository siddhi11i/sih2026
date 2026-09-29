#!/usr/bin/env python3
"""
Bureau of Indian Standards (BIS) — Standards Recommender Server
Food & Dairy Procurement Division • Government of India • Team Aavishkara (SIH26108)

Root launcher: Starts the FastAPI REST API and serves the production React frontend on Port 8080.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    print(f"==================================================================")
    print(f" 🏛️  Bureau of Indian Standards (BIS) — Standards Recommender Server")
    print(f" Department of Consumer Affairs • Government of India")
    print(f" Active at: http://localhost:{port}")
    print(f" API Docs:  http://localhost:{port}/docs")
    print(f" Ingested 3,144 Indian Standards (Food & Dairy Procurement)")
    print(f"==================================================================")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False, app_dir=BACKEND_DIR)
