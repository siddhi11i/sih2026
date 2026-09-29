# BIS Standards Recommender — Data Governance & Registry
**Team Aavishkara • SIH 2026 (SIH26108)**
**Specialization: Food & Dairy Division, Bureau of Indian Standards (BIS)**

This document serves as the authoritative data ledger, schema definition, and data status registry for the AI Procurement Standards Recommender System.

---

## 📊 Data Inventory & Status Matrix

| File Path | Description | Status | Source / Extraction Method | Maintainer / Who Fills It |
| :--- | :--- | :--- | :--- | :--- |
| `standards_dataset.csv` | Core 3,144 Indian Standards (Food & Dairy Division) | **REAL** | Official BIS Published Repository | BIS Open Portal Ingestion |
| `data/standards.json` | JSON format of the 3,144 standards with category mappings | **REAL** | Generated from `standards_dataset.csv` | Automated ETL Pipeline |
| `data/incoming/allied_IS1165_2022.json` | Normative references & allied test methods for IS 1165:2022 (Whole Milk Powder) | **EXTRACTED-UNVERIFIED** | Extracted directly from IS 1165:2022 Clause 2 Gazette text | Technical Committee / BIS Specialist |
| `data/incoming/allied_standards.sample.json` | Template schema for batch allied standards ingestion | **SAMPLE** *(verify before use)* | Synthetic schema template | Domain Specialist / Drafters |
| `data/incoming/compliance.sample.json` | Template schema for QCO, ISI Marking, FSSAI, HSN, GeM | **SAMPLE** *(verify before use)* | Gazette Sample Data Template | Legal & Compliance Reviewer |
| `data/incoming/eval_queries.csv` | 50 benchmark queries (clean, hinglish, indic, vague, no_match) | **REAL / BENCHMARK** | Handcrafted procurement test suite | Evaluation Lead / AI Team |

---

## 🏷️ Data Status Classifications

1. **`REAL`**:
   - Official, verified data sourced from Gazette notifications or published BIS standards.
   - Guaranteed zero hallucination; numbers, titles, years are verbatim.
2. **`EXTRACTED-UNVERIFIED`**:
   - Sourced from real standard clauses (e.g. Clause 2 of IS 1165:2022) but pending formal verification committee sign-off.
   - Displayed in the UI and API with an explicit `Extracted - Unverified` badge.
3. **`SAMPLE`**:
   - Schema structure templates and demonstration records.
   - **Crucial Rule**: Every sample record is explicitly tagged `"SAMPLE - verify before use"` in DB, API responses, exports, and UI components.
4. **`MISSING`**:
   - Unverified fields (e.g. scope text, amendments, QCOs for non-ingested standards) remain `null` or `"Not available yet"`. They are never populated with guessed data.

---

## 📐 Schema Definitions

### 1. Core Standards Schema (`standards` table)
```json
{
  "id": "INTEGER PRIMARY KEY",
  "is_number": "VARCHAR(64) UNIQUE NOT NULL",
  "title": "TEXT NOT NULL",
  "year": "VARCHAR(16)",
  "category": "VARCHAR(128)",
  "standard_type": "VARCHAR(64) NULL (product_spec | test_method | sampling | packaging | labelling | terminology | safety | installation)",
  "status": "VARCHAR(32) NULL (current | superseded | withdrawn)",
  "latest_version": "VARCHAR(64) NULL",
  "amendment_no": "VARCHAR(64) NULL",
  "scope_text": "TEXT NULL",
  "data_status": "VARCHAR(32) NOT NULL (REAL | EXTRACTED-UNVERIFIED | SAMPLE)",
  "last_verified": "DATE NULL",
  "source": "TEXT NOT NULL"
}
```

### 2. Allied Standards Graph Schema (`allied_standards` table)
```json
{
  "id": "INTEGER PRIMARY KEY",
  "source_standard_number": "VARCHAR(64) NOT NULL",
  "target_standard_number": "VARCHAR(64) NOT NULL",
  "target_title": "TEXT NOT NULL",
  "relationship_type": "VARCHAR(32) NOT NULL (test_method | sampling | packaging | terminology | safety | installation | related_product)",
  "clause_reference": "TEXT NOT NULL",
  "mandatory": "BOOLEAN NOT NULL DEFAULT TRUE",
  "notes": "TEXT",
  "data_status": "VARCHAR(32) NOT NULL"
}
```

### 3. Compliance Schema (`compliance_data` table)
```json
{
  "id": "INTEGER PRIMARY KEY",
  "standard_number": "VARCHAR(64) NOT NULL",
  "qco_mandatory": "BOOLEAN DEFAULT FALSE",
  "qco_order_name": "TEXT",
  "qco_notifying_ministry": "TEXT",
  "qco_effective_date": "DATE",
  "isi_mark_mandatory": "BOOLEAN DEFAULT FALSE",
  "isi_certification_scheme": "TEXT",
  "fssai_applicable": "BOOLEAN DEFAULT FALSE",
  "fssai_regulation": "TEXT",
  "hsn_code": "VARCHAR(32)",
  "gem_category_id": "VARCHAR(64)",
  "gem_category_name": "TEXT",
  "crs_applicable": "BOOLEAN DEFAULT FALSE",
  "hallmarking_applicable": "BOOLEAN DEFAULT FALSE",
  "source": "TEXT NOT NULL",
  "verification_url": "TEXT",
  "data_status": "VARCHAR(32) NOT NULL (SAMPLE - verify before use)"
}
```

---

## 🛠️ Data Ingestion & Validation Workflow

To validate incoming data files and ingest them into the system:
```bash
python scripts/validate_data.py --ingest --db-path data/standards_portal.db
```
This script:
1. Validates schema format of all files in `data/incoming/`.
2. Cross-references standard numbers against `standards_dataset.csv` to ensure relational integrity.
3. Generates a data readiness report.
4. Populates the SQLite database with version tracking (`data_versions` table).
