from typing import Dict, Any, List
from app.db.database import execute_query
from app.schemas.standards import AlliedGraphResponse, AlliedStandardItem

def get_allied_standards(standard_number_or_id: str) -> AlliedGraphResponse:
    # 1. Resolve standard
    std_num = standard_number_or_id
    std_title = ""
    if standard_number_or_id.isdigit():
        row = execute_query("SELECT is_number, clean_title FROM standards WHERE id = ?;", (int(standard_number_or_id),))
        if row:
            std_num = row[0]["is_number"]
            std_title = row[0]["clean_title"]
    else:
        row = execute_query("SELECT is_number, clean_title FROM standards WHERE is_number LIKE ? OR clean_number LIKE ?;", (f"%{std_num}%", f"%{std_num}%"))
        if row:
            std_title = row[0]["clean_title"]

    base_std_num = std_num.split(":")[0].split("(")[0].strip()

    # 2. Query allied_standards table
    rows = execute_query(
        """
        SELECT source_standard_number, target_standard_number, target_title, target_year,
               relationship_type, clause_reference, mandatory, notes, data_status
        FROM allied_standards
        WHERE source_standard_number LIKE ? OR source_standard_number LIKE ?;
        """,
        (f"%{base_std_num}%", f"%{std_num}%")
    )

    if not rows:
        return AlliedGraphResponse(
            source_standard_number=std_num,
            source_standard_title=std_title or "Indian Standard Specification",
            data_status="MISSING",
            has_verified_data=False,
            notice="No verified allied data yet. Normative references from Clause 2 have not been extracted for this standard.",
            grouped_allied={},
            all_allied=[]
        )

    all_items = []
    grouped: Dict[str, List[AlliedStandardItem]] = {
        "test_method": [],
        "sampling": [],
        "packaging": [],
        "labelling": [],
        "terminology": [],
        "safety": [],
        "installation": [],
        "related_product": []
    }

    primary_data_status = rows[0]["data_status"]

    for r in rows:
        item = AlliedStandardItem(
            standard_number=r["target_standard_number"],
            year=r["target_year"],
            title=r["target_title"],
            relationship_type=r["relationship_type"],
            clause_reference=r["clause_reference"],
            mandatory=bool(r["mandatory"]),
            notes=r["notes"],
            data_status=r["data_status"]
        )
        all_items.append(item)
        rel = r["relationship_type"]
        if rel in grouped:
            grouped[rel].append(item)
        else:
            grouped.setdefault(rel, []).append(item)

    # Filter out empty groups
    clean_grouped = {k: v for k, v in grouped.items() if len(v) > 0}

    return AlliedGraphResponse(
        source_standard_number=std_num,
        source_standard_title=std_title or "Indian Standard Specification",
        data_status=primary_data_status,
        has_verified_data=True,
        notice="Extracted from Clause 2 normative references." if primary_data_status == "EXTRACTED-UNVERIFIED" else "SAMPLE - verify before use",
        grouped_allied=clean_grouped,
        all_allied=all_items
    )
