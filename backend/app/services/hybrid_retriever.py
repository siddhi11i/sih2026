import os
import json
import re
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.config import settings
from app.db.database import execute_query
from app.services.query_preprocessor import clean_and_normalize_query

COMMODITY_ANCHORS = {
    "milk": 28.0, "pasteurized": 26.0, "skimmed": 24.0, "powder": 22.0, "toned": 24.0,
    "butter": 24.0, "ghee": 26.0, "cheese": 24.0, "paneer": 30.0, "chhana": 30.0,
    "khoa": 30.0, "shrikhand": 30.0, "dahi": 24.0, "curd": 22.0, "yoghurt": 24.0,
    "kulfi": 22.0, "ice cream": 22.0, "condensed": 24.0, "lactose": 22.0, "casein": 24.0,
    "dairy": 20.0, "wheat": 26.0, "atta": 26.0, "maida": 26.0, "suji": 26.0, "rice": 26.0,
    "paddy": 26.0, "dal": 24.0, "pulse": 24.0, "pulses": 24.0, "cereal": 22.0, "foodgrain": 24.0,
    "sunflower": 28.0, "mustard": 26.0, "soybean": 24.0, "groundnut": 24.0, "vanaspati": 30.0,
    "edible oil": 28.0, "sugar": 24.0, "jaggery": 24.0, "gur": 24.0, "salmonella": 28.0,
    "coliform": 28.0, "escherichia": 28.0, "coli": 28.0, "haccp": 28.0, "microbiology": 24.0,
    "hygiene": 22.0, "aflatoxin": 26.0, "pesticide": 24.0, "strawberries": 26.0, "cold storage": 26.0,
    "starch": 28.0, "corn flour": 28.0, "maize": 26.0, "tractor": 28.0, "rops": 30.0,
    "sucralose": 30.0, "acesulfame": 30.0, "temephos": 30.0, "bromadiolone": 30.0, "rodent": 28.0
}

NON_FOOD_TERMS = {
    "furniture", "chair", "chairs", "table", "tables", "desk", "desks", "computer", "computers",
    "laptop", "laptops", "software", "hardware", "printer", "printers", "network", "switches",
    "vehicle", "vehicles", "car", "cars", "diesel", "utility", "fleet", "ambulance", "ambulances",
    "cement", "steel", "concrete", "bars", "reinforcement", "building", "civil", "construction",
    "textile", "clothing", "garment", "stationery", "paper", "office", "workstations", "swivel",
    "gloves", "gowns", "masks", "respiratory", "surgical", "hospital", "medical", "n95", "disposable"
}

class HybridRetriever:
    _instance = None

    def __init__(self):
        self.standards: List[Dict[str, Any]] = []
        self.bm25 = None
        self.tokenized_corpus = []
        self.vectorizer = None
        self.tfidf_matrix = None
        self._initialize_data()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def reload(self):
        """Hot-reloads the standards catalog and rebuilds the BM25 and semantic matrices."""
        self._initialize_data()
        return len(self.standards)

    def _initialize_data(self):
        rows = execute_query("SELECT * FROM standards;")
        if not rows and os.path.exists(settings.STANDARDS_JSON):
            with open(settings.STANDARDS_JSON, "r", encoding="utf-8") as f:
                rows = json.load(f)

        self.standards = rows
        corpus_tokens = []
        corpus_texts = []

        for row in self.standards:
            title = row.get("clean_title") or row.get("title", "")
            is_num = row.get("is_number", "")
            scope = row.get("scope_text", "")
            cat = row.get("category", "")
            std_type = row.get("standard_type", "")

            combined_text = f"{is_num} {title} {cat} {std_type} {scope}".lower()
            tokens = re.findall(r'\b[a-z0-9]+\b', combined_text)

            corpus_tokens.append(tokens)
            corpus_texts.append(combined_text)

        self.tokenized_corpus = corpus_tokens
        if corpus_tokens:
            self.bm25 = BM25Okapi(corpus_tokens)

        # Build sublinear word + char n-gram TF-IDF vector matrix (100% offline & fast)
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            sublinear_tf=True,
            min_df=1,
            token_pattern=r'(?u)\b\w+\b'
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus_texts)

    def retrieve(
        self,
        cleaned_query: str,
        category_filter: Optional[str] = None,
        standard_type_filter: Optional[str] = None,
        status_filter: Optional[str] = None,
        year_min: Optional[int] = None,
        top_k: int = 12
    ) -> Tuple[List[Dict[str, Any]], bool]:
        # If query contains non-ascii Indic characters, ensure normalization
        if any(ord(c) > 127 for c in cleaned_query):
            norm_q, _, _ = clean_and_normalize_query(cleaned_query)
            if norm_q:
                cleaned_query = norm_q

        q_lower = cleaned_query.lower()
        q_tokens = re.findall(r'\b[a-z0-9]+\b', q_lower)

        # Check out-of-scope non-food queries
        non_food_hits = sum(1 for t in q_tokens if t in NON_FOOD_TERMS)
        food_hits = sum(1 for t in q_tokens if t in COMMODITY_ANCHORS)
        is_non_food = non_food_hits >= 2 and food_hits == 0

        # 1. BM25 Lexical Score
        bm25_scores = np.zeros(len(self.standards))
        if self.bm25 and q_tokens:
            raw_bm25 = np.array(self.bm25.get_scores(q_tokens))
            max_b = np.max(raw_bm25) if np.max(raw_bm25) > 0 else 1.0
            bm25_scores = raw_bm25 / max_b

        # 2. Dense TF-IDF N-gram Semantic Vector Score
        dense_scores = np.zeros(len(self.standards))
        if self.vectorizer is not None and self.tfidf_matrix is not None:
            q_vec = self.vectorizer.transform([q_lower])
            sims = cosine_similarity(q_vec, self.tfidf_matrix)[0]
            dense_scores = np.clip(sims, 0, 1.0)

        scored_candidates = []
        for idx, s in enumerate(self.standards):
            if category_filter and category_filter.lower() not in (s.get("category") or "").lower():
                continue
            if status_filter and status_filter.lower() not in (s.get("status") or "").lower():
                continue
            if year_min:
                try:
                    s_yr = int(re.search(r'\d{4}', str(s.get("year", ""))).group())
                    if s_yr < year_min:
                        continue
                except Exception:
                    pass

            title_clean = (s.get("clean_title") or s.get("title", "")).lower()
            is_num_clean = (s.get("is_number") or "").lower()

            bm25_val = float(bm25_scores[idx]) if idx < len(bm25_scores) else 0.0
            dense_val = float(dense_scores[idx]) if idx < len(dense_scores) else 0.0

            # 55% Dense Vector N-gram + 45% BM25 Lexical
            base_score = 0.55 * dense_val + 0.45 * bm25_val

            why_matched = []
            matched_terms = []
            boost = 0.0

            # Exact IS number boost (+0.55 boost)
            for tok in q_tokens:
                if len(tok) >= 3 and tok in is_num_clean:
                    boost += 0.55
                    why_matched.append(f"Exact Standard Reference: '{tok}'")
                    matched_terms.append(tok)

            # Commodity Anchor Matches
            for anchor, weight in COMMODITY_ANCHORS.items():
                if anchor in q_lower and anchor in title_clean:
                    boost += (weight / 100.0) * 0.40
                    why_matched.append(f"Domain Commodity: '{anchor}'")
                    matched_terms.append(anchor)

            # Specification boost
            if "specification" in title_clean and "specification" in q_lower:
                boost += 0.08
                why_matched.append("Product Specification")

            final_score = min(0.99, base_score + boost)

            if is_non_food:
                final_score *= 0.25

            if final_score >= settings.NO_MATCH_THRESHOLD:
                if final_score >= settings.TIER_HIGH_THRESHOLD:
                    tier = "High"
                elif final_score >= settings.TIER_MEDIUM_THRESHOLD:
                    tier = "Medium"
                else:
                    tier = "Low"

                match_pct = int(round(final_score * 100))

                is_num = s.get("is_number")
                allied_count = 0
                allied_rows = execute_query(
                    "SELECT COUNT(*) as cnt FROM allied_standards WHERE source_standard_number LIKE ?;",
                    (f"%{is_num.split(':')[0].strip()}%",)
                )
                if allied_rows:
                    allied_count = allied_rows[0].get("cnt", 0)

                scored_candidates.append({
                    "id": s.get("id", idx + 1),
                    "sno": s.get("sno", idx + 1),
                    "is_number": s.get("is_number"),
                    "year": s.get("year"),
                    "title": s.get("clean_title") or s.get("title"),
                    "category": s.get("category", "General & Allied"),
                    "standard_type": s.get("standard_type"),
                    "status": s.get("status", "Current"),
                    "amendment_no": s.get("amendment_no"),
                    "data_status": s.get("data_status", "REAL"),
                    "match_pct": match_pct,
                    "score": round(final_score, 3),
                    "match_tier": tier,
                    "why_matched": list(dict.fromkeys(why_matched))[:4],
                    "matched_terms": list(dict.fromkeys(matched_terms)),
                    "allied_count": allied_count,
                    "scope_text": s.get("scope_text")
                })

        # Sort by descending score
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        return scored_candidates[:top_k], is_non_food
