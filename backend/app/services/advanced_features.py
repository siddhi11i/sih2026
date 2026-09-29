import re
from typing import List, Dict, Any, Optional
from app.db.database import execute_query
from app.services.hybrid_retriever import HybridRetriever

PROPRIETARY_BRAND_INDICATORS = {
    "amul": "Amul (GCMMF)",
    "nestle": "Nestle",
    "britannia": "Britannia Industries",
    "mother dairy": "Mother Dairy",
    "tata": "Tata Consumer",
    "itc": "ITC Limited",
    "ashirvaad": "Aashirvaad",
    "fortune": "Fortune (Adani Wilmar)",
    "parle": "Parle Products",
    "haldiram": "Haldirams",
    "dabur": "Dabur",
    "patanjali": "Patanjali",
    "saffola": "Saffola (Marico)",
    "dhara": "Dhara",
    "cadbury": "Cadbury / Mondelez",
    "horlicks": "Horlicks / Unilever"
}

NABL_BIS_LABS = [
    {
        "name": "BIS Central Laboratory (CL)",
        "lab_name": "BIS Central Laboratory (CL)",
        "city": "Sahibabad, Ghaziabad",
        "location": "Sahibabad, Ghaziabad, Uttar Pradesh",
        "scope": "Comprehensive Dairy, Foodgrains, Edible Oils & Microbiological Testing",
        "accreditation": "NABL Accredited (ISO/IEC 17025) & BIS National Lab",
        "contact": "cl@bis.gov.in"
    },
    {
        "name": "National Food Laboratory (NFL / FSSAI)",
        "lab_name": "National Food Laboratory (NFL / FSSAI)",
        "city": "Ghaziabad & Kolkata",
        "location": "Ghaziabad & Kolkata",
        "scope": "Primary & Appellate Food Testing, Heavy Metals, Pathogen Screening",
        "accreditation": "FSSAI National Reference Lab / NABL",
        "contact": "nfl.ghaziabad@fssai.gov.in"
    },
    {
        "name": "National Dairy Development Board (NDDB - CALF)",
        "lab_name": "National Dairy Development Board (NDDB - CALF)",
        "city": "Anand, Gujarat",
        "location": "Anand, Gujarat",
        "scope": "Liquid Milk, SMP, WMP, Ghee, Butter, Fatty Acid Profile, Adulterant Screening",
        "accreditation": "NABL Accredited & BIS Approved Referral Lab",
        "contact": "calf@nddb.coop"
    },
    {
        "name": "Central Food Technological Research Institute (CSIR-CFTRI)",
        "lab_name": "Central Food Technological Research Institute (CSIR-CFTRI)",
        "city": "Mysuru, Karnataka",
        "location": "Mysuru, Karnataka",
        "scope": "Grains, Pulses, Starch, Food Processing Quality & Sensory Evaluation",
        "accreditation": "CSIR National Laboratory / NABL",
        "contact": "director@cftri.res.in"
    }
]

INTERNATIONAL_EQUIVALENTS_MAP = {
    "IS 1165": {
        "iso_equivalent": "ISO 22187 / ISO 11869 (Dried milk — Determination of titratable acidity)",
        "codex_standard": "CODEX STAN 207-1999 (Codex Standard for Milk Powders and Cream Powder)",
        "notes": "Aligned with Codex Alimentarius CXS 207-1999 composition criteria"
    },
    "IS 11721": {
        "iso_equivalent": "ISO 1736:2008 (Dried milk and dried milk products — Determination of fat content)",
        "codex_standard": "CODEX STAN 234-1999 (Recommended Methods of Analysis and Sampling)",
        "notes": "Identical gravimetric Rose-Gottlieb reference method"
    },
    "IS 1005": {
        "iso_equivalent": "ISO 3188:1978 (Starches and derived products — Determination of nitrogen content)",
        "codex_standard": "CODEX STAN 152-1985 (Standard for Wheat Flour and Food Starches)",
        "notes": "Compatible with international corn starch purity limits"
    },
    "IS 11816": {
        "iso_equivalent": "ISO 6322-1:1996 (Storage of cereals and pulses — Part 1: General recommendations)",
        "codex_standard": "CAC/RCP 53-2003 (Code of Practice for the Prevention of Mycotoxins in Cereals)",
        "notes": "Conforms with international grain silo aeration parameters"
    }
}

def detect_restrictive_spec(spec_text: str) -> Dict[str, Any]:
    """Detects proprietary brand names or overly narrow criteria in tender specifications."""
    text_lower = spec_text.lower()
    flags = []
    for brand_kw, brand_name in PROPRIETARY_BRAND_INDICATORS.items():
        if re.search(r'\b' + re.escape(brand_kw) + r'\b', text_lower):
            flags.append({
                "brand_keyword": brand_kw,
                "brand_name": brand_name,
                "advisory": f"Specification cites proprietary brand '{brand_name}'. Public procurement guidelines (GFR 2017 Rule 144) mandate generic performance & BIS Indian Standard specifications rather than brand-specific criteria."
            })

    is_restrictive = len(flags) > 0
    return {
        "has_restrictive_clauses": is_restrictive,
        "flags_count": len(flags),
        "advisory_flags": flags,
        "recommendation": "Replace proprietary brand mentions with generic BIS Indian Standard specifications (e.g. 'Whole Milk Powder conforming to IS 1165:2022')." if is_restrictive else "No proprietary brand bias detected."
    }

def get_testing_labs_and_methods(standard_number: str) -> Dict[str, Any]:
    """Returns accredited NABL / BIS testing laboratories and reference methods for a standard."""
    clean_num = standard_number.split(":")[0].split("(")[0].strip()
    
    test_methods = [
        {"parameter": "Moisture Content (Oven Drying)", "standard_method": "IS 1165 / IS 16072"},
        {"parameter": "Milk Fat (Rose-Gottlieb)", "standard_method": "IS 11721 / ISO 1736"},
        {"parameter": "Milk Protein (Kjeldahl)", "standard_method": "IS 7219"},
        {"parameter": "Bacterial Count & Coliforms", "standard_method": "IS 5401 / IS 5402"}
    ]

    return {
        "standard_number": standard_number,
        "accredited_labs": NABL_BIS_LABS,
        "recommended_labs": NABL_BIS_LABS,
        "test_methods": test_methods,
        "pre_dispatch_inspection_checklist": [
            "Verify BIS ISI Marking license certificate validity on BIS portal.",
            "Verify batch test certificate against mandatory Clause 2 chemical & microbiological limits.",
            "Ensure sampling is drawn in accordance with IS 11546 (scale of sampling)."
        ]
    }

def get_international_equivalents(standard_number: str) -> Dict[str, Any]:
    """Returns ISO and Codex Alimentarius equivalents for an Indian Standard."""
    clean_num = standard_number.split(":")[0].split("(")[0].strip()
    for is_key, data in INTERNATIONAL_EQUIVALENTS_MAP.items():
        if is_key in clean_num or clean_num in is_key:
            eq_list = [
                {
                    "standard_code": data["iso_equivalent"].split("(")[0].strip(),
                    "title": data["iso_equivalent"],
                    "equivalence": "Harmonized / Equivalent",
                    "differences_note": data["notes"]
                },
                {
                    "standard_code": data["codex_standard"].split("(")[0].strip(),
                    "title": data["codex_standard"],
                    "equivalence": "Aligned Codex Standard",
                    "differences_note": "Composition & hygiene alignment"
                }
            ]
            return {
                "standard_number": standard_number,
                "has_international_equivalent": True,
                "iso_equivalent": data["iso_equivalent"],
                "codex_standard": data["codex_standard"],
                "international_equivalents": eq_list,
                "notes": data["notes"]
            }

    return {
        "standard_number": standard_number,
        "has_international_equivalent": False,
        "iso_equivalent": "No direct ISO harmonized standard mapped yet",
        "codex_standard": "Codex general food safety and hygiene guidelines apply",
        "international_equivalents": [],
        "notes": "Harmonization mapping in progress under BIS International Relations Department."
    }

def generate_draft_specification(standard_number: str) -> Dict[str, Any]:
    """Generates a structured technical schedule specification template for a tender."""
    clean_num = standard_number.split(":")[0].split("(")[0].strip()
    clauses = [
        {"clause_ref": "Clause 4", "clause": "Clause 4", "topic": "Organoleptic & Appearance", "parameter": "General & Organoleptic Requirements", "draft_tender_text": "Material shall be uniform in colour, free from off-flavours, burnt particles, and lumps.", "requirement": "Clean, free from rancidity, foreign matter, and off-flavours."},
        {"clause_ref": "Clause 5", "clause": "Clause 5", "topic": "Chemical & Physical Composition", "parameter": "Chemical & Physical Requirements", "draft_tender_text": "Moisture max 4.0% by mass, Milk Fat min 26.0% by mass, Milk Protein min 34.0% in SNF.", "requirement": "Conforming to limits specified in Table 1 (Moisture, Fat, Protein, Total Ash)."},
        {"clause_ref": "Clause 5.4", "clause": "Clause 5.4", "topic": "Microbiological Criteria", "parameter": "Microbiological Criteria", "draft_tender_text": "Total plate count max 30,000/g, Coliform absent in 0.1g, Salmonella absent in 25g.", "requirement": "Total plate count, Coliform count, Salmonella, and Yeast/Mould within limits."},
        {"clause_ref": "Clause 7", "clause": "Clause 7", "topic": "Packaging & Hermetic Sealing", "parameter": "Packing & Sealing", "draft_tender_text": "Packed in food-grade multiwall paper sacks with heat-sealed polyethelene liners or nitrogen-flushed cans.", "requirement": "Food-grade hermetically sealed containers (nitrogen flushed where specified)."},
        {"clause_ref": "Clause 8", "clause": "Clause 8", "topic": "Marking & Certification Mark", "parameter": "Marking & Certification", "draft_tender_text": "Product packages shall prominently bear the BIS Standard Mark (ISI Mark) along with valid CM/L license number.", "requirement": "Batch number, Date of manufacture, BIS ISI Standard Mark, FSSAI License."}
    ]

    return {
        "standard_number": standard_number,
        "schedule_title": f"Technical Specification Schedule for Procurement conforming to {standard_number}",
        "mandatory_clauses": clauses,
        "key_specification_clauses": clauses,
        "compliance_undertaking": "The supplier shall submit a pre-dispatch test certificate from a NABL/BIS accredited laboratory confirming 100% compliance with each parameter."
    }

def extract_requirements_and_recommend_bulk(tender_text: str) -> List[Dict[str, Any]]:
    """Segments tender/BOQ into line items, extracts attributes, and recommends standards per item."""
    lines = [line.strip() for line in tender_text.split("\n") if line.strip() and len(line.strip()) > 3]
    retriever = HybridRetriever.get_instance()
    results = []

    for idx, line in enumerate(lines, 1):
        # Ignore pure section headers
        if re.match(r'^(schedule|section|part|bill of quantities|table)\b', line.lower()):
            continue

        # Extract attributes
        is_packaged = "pack" in line.lower() or "bag" in line.lower() or "tin" in line.lower() or "pouch" in line.lower()
        is_bulk = "bulk" in line.lower() or "silo" in line.lower() or "wagon" in line.lower()

        recs, is_non_food = retriever.retrieve(line, top_k=3)
        restrictive_check = detect_restrictive_spec(line)

        results.append({
            "line_number": idx,
            "raw_item_text": line,
            "detected_attributes": {
                "packaging_mode": "Packaged / Retail" if is_packaged else "Bulk Handling" if is_bulk else "General",
                "is_food_domain": not is_non_food
            },
            "recommended_standards": recs,
            "restrictive_spec_advisory": restrictive_check,
            "top_match_code": recs[0]["is_number"] if recs else "None",
            "top_match_title": recs[0]["title"] if recs else "No Confident Match"
        })

    return results
