from typing import Dict, Any, Optional
from app.db.database import execute_query
from app.schemas.standards import ComplianceDetailResponse

def get_compliance_details(standard_number_or_id: str) -> ComplianceDetailResponse:
    std_num = standard_number_or_id
    if standard_number_or_id.isdigit():
        row = execute_query("SELECT is_number FROM standards WHERE id = ?;", (int(standard_number_or_id),))
        if row:
            std_num = row[0]["is_number"]

    base_std_num = std_num.split(":")[0].split("(")[0].strip()

    rows = execute_query(
        """
        SELECT * FROM compliance_data
        WHERE standard_number LIKE ? OR standard_number LIKE ?;
        """,
        (f"%{base_std_num}%", f"%{std_num}%")
    )

    if not rows:
        return ComplianceDetailResponse(
            standard_number=std_num,
            data_status="MISSING",
            has_verified_data=False,
            notice="No verified compliance/QCO data available yet for this standard."
        )

    r = rows[0]
    return ComplianceDetailResponse(
        standard_number=r["standard_number"],
        year=r["year"],
        title=r["title"],
        qco_mandatory=bool(r["qco_mandatory"]),
        qco_order_name=r["qco_order_name"],
        qco_notifying_ministry=r["qco_notifying_ministry"],
        qco_effective_date=r["qco_effective_date"],
        isi_mark_mandatory=bool(r["isi_mark_mandatory"]),
        isi_certification_scheme=r["isi_certification_scheme"],
        fssai_applicable=bool(r["fssai_applicable"]),
        fssai_regulation=r["fssai_regulation"],
        hsn_code=r["hsn_code"],
        gem_category_id=r["gem_category_id"],
        gem_category_name=r["gem_category_name"],
        crs_applicable=bool(r["crs_applicable"]),
        crs_note=r["crs_note"] or "Not applicable to food products",
        hallmarking_applicable=bool(r["hallmarking_applicable"]),
        hallmarking_note=r["hallmarking_note"] or "Not applicable to food products",
        source=r["source"],
        verification_url=r["verification_url"],
        last_verified=r["last_verified"],
        data_status=r["data_status"] or "SAMPLE - verify before use",
        has_verified_data=True,
        notice="SAMPLE - verify before use in official procurement documents."
    )
