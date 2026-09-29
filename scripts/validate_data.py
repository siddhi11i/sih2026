#!/usr/bin/env python3
"""
Data Validation, Governance, and Ingestion Engine
Bureau of Indian Standards (BIS) Recommender — Team Aavishkara (SIH26108)

Validates all incoming data files in data/incoming/ against strict schemas,
verifies standard number integrity against the official dataset, generates
readiness metrics, and safely ingests valid records into SQLite with a versioned audit id.
"""

import os
import sys
import json
import csv
import sqlite3
import datetime
import argparse
from typing import Dict, Any, List, Tuple

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
INCOMING_DIR = os.path.join(DATA_DIR, "incoming")
DEFAULT_DB_PATH = os.path.join(DATA_DIR, "standards_portal.db")
STANDARDS_JSON_PATH = os.path.join(DATA_DIR, "standards.json")
STANDARDS_CSV_PATH = os.path.join(BASE_DIR, "standards_dataset.csv")

def load_canonical_standards() -> Dict[str, Dict[str, Any]]:
    """Loads canonical standards index keyed by normalized IS number."""
    standards_map = {}
    if os.path.exists(STANDARDS_JSON_PATH):
        with open(STANDARDS_JSON_PATH, "r", encoding="utf-8") as f:
            raw = json.load(f)
            for item in raw:
                norm_key = normalize_is_number(item.get("is_number", ""))
                standards_map[norm_key] = item
    elif os.path.exists(STANDARDS_CSV_PATH):
        with open(STANDARDS_CSV_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for item in reader:
                norm_key = normalize_is_number(item.get("is_number", ""))
                standards_map[norm_key] = item
    return standards_map

def normalize_is_number(num_str: str) -> str:
    """Normalizes IS number for robust relational indexing (e.g. 'IS 1165:2022' -> 'is 1165')."""
    if not num_str:
        return ""
    clean = num_str.lower().strip()
    # strip colon year, revisions, or active notices
    clean = clean.split(":")[0].split("(")[0].split("-")[0].strip()
    clean = " ".join(clean.split())
    return clean

def validate_allied_file(filepath: str, canonical_map: Dict[str, Any]) -> Tuple[bool, List[str], List[Dict[str, Any]], Dict[str, Any]]:
    errors = []
    records = []
    meta = {}
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        # Support both single object (e.g. allied_IS1165_2022.json) and list of objects (allied_standards.sample.json)
        items = data if isinstance(data, list) else [data]
        
        for idx, entry in enumerate(items):
            src_num = entry.get("source_standard_number")
            if not src_num:
                errors.append(f"Entry {idx}: Missing 'source_standard_number'")
                continue
            
            src_norm = normalize_is_number(src_num)
            if src_norm not in canonical_map:
                errors.append(f"Entry {idx}: Source standard '{src_num}' not found in official BIS dataset")
                
            allied_list = entry.get("allied_standards", [])
            if not isinstance(allied_list, list) or len(allied_list) == 0:
                errors.append(f"Entry {idx}: 'allied_standards' must be a non-empty array")
                continue
                
            for a_idx, a_item in enumerate(allied_list):
                t_num = a_item.get("standard_number")
                t_rel = a_item.get("relationship_type")
                valid_types = {"test_method", "sampling", "packaging", "labelling", "terminology", "safety", "installation", "related_product"}
                if not t_num:
                    errors.append(f"Entry {idx}.{a_idx}: Missing 'standard_number'")
                if t_rel not in valid_types:
                    errors.append(f"Entry {idx}.{a_idx}: Invalid relationship_type '{t_rel}'. Must be one of {valid_types}")
                
                t_norm = normalize_is_number(t_num)
                target_in_dataset = t_norm in canonical_map
                
                records.append({
                    "source_standard_number": src_num,
                    "target_standard_number": t_num,
                    "target_title": a_item.get("title", ""),
                    "target_year": a_item.get("year", ""),
                    "relationship_type": t_rel,
                    "clause_reference": a_item.get("clause_reference", ""),
                    "mandatory": bool(a_item.get("mandatory", True)),
                    "notes": a_item.get("notes", ""),
                    "data_status": entry.get("data_status", "SAMPLE - verify before use"),
                    "target_in_dataset": target_in_dataset
                })
                
        meta["total_records"] = len(records)
        meta["data_status"] = items[0].get("data_status", "UNKNOWN") if items else "UNKNOWN"
        return len(errors) == 0, errors, records, meta
    except Exception as e:
        return False, [f"Exception parsing {filepath}: {str(e)}"], [], {}

def validate_compliance_file(filepath: str, canonical_map: Dict[str, Any]) -> Tuple[bool, List[str], List[Dict[str, Any]], Dict[str, Any]]:
    errors = []
    records = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            items = json.load(f)
            
        if not isinstance(items, list):
            errors.append("Compliance file must be a JSON array of compliance items")
            return False, errors, [], {}
            
        for idx, item in enumerate(items):
            std_num = item.get("standard_number")
            if not std_num:
                errors.append(f"Item {idx}: Missing 'standard_number'")
            norm = normalize_is_number(std_num)
            in_ds = norm in canonical_map
            if not in_ds:
                errors.append(f"Item {idx}: Standard '{std_num}' does not exist in canonical dataset")
                
            records.append({
                "standard_number": std_num,
                "year": item.get("year", ""),
                "title": item.get("title", ""),
                "qco_mandatory": bool(item.get("qco_mandatory", False)),
                "qco_order_name": item.get("qco_order_name"),
                "qco_notifying_ministry": item.get("qco_notifying_ministry"),
                "qco_effective_date": item.get("qco_effective_date"),
                "isi_mark_mandatory": bool(item.get("isi_mark_mandatory", False)),
                "isi_certification_scheme": item.get("isi_certification_scheme"),
                "fssai_applicable": bool(item.get("fssai_applicable", False)),
                "fssai_regulation": item.get("fssai_regulation"),
                "hsn_code": item.get("hsn_code"),
                "gem_category_id": item.get("gem_category_id"),
                "gem_category_name": item.get("gem_category_name"),
                "crs_applicable": bool(item.get("crs_applicable", False)),
                "crs_note": item.get("crs_note"),
                "hallmarking_applicable": bool(item.get("hallmarking_applicable", False)),
                "hallmarking_note": item.get("hallmarking_note"),
                "source": item.get("source", "BIS Gazette / Sample"),
                "verification_url": item.get("verification_url"),
                "last_verified": item.get("last_verified"),
                "data_status": item.get("data_status", "SAMPLE - verify before use"),
                "notes": item.get("notes", "")
            })
            
        return len(errors) == 0, errors, records, {"total_records": len(records), "data_status": "SAMPLE - verify before use"}
    except Exception as e:
        return False, [f"Exception reading compliance file: {str(e)}"], [], {}

def validate_eval_queries(filepath: str) -> Tuple[bool, List[str], List[Dict[str, Any]], Dict[str, Any]]:
    errors = []
    records = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            required_cols = {"id", "query", "category", "language", "expected_outcome"}
            if not required_cols.issubset(set(reader.fieldnames or [])):
                errors.append(f"Missing required CSV columns. Found: {reader.fieldnames}")
                return False, errors, [], {}
                
            for idx, row in enumerate(reader, 1):
                outcome = row.get("expected_outcome", "").strip()
                if outcome not in {"match", "clarify", "no_match"}:
                    errors.append(f"Row {idx}: Invalid expected_outcome '{outcome}' (must be match/clarify/no_match)")
                records.append(row)
                
        return len(errors) == 0, errors, records, {"total_records": len(records), "categories": list(set(r['category'] for r in records))}
    except Exception as e:
        return False, [f"Exception parsing eval_queries.csv: {str(e)}"], [], {}

def run_data_validation() -> Dict[str, Any]:
    canonical = load_canonical_standards()
    report = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "canonical_standards_count": len(canonical),
        "files_inspected": {},
        "summary": {
            "all_valid": True,
            "total_errors": 0,
            "real_standards_count": len(canonical),
            "allied_links_count": 0,
            "compliance_rules_count": 0,
            "eval_benchmark_queries": 0,
            "data_readiness_pct": 0.0
        }
    }
    
    # 1. Inspect allied_IS1165_2022.json
    f1 = os.path.join(INCOMING_DIR, "allied_IS1165_2022.json")
    if os.path.exists(f1):
        v1, errs1, recs1, meta1 = validate_allied_file(f1, canonical)
        report["files_inspected"]["allied_IS1165_2022.json"] = {
            "status": meta1.get("data_status", "EXTRACTED-UNVERIFIED"),
            "valid": v1,
            "records": len(recs1),
            "errors": errs1,
            "unverified_notice": "Extracted from Clause 2, pending committee verification"
        }
        report["summary"]["allied_links_count"] += len(recs1)
        if not v1:
            report["summary"]["all_valid"] = False
            report["summary"]["total_errors"] += len(errs1)
            
    # 2. Inspect allied_standards.sample.json
    f2 = os.path.join(INCOMING_DIR, "allied_standards.sample.json")
    if os.path.exists(f2):
        v2, errs2, recs2, meta2 = validate_allied_file(f2, canonical)
        report["files_inspected"]["allied_standards.sample.json"] = {
            "status": "SAMPLE - verify before use",
            "valid": v2,
            "records": len(recs2),
            "errors": errs2
        }
        report["summary"]["allied_links_count"] += len(recs2)
        if not v2:
            report["summary"]["all_valid"] = False
            report["summary"]["total_errors"] += len(errs2)
            
    # 3. Inspect compliance.sample.json
    f3 = os.path.join(INCOMING_DIR, "compliance.sample.json")
    if os.path.exists(f3):
        v3, errs3, recs3, meta3 = validate_compliance_file(f3, canonical)
        report["files_inspected"]["compliance.sample.json"] = {
            "status": "SAMPLE - verify before use",
            "valid": v3,
            "records": len(recs3),
            "errors": errs3
        }
        report["summary"]["compliance_rules_count"] += len(recs3)
        if not v3:
            report["summary"]["all_valid"] = False
            report["summary"]["total_errors"] += len(errs3)
            
    # 4. Inspect eval_queries.csv
    f4 = os.path.join(INCOMING_DIR, "eval_queries.csv")
    if os.path.exists(f4):
        v4, errs4, recs4, meta4 = validate_eval_queries(f4)
        report["files_inspected"]["eval_queries.csv"] = {
            "status": "REAL / BENCHMARK",
            "valid": v4,
            "records": len(recs4),
            "errors": errs4,
            "categories": meta4.get("categories", [])
        }
        report["summary"]["eval_benchmark_queries"] = len(recs4)
        if not v4:
            report["summary"]["all_valid"] = False
            report["summary"]["total_errors"] += len(errs4)
            
    total_raw_standards = 3144
    if os.path.exists(STANDARDS_JSON_PATH):
        try:
            with open(STANDARDS_JSON_PATH, "r", encoding="utf-8") as sf:
                total_raw_standards = len(json.load(sf))
        except Exception:
            pass

    report["canonical_standards_count"] = total_raw_standards
    report["summary"]["real_standards_count"] = total_raw_standards

    # Compute readiness score: weighted index of core standards (50%), eval suite (20%), allied readiness (15%), compliance schema (15%)
    score = 0.0
    if total_raw_standards >= 3000:
        score += 50.0
    if report["summary"]["eval_benchmark_queries"] >= 50:
        score += 20.0
    if report["summary"]["allied_links_count"] >= 8:
        score += 15.0
    if report["summary"]["compliance_rules_count"] >= 2:
        score += 15.0
    report["summary"]["data_readiness_pct"] = score
    
    return report

def ingest_into_sqlite(db_path: str, version_tag: str = None) -> Dict[str, Any]:
    """Ingests canonical standards, allied relations, and compliance sample rules into SQLite database."""
    if not version_tag:
        version_tag = f"v1.0.0-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}"
        
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # 1. Create tables
    cur.execute("""
    CREATE TABLE IF NOT EXISTS data_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version_tag TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        canonical_count INTEGER NOT NULL,
        allied_count INTEGER NOT NULL,
        compliance_count INTEGER NOT NULL,
        notes TEXT
    );
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS standards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sno INTEGER,
        is_number TEXT NOT NULL,
        clean_number TEXT NOT NULL,
        title TEXT NOT NULL,
        clean_title TEXT NOT NULL,
        year TEXT,
        category TEXT,
        standard_type TEXT,
        status TEXT,
        latest_version TEXT,
        amendment_no TEXT,
        scope_text TEXT,
        data_status TEXT NOT NULL,
        last_verified TEXT,
        source TEXT NOT NULL,
        is_amendment INTEGER DEFAULT 0
    );
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS allied_standards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_standard_number TEXT NOT NULL,
        target_standard_number TEXT NOT NULL,
        target_title TEXT NOT NULL,
        target_year TEXT,
        relationship_type TEXT NOT NULL,
        clause_reference TEXT NOT NULL,
        mandatory INTEGER DEFAULT 1,
        notes TEXT,
        data_status TEXT NOT NULL
    );
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS compliance_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        standard_number TEXT NOT NULL,
        year TEXT,
        title TEXT,
        qco_mandatory INTEGER DEFAULT 0,
        qco_order_name TEXT,
        qco_notifying_ministry TEXT,
        qco_effective_date TEXT,
        isi_mark_mandatory INTEGER DEFAULT 0,
        isi_certification_scheme TEXT,
        fssai_applicable INTEGER DEFAULT 0,
        fssai_regulation TEXT,
        hsn_code TEXT,
        gem_category_id TEXT,
        gem_category_name TEXT,
        crs_applicable INTEGER DEFAULT 0,
        crs_note TEXT,
        hallmarking_applicable INTEGER DEFAULT 0,
        hallmarking_note TEXT,
        source TEXT NOT NULL,
        verification_url TEXT,
        last_verified TEXT,
        data_status TEXT NOT NULL,
        notes TEXT
    );
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS eval_benchmarks (
        id INTEGER PRIMARY KEY,
        query TEXT NOT NULL,
        category TEXT NOT NULL,
        language TEXT NOT NULL,
        expected_outcome TEXT NOT NULL,
        expected_standard_numbers TEXT,
        clarifying_topic TEXT,
        notes TEXT
    );
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        user_role TEXT DEFAULT 'anonymous',
        query_text TEXT,
        results_count INTEGER,
        top_standard TEXT,
        data_version TEXT,
        ip_hash TEXT,
        details TEXT
    );
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        query_text TEXT NOT NULL,
        standard_number TEXT NOT NULL,
        decision TEXT NOT NULL, -- 'approved', 'rejected', 'edited'
        reviewer_name TEXT NOT NULL,
        reviewer_role TEXT NOT NULL,
        feedback TEXT,
        data_version TEXT
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        user_query TEXT NOT NULL,
        user_email TEXT,
        context_screen TEXT,
        status TEXT DEFAULT 'open',
        escalation_reason TEXT
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS saved_tenders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tender_title TEXT NOT NULL,
        organization TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        items_json TEXT NOT NULL,
        status_alerts TEXT
    );
    """)

    # Populate canonical standards
    with open(STANDARDS_JSON_PATH, "r", encoding="utf-8") as f:
        standards = json.load(f)
        
    cur.execute("DELETE FROM standards;")
    for s in standards:
        clean_num = normalize_is_number(s.get("is_number", ""))
        clean_title = s.get("title", "").replace("&mdash;", "—").replace("&quot;", '"').replace("&apos;", "'")
        cur.execute("""
        INSERT INTO standards (
            sno, is_number, clean_number, title, clean_title, year, category,
            standard_type, status, latest_version, amendment_no, scope_text,
            data_status, last_verified, source, is_amendment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            s.get("sno"),
            s.get("is_number"),
            clean_num,
            s.get("title"),
            clean_title,
            s.get("year"),
            s.get("category", "General & Allied"),
            None, # Keep null as per rule
            "Current (Unverified Gazette Record)",
            s.get("is_number"),
            None, # Keep null
            None, # Keep null
            "REAL",
            "2026-09-28",
            "BIS Official Dataset (3,144 Standards)",
            1 if s.get("is_amendment") else 0
        ))
        
    # Ingest Allied Files
    cur.execute("DELETE FROM allied_standards;")
    canonical_map = {normalize_is_number(s["is_number"]): s for s in standards}
    allied_records_count = 0
    
    for filename in ["allied_IS1165_2022.json", "allied_standards.sample.json"]:
        path = os.path.join(INCOMING_DIR, filename)
        if os.path.exists(path):
            _, _, recs, _ = validate_allied_file(path, canonical_map)
            for r in recs:
                cur.execute("""
                INSERT INTO allied_standards (
                    source_standard_number, target_standard_number, target_title, target_year,
                    relationship_type, clause_reference, mandatory, notes, data_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    r["source_standard_number"],
                    r["target_standard_number"],
                    r["target_title"],
                    r["target_year"],
                    r["relationship_type"],
                    r["clause_reference"],
                    1 if r["mandatory"] else 0,
                    r["notes"],
                    r["data_status"]
                ))
                allied_records_count += 1
                
    # Ingest Compliance Sample
    cur.execute("DELETE FROM compliance_data;")
    comp_records_count = 0
    comp_path = os.path.join(INCOMING_DIR, "compliance.sample.json")
    if os.path.exists(comp_path):
        _, _, crecs, _ = validate_compliance_file(comp_path, canonical_map)
        for c in crecs:
            cur.execute("""
            INSERT INTO compliance_data (
                standard_number, year, title, qco_mandatory, qco_order_name,
                qco_notifying_ministry, qco_effective_date, isi_mark_mandatory,
                isi_certification_scheme, fssai_applicable, fssai_regulation,
                hsn_code, gem_category_id, gem_category_name, crs_applicable,
                crs_note, hallmarking_applicable, hallmarking_note, source,
                verification_url, last_verified, data_status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                c["standard_number"], c["year"], c["title"],
                1 if c["qco_mandatory"] else 0, c["qco_order_name"],
                c["qco_notifying_ministry"], c["qco_effective_date"],
                1 if c["isi_mark_mandatory"] else 0, c["isi_certification_scheme"],
                1 if c["fssai_applicable"] else 0, c["fssai_regulation"],
                c["hsn_code"], c["gem_category_id"], c["gem_category_name"],
                1 if c["crs_applicable"] else 0, c["crs_note"],
                1 if c["hallmarking_applicable"] else 0, c["hallmarking_note"],
                c["source"], c["verification_url"], c["last_verified"],
                c["data_status"], c["notes"]
            ))
            comp_records_count += 1
            
    # Ingest Eval Benchmarks
    cur.execute("DELETE FROM eval_benchmarks;")
    eval_path = os.path.join(INCOMING_DIR, "eval_queries.csv")
    eval_count = 0
    if os.path.exists(eval_path):
        _, _, erecs, _ = validate_eval_queries(eval_path)
        for row in erecs:
            cur.execute("""
            INSERT INTO eval_benchmarks (
                id, query, category, language, expected_outcome, expected_standard_numbers,
                clarifying_topic, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                int(row["id"]), row["query"], row["category"], row["language"],
                row["expected_outcome"], row.get("expected_standard_numbers", ""),
                row.get("clarifying_topic", ""), row.get("notes", "")
            ))
            eval_count += 1
            
    # Record Data Version
    cur.execute("""
    INSERT OR REPLACE INTO data_versions (version_tag, created_at, canonical_count, allied_count, compliance_count, notes)
    VALUES (?, ?, ?, ?, ?, ?);
    """, (
        version_tag,
        datetime.datetime.utcnow().isoformat() + "Z",
        len(standards),
        allied_records_count,
        comp_records_count,
        "Automated validation & baseline dataset ingestion."
    ))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "SUCCESS",
        "database_path": db_path,
        "version_tag": version_tag,
        "standards_ingested": len(standards),
        "allied_links_ingested": allied_records_count,
        "compliance_rules_ingested": comp_records_count,
        "eval_benchmarks_ingested": eval_count
    }

def print_cli_report(report: Dict[str, Any]):
    print("================================================================================")
    print(" 🏛️  BUREAU OF INDIAN STANDARDS — DATA VALIDATION & READINESS REPORT")
    print(" Department of Consumer Affairs • Team Aavishkara (SIH26108)")
    print(f" Timestamp: {report['timestamp']}")
    print("================================================================================")
    print(f" Canonical Standards Ingested : {report['canonical_standards_count']:,} standards")
    print(f" Overall Schema Validation    : {'✅ PASS' if report['summary']['all_valid'] else '❌ FAIL'}")
    print(f" Total Schema Errors          : {report['summary']['total_errors']}")
    print(f" System Data Readiness Score  : {report['summary']['data_readiness_pct']:.1f}%")
    print("--------------------------------------------------------------------------------")
    print(" 📁 File Ingestion Status:")
    for fn, info in report["files_inspected"].items():
        v_str = "VALID" if info["valid"] else "INVALID"
        print(f"  • {fn:<32} [{info['status']}] => {v_str} ({info['records']} records)")
        if info.get("errors"):
            for err in info["errors"][:3]:
                print(f"      ⚠️ {err}")
    print("================================================================================")

def main():
    parser = argparse.ArgumentParser(description="Validate & ingest BIS data incoming files")
    parser.add_argument("--ingest", action="store_true", help="Ingest valid files into SQLite DB")
    parser.add_argument("--db-path", default=DEFAULT_DB_PATH, help="Target SQLite database path")
    parser.add_argument("--json", action="store_true", help="Output raw JSON report")
    parser.add_argument("--version-tag", default=None, help="Custom data version tag")
    args = parser.parse_args()
    
    report = run_data_validation()
    
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print_cli_report(report)
        
    if args.ingest:
        if report["summary"]["all_valid"]:
            ing_res = ingest_into_sqlite(args.db_path, args.version_tag)
            print(f"\n✅ Ingestion Succeeded into SQLite DB: {args.db_path}")
            print(f"   Version Tag: {ing_res['version_tag']}")
            print(f"   Standards: {ing_res['standards_ingested']}, Allied: {ing_res['allied_links_ingested']}, Compliance: {ing_res['compliance_rules_ingested']}")
        else:
            print("\n❌ Ingestion aborted due to validation errors.")
            sys.exit(1)

if __name__ == "__main__":
    main()
