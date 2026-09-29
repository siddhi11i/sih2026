# Security, Compliance & Deployment Architecture
## SIH 2026 (SIH26108) • Team Aavishkara
### Bureau of Indian Standards (BIS) Recommender for Public Procurement

---

### 1. Overview & Regulatory Framework
To transition from an experimental prototype to a production-ready system adoptable by Government of India Ministries (Ministry of Consumer Affairs, Food & Public Distribution, GeM, NIC), the BIS Standards Recommender adheres strictly to national security, privacy, and accessibility guidelines:

- **DPDP Act 2023**: Digital Personal Data Protection Act compliance.
- **GIGW 3.0**: Guidelines for Indian Government Websites and Web Apps (Accessibility, WCAG 2.1 AA).
- **CERT-In Guidelines**: Indian Computer Emergency Response Team security architecture & audit readiness.
- **National Data Governance Framework Policy (NDGFP)**: Sovereign, offline local data governance.

---

### 2. Architecture & Data Flow Guarantees

```
┌────────────────────────────────────────────────────────┐
│               Client Tier (React / Vite)               │
│      • GIGW 3.0 Accessible UI (High contrast, ARIA)    │
│      • Role-Based Views (Drafter, Reviewer, Admin)     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / TLS 1.3
┌───────────────────────────▼────────────────────────────┐
│          API Gateway & Application Tier (FastAPI)       │
│      • RBAC Authorization & Request Validation         │
│      • 100% Offline / Local Execution (Zero External)  │
│      • Real-time Audit Trail Logger                    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│             Data Store Tier (SQLite / PostgreSQL)       │
│      • AES-256 Encryption at Rest                      │
│      • Immutable Audit Log Ledger                      │
│      • Versioned BIS Gazette Sync Engine               │
└────────────────────────────────────────────────────────┘
```

#### Key Guarantees:
1. **Zero External API Leakage**: No tender text, specification details, or supplier information is ever transmitted to external commercial LLM APIs. Embeddings, BM25 indexing, and re-ranking execute 100% locally on host infrastructure.
2. **Deterministic Data Provenance**: All standard numbers, titles, and year figures are drawn verbatim from official BIS gazette records (`standards_portal.db`). Unverified or sample normative links are explicitly tagged with `EXTRACTED-UNVERIFIED` or `SAMPLE - verify before use`.

---

### 3. Compliance Matrix

| Regulation / Standard | Requirement | Implementation in System |
| :--- | :--- | :--- |
| **DPDP Act 2023** | Purpose limitation & Data minimization | Only procurement technical specifications are processed; no personal identifiable information (PII) is stored or logged. |
| **GIGW 3.0** | Accessible web navigation & contrast | Semantic HTML5, high-contrast Dark UI theme, screen-reader friendly typography, keyboard navigability. |
| **CERT-In** | Comprehensive audit logs | Every recommendation request, human review approval, and search query is logged in `audit_logs` table with timestamp, user role, and dataset hash. |
| **CERT-In** | Vulnerability assessment & penetration readiness | Parameterized SQL queries, strict Pydantic request schema validation, CORS origin whitelisting, rate limiting headers. |
| **NIC / MeitY** | Sovereign government cloud deployment | Containerized architecture ready for deployment on MeghRaj (NIC Cloud) or on-premise government servers. |

---

### 4. Role-Based Access Control (RBAC) Matrix

| Portal Role | Capabilities | Audit Logging |
| :--- | :--- | :--- |
| **Drafter (Procurement)** | Search standards, run Tender Checker, extract BOQ line items, export DOCX/CSV annexures, draft tender specifications. | Read & export logged |
| **Reviewer (Technical)** | Review drafted recommendations, approve / edit / reject standard relevance scores, provide feedback. | Review approvals logged with digital signature |
| **Admin (BIS Director)** | Seed new standards divisions, trigger gazette pipeline synchronization, manage API access keys for external portals (GeM/CPPP). | Admin actions logged with audit trails |

---

### 5. Deployment Options

#### Option A: On-Premise Government Datacenter
- **OS**: Red Hat Enterprise Linux / Ubuntu LTS / Windows Server 2022
- **Runtime**: Python 3.10+, Node.js 18+
- **Reverse Proxy**: NGINX / Caddy with TLS 1.3 and HSTS enabled.

#### Option B: MeghRaj Government Cloud (MeitY Empanelled)
- Docker Compose or Kubernetes deployment with isolated VPC and zero outbound internet gateway requirement.

---
Team Aavishkara • SIH 2026 • SIH26108
