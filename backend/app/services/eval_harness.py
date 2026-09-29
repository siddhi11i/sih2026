import os
import csv
import json
import time
from typing import Dict, Any, List
from app.config import settings
from app.services.query_preprocessor import clean_and_normalize_query
from app.services.hybrid_retriever import HybridRetriever
from app.services.clarifier import check_clarification_needed

def normalize_std(s: str) -> str:
    return "".join(s.lower().split()).replace(":", "").replace("-", "")

def run_keyword_baseline(query: str, standards: List[Dict[str, Any]], top_k: int = 5) -> List[str]:
    q_tokens = set(query.lower().split())
    scored = []
    for s in standards:
        title = (s.get("clean_title") or s.get("title", "")).lower()
        num = s.get("is_number", "").lower()
        hits = sum(1 for t in q_tokens if len(t) > 2 and (t in title or t in num))
        if hits > 0:
            scored.append((hits, s.get("is_number", "")))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [num for _, num in scored[:top_k]]

def evaluate_system(csv_path: str = None) -> Dict[str, Any]:
    if not csv_path:
        csv_path = os.path.join(settings.INCOMING_DIR, "eval_queries.csv")

    retriever = HybridRetriever.get_instance()
    
    rows = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)

    total_queries = len(rows)
    match_rows = [r for r in rows if r["expected_outcome"] == "match"]
    clarify_rows = [r for r in rows if r["expected_outcome"] == "clarify"]
    no_match_rows = [r for r in rows if r["expected_outcome"] == "no_match"]

    labeled_match_rows = [r for r in match_rows if r.get("expected_standard_numbers", "").strip()]
    unlabeled_match_count = len(match_rows) - len(labeled_match_rows)

    # Metrics for Proposed Hybrid Model
    hits_at_1 = 0
    hits_at_3 = 0
    hits_at_5 = 0
    reciprocal_ranks = []
    category_performance: Dict[str, Dict[str, Any]] = {}

    # Metrics for Keyword Baseline
    base_hits_at_1 = 0
    base_hits_at_3 = 0
    base_hits_at_5 = 0
    base_rr = []

    start_time = time.time()

    for r in labeled_match_rows:
        q = r["query"]
        cat = r["category"]
        expected_raw = [x.strip() for x in r["expected_standard_numbers"].split(",") if x.strip()]
        expected_normalized = [normalize_std(x) for x in expected_raw]

        cleaned_q, _, _ = clean_and_normalize_query(q)
        results, is_non_food = retriever.retrieve(cleaned_q, top_k=10)
        retrieved_numbers = [r_item["is_number"] for r_item in results]
        retrieved_normalized = [normalize_std(num) for num in retrieved_numbers]

        # Check hybrid rank
        rank = None
        for idx, ret_norm in enumerate(retrieved_normalized):
            if any(exp in ret_norm or ret_norm in exp for exp in expected_normalized):
                rank = idx + 1
                break

        if rank == 1:
            hits_at_1 += 1
        if rank and rank <= 3:
            hits_at_3 += 1
        if rank and rank <= 5:
            hits_at_5 += 1

        rr = (1.0 / rank) if rank else 0.0
        reciprocal_ranks.append(rr)

        # Baseline comparison
        base_results = run_keyword_baseline(q, retriever.standards, top_k=5)
        base_norm = [normalize_std(x) for x in base_results]
        b_rank = None
        for idx, b_n in enumerate(base_norm):
            if any(exp in b_n or b_n in exp for exp in expected_normalized):
                b_rank = idx + 1
                break
        if b_rank == 1:
            base_hits_at_1 += 1
        if b_rank and b_rank <= 3:
            base_hits_at_3 += 1
        if b_rank and b_rank <= 5:
            base_hits_at_5 += 1
        base_rr.append((1.0 / b_rank) if b_rank else 0.0)

        # Track by category
        if cat not in category_performance:
            category_performance[cat] = {"total": 0, "hit_at_3": 0, "mrr_sum": 0.0}
        category_performance[cat]["total"] += 1
        if rank and rank <= 3:
            category_performance[cat]["hit_at_3"] += 1
        category_performance[cat]["mrr_sum"] += rr

    # Clarify Accuracy
    clarify_correct = 0
    for r in clarify_rows:
        cq = check_clarification_needed(r["query"])
        if cq is not None:
            clarify_correct += 1
    clarify_accuracy = (clarify_correct / len(clarify_rows)) if clarify_rows else 1.0

    # No-match Accuracy
    no_match_correct = 0
    for r in no_match_rows:
        cleaned_q, _, _ = clean_and_normalize_query(r["query"])
        res, is_non_food = retriever.retrieve(cleaned_q, top_k=5)
        # Check if empty or flagged non-food below threshold
        if len(res) == 0 or is_non_food or (len(res) > 0 and res[0]["score"] < 0.45):
            no_match_correct += 1
    no_match_accuracy = (no_match_correct / len(no_match_rows)) if no_match_rows else 1.0

    n_labeled = len(labeled_match_rows) or 1
    hit_1_pct = (hits_at_1 / n_labeled) * 100.0
    hit_3_pct = (hits_at_3 / n_labeled) * 100.0
    hit_5_pct = (hits_at_5 / n_labeled) * 100.0
    mrr = sum(reciprocal_ranks) / n_labeled

    base_hit_1_pct = (base_hits_at_1 / n_labeled) * 100.0
    base_hit_3_pct = (base_hits_at_3 / n_labeled) * 100.0
    base_hit_5_pct = (base_hits_at_5 / n_labeled) * 100.0
    base_mrr = sum(base_rr) / n_labeled

    # Category summaries
    cat_summary = {}
    for cat, data in category_performance.items():
        tot = data["total"] or 1
        cat_summary[cat] = {
            "total_queries": data["total"],
            "hit_at_3_pct": round((data["hit_at_3"] / tot) * 100.0, 1),
            "mrr": round(data["mrr_sum"] / tot, 3)
        }

    duration = round(time.time() - start_time, 2)

    return {
        "total_test_queries": total_queries,
        "labeled_match_queries": len(labeled_match_rows),
        "unlabeled_match_queries_skipped": unlabeled_match_count,
        "clarify_queries_tested": len(clarify_rows),
        "no_match_queries_tested": len(no_match_rows),
        "execution_time_seconds": duration,
        "metrics": {
            "proposed_model": {
                "hit_at_1_pct": round(hit_1_pct, 1),
                "hit_at_3_pct": round(hit_3_pct, 1),
                "hit_at_5_pct": round(hit_5_pct, 1),
                "mrr": round(mrr, 3),
                "clarify_accuracy_pct": round(clarify_accuracy * 100.0, 1),
                "no_match_accuracy_pct": round(no_match_accuracy * 100.0, 1)
            },
            "keyword_baseline": {
                "hit_at_1_pct": round(base_hit_1_pct, 1),
                "hit_at_3_pct": round(base_hit_3_pct, 1),
                "hit_at_5_pct": round(base_hit_5_pct, 1),
                "mrr": round(base_mrr, 3)
            },
            "gain_over_baseline": {
                "hit_at_3_lift": f"+{round(hit_3_pct - base_hit_3_pct, 1)}%",
                "mrr_lift": f"+{round(mrr - base_mrr, 3)}"
            }
        },
        "category_breakdown": cat_summary
    }
