# Bureau of Indian Standards (BIS) — Standards Recommender
### National Public Procurement Decision-Support Portal • Food & Dairy Division
**Ministry of Consumer Affairs, Food & Public Distribution • Government of India**
**Smart India Hackathon (SIH 2026) • Problem ID: SIH26108 • Team Aavishkara**

---

## 🏛️ System Overview

The **BIS Standards Recommender** is an enterprise-grade, retrieval-only decision-support platform engineered to assist public procurement officers, tender drafting committees, and quality inspection boards across India in identifying and auditing all applicable **Indian Standards (IS)**.

### Key Capabilities
1. **Zero Hallucination Guarantee**: Standard numbers, publication years, titles, and regulatory statuses are retrieved verbatim from the canonical repository of **3,144 Indian Standards (Food & Dairy Division)**.
2. **Hybrid Semantic Retrieval**: Combines BM25 lexical precision with dense sublinear n-gram semantic representations, cross-ranked with commodity anchors.
3. **Normative Allied Standards Graph**: Automatically links product specifications to Clause 2 normative references (Test Methods, Sampling, Packaging, Labelling, Terminology, Safety).
4. **Tender Compliance Checker**: Parses uploaded tender documents (PDF, DOCX, XLSX, TXT) to identify omitted Clause 2 allied test methods, superseded standards, and invalid citations.
5. **Data Governance & Provenance**: Strict ledger distinguishing **REAL**, **EXTRACTED-UNVERIFIED**, and **SAMPLE** records.
6. **Multilingual Support**: Supports queries in English, Hindi (हिन्दी), Marathi (मराठी), and Hinglish with automatic language detection.
7. **Local Grounded AI Chatbot**: In-app assistance with screen awareness, source citations, and human ticket escalation.

---

## 🏗️ Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│               Frontend: React (Vite) + Tailwind CSS                     │
│  - Executive National Portal UI (A11y, Keyboard Accessible)            │
│  - High/Medium/Low Tiers + "Why Matched" Badges + SAMPLE Warnings       │
│  - Side-by-side Standard Comparison (2-4 items)                        │
│  - Clause 2 Normative Allied Standards Drawer & Graph                  │
│  - Tender Checker (PDF/DOCX/XLSX/BOQ Multi-Item Audit)                 │
│  - Data Readiness Admin Panel + Ministry Analytics                     │
│  - Multi-format Export (Tender DOCX with BIS Annexure, CSV, Print)     │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ REST API (/api/v1)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Backend: FastAPI (Python 3.11)                      │
│                                                                        │
│  ┌───────────────────────┐  ┌──────────────────────────────────────┐  │
│  │   Query Preprocessor  │  │          Hybrid Retriever            │  │
│  │ - Spell Correction    │  │ - BM25Okapi Lexical Index            │  │
│  │ - Hinglish & Indic    │  │ - Dense N-gram Semantic Matrix       │  │
│  │ - Devanagari Mapping  │  │ - Commodity Anchor Cross-Ranking     │  │
│  └───────────────────────┘  └──────────────────────────────────────┘  │
│  ┌───────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  Tender Parser Engine │  │         Compliance & Allied          │  │
│  │ - PDF/DOCX/XLSX parse │  │ - Clause 2 Normative Graph           │  │
│  │ - Discrepancy audit   │  │ - QCO / ISI / FSSAI / HSN lookup     │  │
│  └───────────────────────┘  └──────────────────────────────────────┘  │
│  ┌───────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  Data Governance Core │  │        Grounded AI Assistant         │  │
│  │ - validate_data.py    │  │ - Screen-aware context               │  │
│  │ - Versioning ledger   │  │ - Source citations & escalation      │  │
│  └───────────────────────┘  └──────────────────────────────────────┘  │
│                                                                        │
│  Database Layer: SQLite (standards_portal.db) [PostgreSQL-Ready]       │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Ingestion & Validation
┌───────────────────────────────────▼────────────────────────────────────┐
│  data/incoming/                                                        │
│  ├── eval_queries.csv (50 benchmark test cases)                        │
│  ├── allied_IS1165_2022.json (REAL / EXTRACTED-UNVERIFIED)             │
│  ├── allied_standards.sample.json (SAMPLE template)                    │
│  └── compliance.sample.json (SAMPLE template)                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Inventory & Status Matrix

| File Path | Description | Status | Source / Extraction Method | Maintainer |
| :--- | :--- | :--- | :--- | :--- |
| `standards_dataset.csv` | Core 3,144 Indian Standards (Food & Dairy Division) | **REAL** | Official BIS Published Repository | BIS Ingestion Pipeline |
| `data/standards.json` | JSON dataset of the 3,144 standards | **REAL** | Generated from `standards_dataset.csv` | Automated ETL |
| `data/incoming/allied_IS1165_2022.json` | Clause 2 normative references for IS 1165:2022 (Whole Milk Powder) | **EXTRACTED-UNVERIFIED** | Clause 2 Gazette extraction | Technical Committee |
| `data/incoming/allied_standards.sample.json` | Batch allied standards template | **SAMPLE** *(verify before use)* | Schema template | Domain Specialists |
| `data/incoming/compliance.sample.json` | Template for QCO, ISI, FSSAI, HSN, GeM | **SAMPLE** *(verify before use)* | Gazette Sample Data Template | Compliance Reviewer |
| `data/incoming/eval_queries.csv` | 50 benchmark queries (clean, hinglish, indic, vague, no_match) | **REAL / BENCHMARK** | Evaluation test suite | AI Evaluation Lead |

---

## 🚀 Quickstart & Run Instructions

### 1. Local Python + Node Run

#### A. Backend (FastAPI):
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Ingest and validate incoming datasets
python scripts/validate_data.py --ingest

# 3. Start the FastAPI server (Port 8080)
python backend/app/main.py
```
API Documentation will be available at `http://localhost:8080/docs`.

#### B. Frontend (React + Vite):
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

---

### 2. One-Command Docker Run
```bash
docker-compose up --build
```
The unified portal will be live at `http://localhost:8080`.

---

## 🧪 Testing & Benchmark Evaluation

### Run Test Suite
```bash
pytest -v
```

### Run 50-Query Benchmark Evaluation
```bash
python scripts/run_eval.py
```
#### Benchmark Performance Summary:
- **Hit @ 3 Accuracy**: **60.0%** (vs 40.0% Keyword Baseline, **+20.0% lift**)
- **Mean Reciprocal Rank (MRR)**: **0.539** (vs 0.375 Keyword Baseline, **+0.164 lift**)
- **Clarification Question Accuracy**: **100.0%**
- **No-Match Out-of-Scope Accuracy**: **100.0%** (Zero hallucination on non-food queries)

### Run 12-Case End-to-End Demo Suite
```bash
python scripts/demo_suite.py
```

---

## 📋 Representative Demo Cases

| # | Case Title | Query / Input Snippet | Key Output / Behavior |
| :- | :--- | :--- | :--- |
| **1** | Liquid Milk & SMP | *"Supply of packaged pasteurized toned milk and skimmed milk powder..."* | Recommends IS 1165 / IS 11721 with 98% High relevance |
| **2** | Grain Silo Storage | *"Bulk procurement, handling, and silo storage of milling wheat and rice..."* | Recommends IS 11816:2010 (Part 1 & 2) |
| **3** | Edible Oil & Vanaspati | *"Purchase of refined edible sunflower oil and vanaspati in tins..."* | Recommends IS 8707 / IS 15969 |
| **4** | Indigenous Dairy | *"Procurement of Paneer, Chhana, Khoa, and Shrikhand..."* | Recommends traditional dairy standards |
| **5** | Microbiological Testing | *"Pathogen screening (E. coli, Salmonella) and hygiene audit..."* | Recommends IS 16068 / IS 16122 (Active) |
| **6** | Non-Food Office Furniture | *"Procurement of modular ergonomic office workstations and laptops..."* | Non-food detected; suppresses out-of-scope results |
| **7** | Allied Standards Graph | `IS 1165:2022` | Displays 8 Clause 2 normative links (Test methods, Sampling, Packaging) |
| **8** | Tender Compliance Checker | Tender text citing `IS 1165:2022` & `IS 99999` | Flags missing Clause 2 test methods + invalid IS 99999 citation |
| **9** | Hindi Indic Query | *"पाश्चुरीकृत टोंड दूध और स्किम्ड मिल्क पाउडर की आपूर्ति..."* | Matches IS 14542 & IS 13334 with High relevance |
| **10** | Marathi Indic Query | *"शालेय पोषण आहारासाठी पाश्चराइज्ड दूध आणि दुग्धजन्य पदार्थ पुरवठा."* | Matches IS 13688:2020 (Packaged Milk) |
| **11** | Vague Ambiguous Query | *"Milk"* | Triggers Clarification Engine with 4 distinct choices |
| **12** | Out-of-Scope Query | *"Ordinary Portland Cement Grade 53 and steel reinforcement bars"* | Returns *"No Confident Match Found"* (0% hallucination) |
