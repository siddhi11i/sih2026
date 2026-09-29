#!/usr/bin/env python3
"""
Candidate Standard Label Suggestion Engine
Bureau of Indian Standards (BIS) — Team Aavishkara (SIH26108)

Proposes candidate Indian Standard (IS) numbers from the canonical dataset for
unlabeled queries in eval_queries.csv to assist domain reviewers with human confirmation.
"""

import os
import sys
import csv
import json
import argparse
from typing import List, Dict, Any

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
EVAL_CSV_PATH = os.path.join(DATA_DIR, "incoming", "eval_queries.csv")
STANDARDS_JSON = os.path.join(DATA_DIR, "standards.json")

def load_standards() -> List[Dict[str, Any]]:
    with open(STANDARDS_JSON, "r", encoding="utf-8") as f:
        return json.load(f)

def suggest_for_query(query: str, standards: List[Dict[str, Any]], top_k: int = 3) -> List[Dict[str, Any]]:
    q_tokens = set(query.lower().split())
    scored = []
    for s in standards:
        title = s.get("title", "").lower()
        num = s.get("is_number", "").lower()
        score = 0
        for t in q_tokens:
            if len(t) > 2:
                if t in num:
                    score += 50
                if t in title:
                    score += 10
        if score > 0:
            scored.append((score, s))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [s for _, s in scored[:top_k]]

def main():
    parser = argparse.ArgumentParser(description="Propose candidate IS labels for benchmark queries")
    parser.add_argument("--csv", default=EVAL_CSV_PATH, help="Path to eval_queries.csv")
    parser.add_argument("--update", action="store_true", help="Interactively or automatically propose labels")
    args = parser.parse_args()

    standards = load_standards()
    rows = []
    with open(args.csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for r in reader:
            rows.append(r)

    print("================================================================================")
    print(" 🎯 CANDIDATE LABEL SUGGESTIONS FOR BENCHMARK QUERIES")
    print("================================================================================")
    unlabeled_count = 0
    for r in rows:
        expected = r.get("expected_standard_numbers", "").strip()
        outcome = r.get("expected_outcome", "")
        if outcome == "match" and not expected:
            unlabeled_count += 1
            suggestions = suggest_for_query(r["query"], standards, top_k=3)
            sugg_str = ", ".join(f"{s['is_number']} ({s['title'][:40]}...)" for s in suggestions)
            print(f"ID {r['id']:<2} | [{r['category']}] \"{r['query']}\"")
            print(f"      👉 Candidates: {sugg_str or 'No clear candidate'}\n")

    print("--------------------------------------------------------------------------------")
    print(f" Total queries evaluated : {len(rows)}")
    print(f" Unlabeled 'match' rows  : {unlabeled_count}")
    print("================================================================================")

if __name__ == "__main__":
    main()
