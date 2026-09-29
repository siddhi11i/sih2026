from fastapi import APIRouter
from typing import Dict, Any
from app.services.eval_harness import evaluate_system

router = APIRouter()

@router.get("/run")
def run_evaluation_benchmark():
    return evaluate_system()
