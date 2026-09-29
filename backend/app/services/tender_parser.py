import re
import io
from typing import List, Dict, Any, Tuple
from app.db.database import execute_query
from app.schemas.standards import TenderCheckFinding, TenderCheckResponse, StandardItem

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    fn_lower = filename.lower()
    
    if fn_lower.endswith(".pdf"):
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text = "\n".join([page.extract_text() or "" for page in reader.pages])
            return text
        except Exception as e:
            return f"Error extracting PDF: {str(e)}"
            
    elif fn_lower.endswith(".docx"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            text = "\n".join([p.text for p in doc.paragraphs])
            return text
        except Exception as e:
            return f"Error extracting DOCX: {str(e)}"
            
    elif fn_lower.endswith(".xlsx") or fn_lower.endswith(".xls"):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
            lines = []
            for sheet in wb.worksheets:
                for row in sheet.iter_rows(values_only=True):
                    row_vals = [str(v) for v in row if v is not None]
                    if row_vals:
                        lines.append(" | ".join(row_vals))
            return "\n".join(lines)
        except Exception as e:
            return f"Error extracting Excel: {str(e)}"
            
    else:
        # Default plaintext
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return file_bytes.decode("latin-1", errors="ignore")

def extract_is_numbers(text: str) -> List[str]:
    """Finds all occurrences of IS numbers like 'IS 1165', 'IS: 11721:2013', 'IS/ISO 22005'."""
    pattern = r'\bIS(?:\/ISO(?:\/TS)?)?[\s:\/]+[0-9]+(?:\s*:\s*[Pp]art\s*[0-9]+)?(?:\s*:\s*\d{4})?\b'
    matches = re.findall(pattern, text, flags=re.IGNORECASE)
    # clean and deduplicate
    clean_matches = []
    seen = set()
    for m in matches:
        norm = " ".join(m.split()).upper()
        if norm not in seen:
            seen.add(norm)
            clean_matches.append(norm)
    return clean_matches

def check_tender_compliance(tender_text: str, filename: str = "Tender Schedule") -> TenderCheckResponse:
    extracted_is = extract_is_numbers(tender_text)
    findings: List[TenderCheckFinding] = []
    critical_count = 0
    warning_count = 0

    for is_str in extracted_is:
        # Extract numeric core
        num_match = re.search(r'\d+', is_str)
        if not num_match:
            continue
        core_num = num_match.group()

        # Query DB for this standard
        rows = execute_query(
            "SELECT * FROM standards WHERE is_number LIKE ? OR clean_number LIKE ?;",
            (f"%{core_num}%", f"%is {core_num}%")
        )

        if not rows:
            critical_count += 1
            findings.append(TenderCheckFinding(
                is_number_found=is_str,
                found_in_dataset=False,
                issue_type="not_in_dataset",
                issue_severity="critical",
                message=f"Standard '{is_str}' is not present in the official 3,144 Food & Dairy BIS repository.",
                suggested_action="Verify if the IS number is mistyped, belongs to another division (e.g. Civil/Mechanical), or has been cancelled."
            ))
            continue

        canonical_raw = rows[0]
        canonical_std = StandardItem(
            id=canonical_raw["id"],
            sno=canonical_raw["sno"],
            is_number=canonical_raw["is_number"],
            clean_number=canonical_raw["clean_number"],
            title=canonical_raw["title"],
            clean_title=canonical_raw["clean_title"],
            year=canonical_raw["year"],
            category=canonical_raw["category"],
            standard_type=canonical_raw["standard_type"],
            status=canonical_raw["status"],
            latest_version=canonical_raw["latest_version"],
            amendment_no=canonical_raw["amendment_no"],
            data_status=canonical_raw["data_status"],
            source=canonical_raw["source"],
            is_amendment=bool(canonical_raw["is_amendment"])
        )

        # Check for allied references
        allied_rows = execute_query(
            "SELECT target_standard_number, target_title, mandatory FROM allied_standards WHERE source_standard_number LIKE ?;",
            (f"%{core_num}%",)
        )
        missing_allied = []
        if allied_rows:
            for ar in allied_rows:
                t_num = ar["target_standard_number"]
                if t_num not in tender_text and ar["mandatory"]:
                    missing_allied.append(f"{t_num} ({ar['target_title']})")

        # Check status & amendment conditions
        if canonical_raw["is_amendment"]:
            warning_count += 1
            findings.append(TenderCheckFinding(
                is_number_found=is_str,
                found_in_dataset=True,
                canonical_standard=canonical_std,
                issue_type="amendment_needed",
                issue_severity="warning",
                message=f"'{is_str}' is an amendment notice rather than the base product specification.",
                suggested_action=f"Cite the main parent specification standard alongside this amendment notice."
            ))
        elif missing_allied:
            warning_count += 1
            findings.append(TenderCheckFinding(
                is_number_found=is_str,
                found_in_dataset=True,
                canonical_standard=canonical_std,
                issue_type="missing_allied",
                issue_severity="warning",
                message=f"Tender cites '{is_str}' but omits mandatory Clause 2 normative test method & sampling standards.",
                suggested_action=f"Incorporate required allied test methods into the technical schedule.",
                allied_references_required=missing_allied
            ))
        else:
            findings.append(TenderCheckFinding(
                is_number_found=is_str,
                found_in_dataset=True,
                canonical_standard=canonical_std,
                issue_type="valid",
                issue_severity="info",
                message=f"Standard '{is_str}' ({canonical_std.clean_title}) matches active BIS repository records.",
                suggested_action="Standard is valid and correctly referenced."
            ))

    report_lines = [
        f"TENDER TECHNICAL COMPLIANCE REPORT",
        f"Tender Name: {filename}",
        f"Total Indian Standards Identified: {len(extracted_is)}",
        f"Critical Discrepancies: {critical_count} | Warnings / Advisory: {warning_count}",
        "-" * 60
    ]
    for f in findings:
        report_lines.append(f"[{f.issue_severity.upper()}] {f.is_number_found} -> {f.message}")
        if f.allied_references_required:
            report_lines.append(f"   Required Allied Standards: {', '.join(f.allied_references_required[:3])}")

    return TenderCheckResponse(
        tender_name=filename,
        extracted_standards=extracted_is,
        total_standards_checked=len(extracted_is),
        critical_issues_count=critical_count,
        warning_issues_count=warning_count,
        findings=findings,
        compliance_summary_report="\n".join(report_lines)
    )
