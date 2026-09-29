import pytest
import os
import sys
from fastapi.testclient import TestClient

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert data["standards_indexed"] == 3144

def test_recommend_post():
    payload = {"tender": "Supply of packaged pasteurized toned milk and skimmed milk powder"}
    res = client.post("/api/v1/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_found"] > 0
    assert len(data["standards"]) > 0
    top = data["standards"][0]
    assert "is_number" in top
    assert "match_tier" in top
    assert top["match_tier"] in ["High", "Medium", "Low"]

def test_recommend_whole_milk_powder_frontend_path():
    """Validates the exact payload and endpoint path used by the React frontend for 'whole milk powder'."""
    payload = {
        "tender": "whole milk powder",
        "category_filter": None,
        "status_filter": None,
        "year_min": None,
        "top_k": 12
    }
    res = client.post("/api/v1/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_found"] > 0
    assert data["is_non_food"] is False
    # Check that IS 1165 (Whole Milk Powder) is in the top recommendations
    is_numbers = [s["is_number"] for s in data["standards"]]
    assert any("1165" in num for num in is_numbers)
    # Check that the top standard has High relevance tier
    assert data["standards"][0]["match_tier"] == "High"
    assert data["standards"][0]["match_pct"] >= 75

def test_allied_standards_is1165():
    res = client.get("/api/v1/allied/IS 1165")
    assert res.status_code == 200
    data = res.json()
    assert data["has_verified_data"] is True
    assert data["data_status"] == "EXTRACTED-UNVERIFIED"
    assert len(data["all_allied"]) >= 8
    # check relationships exist
    assert "test_method" in data["grouped_allied"]
    assert "sampling" in data["grouped_allied"]

def test_allied_missing_standard():
    res = client.get("/api/v1/allied/IS 12942")
    assert res.status_code == 200
    data = res.json()
    assert data["has_verified_data"] is False
    assert "No verified allied data yet" in data["notice"]

def test_compliance_endpoint():
    res = client.get("/api/v1/compliance/IS 1165")
    assert res.status_code == 200
    data = res.json()
    assert data["data_status"] == "SAMPLE - verify before use"
    assert "SAMPLE" in data["notice"]

def test_compare_endpoint():
    payload = {"standard_ids": [1, 2, 3]}
    res = client.post("/api/v1/compare", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["standards"]) == 3

def test_data_readiness_endpoint():
    res = client.get("/api/v1/data/readiness")
    assert res.status_code == 200
    data = res.json()
    assert data["canonical_standards_count"] == 3144
    assert data["data_readiness_pct"] >= 80.0

def test_chatbot_grounded_response():
    payload = {"message": "How do I search for Indian Standards?", "current_screen": "search"}
    res = client.post("/api/v1/chatbot/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["sources_cited"]) > 0
    assert data["confidence_grounded"] is True

def test_chatbot_unresolved_fallback():
    payload = {"message": "What is the best recipe for baking chocolate cake at 200C?", "current_screen": "search"}
    res = client.post("/api/v1/chatbot/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "I don't know" in data["reply"]
    assert data["can_escalate"] is True

def test_bulk_recommend_endpoint():
    payload = {"tender_text": "Item 1: Pasteurized milk pouches\nItem 2: Whole milk powder 25kg"}
    res = client.post("/api/v1/advanced/bulk-recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert data[0]["line_number"] == 1
    assert "recommended_standards" in data[0]

def test_supplier_check_endpoint():
    payload = {
        "tender_standard_required": "IS 1165:2022",
        "supplier_product_name": "Premium Whole Milk Powder",
        "supplier_standard_certified": "IS 1165:2022",
        "has_isi_license": True,
        "isi_license_number": "CM/L-8472910",
        "test_lab_accredited": True
    }
    res = client.post("/api/v1/advanced/supplier-check", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["conformance_status"] == "COMPLIANT"
    assert data["is_eligible_to_bid"] is True

def test_saved_tenders_endpoint():
    payload = {
        "tender_title": "Mid-Day Meal 2026 Test Tender",
        "organization": "Department of School Education",
        "items": [{"is_number": "IS 1165:2022", "title": "Whole milk powder"}]
    }
    res = client.post("/api/v1/advanced/saved-tenders", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"

    list_res = client.get("/api/v1/advanced/saved-tenders")
    assert list_res.status_code == 200
    tenders = list_res.json()
    assert len(tenders) > 0

def test_developer_portal_endpoints():
    res = client.get("/api/v1/developer/docs-samples")
    assert res.status_code == 200
    data = res.json()
    assert "python_sample" in data
    assert "embed_widget_script" in data

    key_res = client.post("/api/v1/developer/keys/generate", json={"department": "GeM", "contact_email": "gem@gov.in"})
    assert key_res.status_code == 200
    assert "api_key" in key_res.json()

def test_testing_labs_and_draft_spec():
    res_labs = client.get("/api/v1/advanced/testing-labs/IS 1165")
    assert res_labs.status_code == 200
    assert len(res_labs.json()["accredited_labs"]) > 0

    res_spec = client.get("/api/v1/advanced/draft-specification/IS 1165")
    assert res_spec.status_code == 200
    assert len(res_spec.json()["key_specification_clauses"]) > 0

def test_admin_standards_crud_and_activity_log():
    # 1. Add new standard
    payload = {
        "is_number": "IS 99887:2026",
        "title": "Fortified Camel Milk Powder - Specification",
        "category": "Milk & Dairy",
        "year": "2026",
        "status": "Current",
        "scope_text": "Requirements and hygiene limits for fortified camel milk powder."
    }
    create_res = client.post("/api/v1/admin/standards", json=payload)
    assert create_res.status_code == 200
    assert create_res.json()["status"] == "SUCCESS"

    # 2. Update standard
    update_res = client.put("/api/v1/admin/standards/IS 99887:2026", json={
        "title": "Fortified Camel Milk Powder - Specification (Revised)",
        "year": "2027"
    })
    assert update_res.status_code == 200
    assert update_res.json()["data"]["year"] == "2027"

    # 3. Check activity log
    activity_res = client.get("/api/v1/admin/activity")
    assert activity_res.status_code == 200
    logs = activity_res.json()
    assert len(logs) > 0
    assert any("IS 99887:2026" in l["entity_id"] for l in logs)

    # 4. Delete standard
    del_res = client.delete("/api/v1/admin/standards/IS 99887:2026")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "SUCCESS"

