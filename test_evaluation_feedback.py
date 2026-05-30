import os
import json
from pathlib import Path
from fastapi.testclient import TestClient

import dotenv
dotenv.load_dotenv()

from app.main import app
from app.evaluation import (
    evaluate_matched_order,
    evaluate_batch_results,
    evaluate_feedback_performance
)

def main():
    # 1. Single Order Evaluation
    print("=== 1. Testing Single Order Evaluation (E0131) ===")
    matched_path = Path("E0131_matched.json")
    gt_path = Path("Start Data Project /OneDrive_1_5-25-2026/1. Orders/E0131_0001.csv")

    if matched_path.exists() and gt_path.exists():
        single_summary = evaluate_matched_order(matched_path, gt_path)
        print(json.dumps(single_summary, indent=2))
    else:
        print(f"E0131 Files not found: matched={matched_path.exists()}, gt={gt_path.exists()}")

    # 2. Batch Evaluation
    print("\n=== 2. Testing Batch Evaluation (All 5 Customer Orders) ===")
    matched_files = ["B0244_matched.json", "O0140_matched.json", "S0942_matched.json", "E0131_matched.json", "B0433_matched.json"]
    gt_files = [
        "Start Data Project /OneDrive_1_5-25-2026/1. Orders/B0244_0001.csv",
        "Start Data Project /OneDrive_1_5-25-2026/1. Orders/O0140_0001.csv",
        "Start Data Project /OneDrive_1_5-25-2026/1. Orders/S0942_0001.csv",
        "Start Data Project /OneDrive_1_5-25-2026/1. Orders/E0131_0001.csv",
        "Start Data Project /OneDrive_1_5-25-2026/1. Orders/B0433_0001.csv"
    ]
    
    # Filter only existing files
    valid_matched = []
    valid_gts = []
    for m, g in zip(matched_files, gt_files):
        if Path(m).exists() and Path(g).exists():
            valid_matched.append(m)
            valid_gts.append(g)

    print(f"Found {len(valid_matched)}/5 matching pairs for evaluation.")
    if valid_matched:
        batch_summary = evaluate_batch_results(valid_matched, valid_gts)
        print(json.dumps(batch_summary, indent=2))

    # 3. Post a fresh feedback payload to make sure we have data in feedback.jsonl
    print("\n=== 3. Simulating Feedback Validation Submit ===")
    client = TestClient(app)
    
    payload = {
        "customer_code": "E0131",
        "reviewer_note": "Validation test runs",
        "items": [
            {
                "action": "confirmed",
                "corrected_item_code": None,
                "original_raw_text": "Ketchup",
                "predicted_item_code": "KEP20",
                "confidence_label": "REVIEW_RECOMMENDED",
                "validation_required": True
            },
            {
                "action": "confirmed",
                "corrected_item_code": None,
                "original_raw_text": "Thunfisch",
                "predicted_item_code": "THB02",
                "confidence_label": "HIGH_CONFIDENCE",
                "validation_required": False
            },
            {
                "action": "edited",
                "corrected_item_code": "MYP20",
                "original_raw_text": "Mayonnaise",
                "predicted_item_code": "MYD22",
                "confidence_label": "REVIEW_RECOMMENDED",
                "validation_required": True
            },
            {
                "action": "rejected",
                "corrected_item_code": None,
                "original_raw_text": "Random noise text",
                "predicted_item_code": "UNKNOWN",
                "confidence_label": "HUMAN_VALIDATION_REQUIRED",
                "validation_required": True
            }
        ]
    }

    os.environ["FEEDBACK_PATH"] = "feedback.jsonl"
    response = client.post("/api/feedback", json=payload)
    print(f"API Post Status Code: {response.status_code}")

    # 4. Review Performance Analysis
    print("\n=== 4. Testing Feedback Review Performance (feedback.jsonl) ===")
    feedback_file = Path("feedback.jsonl")
    if feedback_file.exists():
        perf = evaluate_feedback_performance(feedback_file)
        print(json.dumps(perf, indent=2))
        
        # Specific customer code
        perf_e0131 = evaluate_feedback_performance(feedback_file, customer_code="E0131")
        print("\nSpecific E0131 Feedback Performance:")
        print(json.dumps(perf_e0131, indent=2))
    else:
        print("feedback.jsonl does not exist.")

if __name__ == "__main__":
    main()
