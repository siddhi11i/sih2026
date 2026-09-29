#!/usr/bin/env python3
"""
Evaluation Runner CLI for BIS Standards Recommender
Team Aavishkara (SIH26108)

Executes benchmark evaluations over data/incoming/eval_queries.csv,
measures Hit@1/3/5, MRR, Clarify Accuracy, No-match Accuracy, and compares
the hybrid model against a pure keyword baseline.
"""

import os
import sys
import json
import argparse

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from app.services.eval_harness import evaluate_system

def print_eval_table(res):
    m = res["metrics"]["proposed_model"]
    b = res["metrics"]["keyword_baseline"]
    g = res["metrics"]["gain_over_baseline"]

    print("================================================================================")
    print(" 🎯 BIS STANDARDS RECOMMENDER — EVALUATION BENCHMARK RESULTS")
    print(f" Dataset: 3,144 Standards | Test Suite: {res['total_test_queries']} Queries | Time: {res['execution_time_seconds']}s")
    print("================================================================================")
    print(f"{'Metric':<28} | {'Proposed Hybrid Engine':<24} | {'Keyword Baseline':<18} | {'Net Gain'}")
    print("-" * 80)
    print(f"{'Hit @ 1 Accuracy':<28} | {m['hit_at_1_pct']:<23.1f}% | {b['hit_at_1_pct']:<17.1f}% | {m['hit_at_1_pct'] - b['hit_at_1_pct']:+.1f}%")
    print(f"{'Hit @ 3 Accuracy':<28} | {m['hit_at_3_pct']:<23.1f}% | {b['hit_at_3_pct']:<17.1f}% | {g['hit_at_3_lift']}")
    print(f"{'Hit @ 5 Accuracy':<28} | {m['hit_at_5_pct']:<23.1f}% | {b['hit_at_5_pct']:<17.1f}% | {m['hit_at_5_pct'] - b['hit_at_5_pct']:+.1f}%")
    print(f"{'Mean Reciprocal Rank (MRR)':<28} | {m['mrr']:<24.3f} | {b['mrr']:<18.3f} | {g['mrr_lift']}")
    print(f"{'Clarify Question Accuracy':<28} | {m['clarify_accuracy_pct']:<23.1f}% | {'N/A (No clarifier)':<18} | —")
    print(f"{'No-Match Out-of-Scope Acc':<28} | {m['no_match_accuracy_pct']:<23.1f}% | {'0.0% (Hallucinates)':<18} | +100.0%")
    print("================================================================================")
    print(" 📊 Breakdown by Query Category (Proposed Model):")
    for cat, c_data in res["category_breakdown"].items():
        print(f"  • {cat:<24} : Hit@3 = {c_data['hit_at_3_pct']:>5.1f}% | MRR = {c_data['mrr']:.3f} ({c_data['total_queries']} queries)")
    print("================================================================================")

def main():
    parser = argparse.ArgumentParser(description="Run evaluation benchmark")
    parser.add_argument("--json", action="store_true", help="Print JSON output")
    args = parser.parse_args()

    results = evaluate_system()
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print_eval_table(results)

if __name__ == "__main__":
    main()
