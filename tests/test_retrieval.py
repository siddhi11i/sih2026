import pytest
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from app.services.query_preprocessor import clean_and_normalize_query, detect_language
from app.services.hybrid_retriever import HybridRetriever
from app.services.clarifier import check_clarification_needed
from app.services.tender_parser import check_tender_compliance

def test_language_detection():
    assert detect_language("Pasteurized milk and butter") == "en"
    assert detect_language("पाश्चुरीकृत टोंड दूध की आपूर्ति") == "hi"
    assert detect_language("शालेय पोषण आहारासाठी गव्हाचे पीठ आणि तांदूळ खरेदी") == "mr"
    assert detect_language("பதப்படுத்தப்பட்ட பால் மற்றும் பால் பவுடர் கொள்முதல்") == "ta"
    assert detect_language("పాశ్చరైజ్డ్ పాలు మరియు పాల పొడి సేకరణ") == "te"
    assert detect_language("পাস্তুরিত দুধ এবং দুধের গুঁড়ো সরবরাহ") == "bn"
    assert detect_language("પાશ્ચરાઇઝ્ડ દૂધ અને મિલ્ક પાવડર ખરીદી") == "gu"
    assert detect_language("ಪಾಶ್ಚರೀಕರಿಸಿದ ಹಾಲು ಮತ್ತು ಹಾಲಿನ ಪುಡಿ ಸರಬರಾಜು") == "kn"
    assert detect_language("paschurised toned dudh aur skimmed doodh powder khareedna") == "hinglish"

def test_multilingual_indic_retrieval():
    retriever = HybridRetriever.get_instance()
    
    # Tamil Query for milk
    recs_ta, _ = retriever.retrieve("பதப்படுத்தப்பட்ட பால் மற்றும் பால் பவுடர் கொள்முதல்", top_k=5)
    assert len(recs_ta) > 0
    assert any("1165" in r["is_number"] or "milk" in r["title"].lower() for r in recs_ta)

    # Telugu Query for milk
    recs_te, _ = retriever.retrieve("పాశ్చరైజ్డ్ పాలు మరియు పాల పొడి సేకరణ", top_k=5)
    assert len(recs_te) > 0
    assert any("1165" in r["is_number"] or "milk" in r["title"].lower() for r in recs_te)

    # Bengali Query for milk
    recs_bn, _ = retriever.retrieve("পাস্তুরিত দুধ এবং দুধের গুঁড়ো সরবরাহ", top_k=5)
    assert len(recs_bn) > 0
    assert any("1165" in r["is_number"] or "milk" in r["title"].lower() for r in recs_bn)

    # Gujarati Query for milk
    recs_gu, _ = retriever.retrieve("પાશ્ચરાઇઝ્ડ દૂધ અને મિલ્ક પાવડર ખરીદી", top_k=5)
    assert len(recs_gu) > 0
    assert any("1165" in r["is_number"] or "milk" in r["title"].lower() for r in recs_gu)

    # Kannada Query for milk
    recs_kn, _ = retriever.retrieve("ಪಾಶ್ಚರೀಕರಿಸಿದ ಹಾಲು ಮತ್ತು ಹಾಲಿನ ಪುಡಿ ಸರಬರಾಜು", top_k=5)
    assert len(recs_kn) > 0
    assert any("1165" in r["is_number"] or "milk" in r["title"].lower() for r in recs_kn)

def test_query_normalization():
    cleaned, lang, tokens = clean_and_normalize_query("whol milk powdr packagng and fssai complianc")
    assert "milk" in cleaned
    assert "powder" in cleaned

def test_clarification_detector():
    cq1 = check_clarification_needed("Milk")
    assert cq1 is not None
    assert cq1.topic == "product_variety_and_packaging"

    cq2 = check_clarification_needed("Starch")
    assert cq2 is not None
    assert cq2.topic == "edible_vs_industrial"

    # Specific long query should NOT trigger clarification
    cq3 = check_clarification_needed("Procurement of pasteurized toned milk in 500ml food grade pouches")
    assert cq3 is None

def test_hybrid_retriever_is1165():
    retriever = HybridRetriever.get_instance()
    results, is_non_food = retriever.retrieve("Supply of whole milk powder for school meals", top_k=5)
    assert len(results) > 0
    assert not is_non_food
    # Check that IS 1165 or IS 11721 is among top results
    numbers = [r["is_number"] for r in results]
    assert any("1165" in n or "11721" in n for n in numbers)
    assert results[0]["match_pct"] >= 70

def test_non_food_out_of_scope():
    retriever = HybridRetriever.get_instance()
    results, is_non_food = retriever.retrieve("Procurement of modular ergonomic office workstations and laptop computers", top_k=5)
    assert is_non_food is True
    if len(results) > 0:
        assert results[0]["score"] < 0.40

def test_tender_compliance_checker():
    tender_snippet = """
    Tender Specification: Supply of Whole Milk Powder conforming to IS 1165:2022.
    Also required is civil construction cement IS 99999.
    """
    res = check_tender_compliance(tender_snippet, "Test Tender")
    assert res.total_standards_checked >= 1
    # Check that IS 99999 was flagged not_in_dataset
    issues = [f.issue_type for f in res.findings]
    assert "not_in_dataset" in issues or "missing_allied" in issues
