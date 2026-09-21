# Bureau of Indian Standards (BIS) — Standards Recommender
### National Procurement Conformance Decision-Support System • Food & Dairy Division
Department of Consumer Affairs • Government of India

An intelligent recommendation system and web portal designed to assist public procurement officers, tender drafting committees, and quality inspection boards across India in identifying all applicable Indian Standards (IS).

---

## 🏛️ System Overview

1. **Grounding in Authoritative Indian Standards**:
   - Queries the official repository of **3,144 Indian Standards (IS)** spanning milk and dairy products, foodgrains, edible oils, food safety, storage, and agricultural commodities.
   - **Zero Hallucination Guarantee**: Standard numbers, publication years, and titles are matched verbatim without modification.

2. **Semantic Procurement Understanding**:
   - Evaluates technical specifications, tender terms, and procurement statements (1–3 sentences).
   - Dynamically identifies **all applicable Indian Standards** that must be incorporated into tender technical schedules.
   - **Strict Ranking by Percentage Conformance**: Every identified standard is arranged in descending order according to its calculated percentage match.

3. **Executive Portal & Procurement Utilities**:
   - **Visual Conformance Cards**: Displays standard codes, revision years, sector categories, progress bars, and percentage match indicators (`98% Match`, `85% Match`, etc.).
   - **Formal Text Summary**: Generates structured, standard-compliant tender schedules ready for one-click copy into tender documentation.
   - **Reporting & Exports**: Includes print-ready report generation and CSV export capabilities.
   - **Complete Standards Directory**: Search, filter by sector, and inspect all 3,144 Indian Standards with pagination.

---

## 🚀 Execution Instructions

### Option 1: Standalone Browser Launch (100% Offline)

Because the dataset and semantic matching engine are completely embedded, the portal can be opened directly without network or server setup:

```bash
open index.html
```
*(Or double-click `index.html` in Finder/File Explorer)*.

---

### Option 2: Python Web Server & REST API

To run with the local Python server:

```bash
python3 server.py
```
Then navigate to:
```
http://localhost:8080
```

#### Programmatic REST API Endpoint:
- **GET Request**:
  ```bash
  curl "http://localhost:8080/api/recommend?q=pasteurized+milk+and+skimmed+milk+powder"
  ```
- **POST Request**:
  ```bash
  curl -X POST http://localhost:8080/api/recommend \
    -H "Content-Type: application/json" \
    -d '{"tender": "Procurement of refined sunflower oil and vanaspati"}'
  ```

---

## 📁 Repository Structure

```
bis-standards-recommender/
├── index.html           # Executive portal user interface (Tailwind CSS, BIS styling)
├── app.js               # Client-side semantic engine, dynamic inclusion & percentage ranking
├── server.py            # Python HTTP web server and REST API
├── data/
│   ├── standards.json   # 3,144 Indian Standards structured dataset
│   └── standards.js     # Embedded dataset for offline browser execution
├── standards_dataset.csv # Raw dataset with 3,144 standards
└── README.md            # System documentation and compliance guide
```

---

## 📋 Representative Procurement Cases

The portal includes 6 pre-configured procurement scenarios:
1. **🥛 Liquid Milk & SMP**: *"Supply of packaged pasteurized toned milk and skimmed milk powder for mid-day school meals program in district primary schools."*
2. **🌾 Foodgrains & Warehousing**: *"Bulk procurement, handling, and silo storage of milling wheat and parboiled rice for Food Corporation godowns."*
3. **🌻 Edible Oils & Vanaspati**: *"Purchase of refined edible sunflower oil and vanaspati in food-grade tins for public distribution system."*
4. **🧀 Indigenous Dairy Products**: *"Procurement of traditional dairy products including Paneer, Chhana, Khoa, and Shrikhand for festival rations."*
5. **🔬 Microbiological Testing**: *"Microbiological food safety testing, pathogen screening (E. coli, Salmonella), and hygiene audit for food manufacturing units."*
6. **💻 Non-Food Procurement**: *"Procurement of modular ergonomic office workstations, conference tables, and laptop computers."* (Demonstrates general quality assurance fallback).
