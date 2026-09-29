# Changelog — BIS Standards Recommender
All notable changes to the Bureau of Indian Standards (BIS) Recommender system are documented here.
**Team Aavishkara • SIH 2026 (SIH26108)**

---

## [Version 2.0.0] - 2026-09-28

### 🏛️ Phase 1 — Core Architecture & Data Layer
- **Data Normalization & Ingestion**:
  - Ingested 3,144 Indian Standards (Food & Dairy Division) into an audited SQLite database with `data_versions` tracking.
  - Implemented `scripts/validate_data.py` to validate schemas, cross-reference standard numbers, and generate data readiness reports.
  - Sourced `data/incoming/allied_IS1165_2022.json` (Clause 2 Normative references for Whole Milk Powder) with `EXTRACTED-UNVERIFIED` provenance.
  - Sourced `allied_standards.sample.json` and `compliance.sample.json` templates explicitly tagged `SAMPLE - verify before use`.
- **Hybrid Retrieval & Reranker**:
  - Implemented hybrid BM25 + sublinear character/word n-gram vector semantic search with commodity anchor weighting.
  - Calibrated High ($\ge 0.75$), Medium ($0.55-0.74$), and Low ($0.40-0.54$) relevance tiers with an explicit "No confident match" threshold ($< 0.38$).
  - Built an explanations engine generating "Why matched" badges and matched domain terms.
- **Normative Allied Standards Graph**:
  - Built graph relations grouping Clause 2 standards into Test Methods, Sampling, Packaging, Terminology, Safety, and Related Products.
  - Safe fallback displaying *"No verified allied data yet"* where unverified.
- **Executive React Dashboard**:
  - Modern React (Vite) + Tailwind CSS dashboard with dark mode, high contrast, and keyboard accessibility.
  - Side-by-side comparison view for 2–4 standards.
  - Export utilities for Tender-Ready DOCX with formal BIS Annexures and CSV schedules.

### 🛡️ Phase 2 — Trust, Compliance & Evaluation
- **Tender Compliance Checker**:
  - Multi-format document parser (PDF, DOCX, XLSX, TXT) with automatic IS number extraction.
  - Flags withdrawn, superseded, amended, missing-allied, and out-of-dataset standard citations with actionable recommendations.
- **Clarification Engine**:
  - Detects ambiguous/vague queries (e.g. *Milk*, *Starch*, *Oil*, *Sugar*, *Grain storage*) and provides targeted disambiguation choices.
- **Compliance & Regulatory Layer**:
  - Integrated Quality Control Order (QCO), BIS ISI Mark, FSSAI regulations, HSN code, and GeM category mappings.
- **Human Verification & Audit Trail**:
  - Drafter-to-Reviewer workflow with approve/reject decisions and feedback logging.
  - Audit log recorder tracking query, results count, top standard, data version, and IP hash.
- **Evaluation Benchmark Harness**:
  - Built `scripts/run_eval.py` testing against 50 queries across clean, Hinglish, Indic, vague, and no-match categories.
  - Evaluated Hit@1/3/5, MRR, Clarify Accuracy (100%), and No-Match Out-of-Scope Accuracy (100%).
  - Built `scripts/suggest_labels.py` for candidate label recommendation.
- **Grounded Support Chatbot**:
  - In-app assistant grounded in help docs and standards data, citing sources, screen context-aware, and support ticket escalation.

### 🚀 Phase 3 — Scale, Security & Containerization
- **Multilingual Support**:
  - Full support for Hindi and Marathi Devanagari queries, Hinglish transliterations, and phonetic mapping.
  - Bhashini integration architecture behind configurable feature flag (`ENABLE_BHASHINI`).
- **Role-Based Access Control (RBAC)**:
  - Profiles for Drafter, Reviewer, and Admin.
- **Docker Compose & Deployment**:
  - Multi-stage Dockerfile and `docker-compose.yml` for single-command deployment.
