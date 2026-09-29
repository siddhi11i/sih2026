import os
import sys
from fastapi import APIRouter
from app.schemas.standards import DataReadinessResponse
from app.config import settings

if settings.BASE_DIR not in sys.path:
    sys.path.insert(0, settings.BASE_DIR)

from scripts.validate_data import run_data_validation

router = APIRouter()

@router.get("/readiness", response_model=DataReadinessResponse)
def get_data_readiness():
    report = run_data_validation()
    return DataReadinessResponse(
        timestamp=report["timestamp"],
        canonical_standards_count=report["canonical_standards_count"],
        real_standards_count=report["summary"]["real_standards_count"],
        allied_links_count=report["summary"]["allied_links_count"],
        compliance_rules_count=report["summary"]["compliance_rules_count"],
        eval_benchmark_queries=report["summary"]["eval_benchmark_queries"],
        data_readiness_pct=report["summary"]["data_readiness_pct"],
        data_version="v1.0.0",
        files_status=report["files_inspected"]
    )
