import csv
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

def parse_ground_truth(csv_path: Union[str, Path]) -> Optional[List[Dict[str, Any]]]:
    """Parses a ground truth CSV file containing expected codes, descriptions, units, and quantities."""
    path = Path(csv_path)
    if not path.exists():
        return None
    
    expected = []
    content = path.read_text(encoding="utf-8", errors="ignore")
    # Determine delimiter (tab or comma)
    delim = "\t" if "\t" in content else ","
    
    reader = csv.reader(content.splitlines(), delimiter=delim)
    for row in reader:
        if not row or len(row) < 4:
            continue
        try:
            expected.append({
                "ItemCode": row[0].strip(),
                "description": row[1].strip(),
                "Unit": row[2].strip(),
                "quantity": float(row[3].strip().replace(",", ".")) if row[3] else 0.0
            })
        except ValueError:
            # Skip header or malformed line
            continue
    return expected

def evaluate_matched_order(
    matched_order_data: Union[dict, str, Path],
    ground_truth_csv: Optional[Union[str, Path]] = None
) -> Dict[str, Any]:
    """
    Summarizes matched order results and computes advanced evaluation metrics.
    
    Metrics returned:
        - Matching Quality:
            - total_items
            - average_match_score
            - ambiguous_match_rate
            - validation_required_rate
        - Matching Source Analysis:
            - template_match_rate
            - fallback_catalog_match_rate
            - new_product_rate
        - Ranking Quality (if ground_truth_csv exists):
            - exact_sku_accuracy: correct matches / total ground truth items
            - top_3_accuracy: correct SKU in top 4 candidates (selected + 3 alternatives) / total ground truth items
            - precision
            - recall
            - f1_score
    """
    # 1. Load matched order data
    if isinstance(matched_order_data, (str, Path)):
        path = Path(matched_order_data)
        if not path.exists():
            raise FileNotFoundError(f"Matched order file not found: {path}")
        with open(path, "r", encoding="utf-8") as f:
            matched = json.load(f)
    else:
        matched = matched_order_data

    items = matched.get("items", [])
    total_items = len(items)

    # Counts for matching quality and source analysis
    total_score = 0.0
    ambiguous_count = 0
    val_required_count = 0

    template_count = 0
    fallback_count = 0
    new_product_count = 0

    high_conf = 0
    review_rec = 0
    human_val = 0

    for item in items:
        # Determine score
        selected = item.get("selected", {})
        score = item.get("match confidence") or selected.get("score", 0)
        total_score += score

        # Ambiguity and validation
        alts = item.get("alternatives", [])
        top_alt_score = alts[0].get("score", 0) if alts else 0
        is_ambiguous = (score - top_alt_score) <= 5 if alts else False
        if is_ambiguous:
            ambiguous_count += 1
            
        val_req = item.get("validation_required", True)
        if val_req:
            val_required_count += 1

        # Source
        source = item.get("match source") or selected.get("stage", "")
        if source == "customer_template":
            template_count += 1
        elif source == "fallback_catalog":
            fallback_count += 1
        else:
            new_product_count += 1

        # Confidence labels
        conf_label = item.get("confidence_label", "HUMAN_VALIDATION_REQUIRED")
        if conf_label == "HIGH_CONFIDENCE":
            high_conf += 1
        elif conf_label == "REVIEW_RECOMMENDED":
            review_rec += 1
        else:
            human_val += 1

    avg_score = (total_score / total_items) if total_items > 0 else 0.0
    ambiguous_rate = (ambiguous_count / total_items) if total_items > 0 else 0.0
    val_required_rate = (val_required_count / total_items) if total_items > 0 else 0.0

    template_rate = (template_count / total_items) if total_items > 0 else 0.0
    fallback_rate = (fallback_count / total_items) if total_items > 0 else 0.0
    new_product_rate = (new_product_count / total_items) if total_items > 0 else 0.0

    summary = {
        "matching_quality": {
            "total_items": total_items,
            "average_match_score": round(avg_score, 2),
            "ambiguous_match_rate": round(ambiguous_rate, 4),
            "validation_required_rate": round(val_required_rate, 4),
            "HIGH_CONFIDENCE_count": high_conf,
            "REVIEW_RECOMMENDED_count": review_rec,
            "HUMAN_VALIDATION_REQUIRED_count": human_val,
            "validation_required_count": val_required_count
        },
        "matching_source_analysis": {
            "template_match_rate": round(template_rate, 4),
            "fallback_catalog_match_rate": round(fallback_rate, 4),
            "new_product_rate": round(new_product_rate, 4)
        },
        "ranking_quality": None
    }

    # 3. Evaluate exact SKU match rate and ranking quality if ground truth is available
    if ground_truth_csv:
        ground_truth = parse_ground_truth(ground_truth_csv)
        if ground_truth:
            expected_codes = {item["ItemCode"] for item in ground_truth}
            
            # Map matched items
            matched_codes = set()
            for item in items:
                selected = item.get("selected", {})
                m_code = item.get("best matched ItemCode") or selected.get("code") or item.get("ItemCode")
                if m_code:
                    matched_codes.add(m_code)

            # Exact matches (unique expected codes matched as selected best match)
            correct_matches = 0
            for gt_code in expected_codes:
                found_exact = False
                for item in items:
                    selected = item.get("selected", {})
                    m_code = item.get("best matched ItemCode") or selected.get("code") or item.get("ItemCode")
                    if m_code == gt_code:
                        found_exact = True
                        break
                if found_exact:
                    correct_matches += 1

            # Top-3 Accuracy: For each expected ground truth item, is it in the selected or top-3 alternatives of any item?
            top3_correct_count = 0
            for gt_code in expected_codes:
                found_in_top3 = False
                for item in items:
                    selected = item.get("selected", {})
                    m_code = item.get("best matched ItemCode") or selected.get("code") or item.get("ItemCode")
                    if m_code == gt_code:
                        found_in_top3 = True
                        break
                    # Check alternatives
                    alts = item.get("alternatives", [])
                    alt_codes = {alt.get("code") or alt.get("ItemCode") for alt in alts}
                    if gt_code in alt_codes:
                        found_in_top3 = True
                        break
                if found_in_top3:
                    top3_correct_count += 1

            # Classification/Set metrics
            tp = len(matched_codes & expected_codes)
            fp = len(matched_codes - expected_codes)
            fn = len(expected_codes - matched_codes)

            precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

            exact_accuracy = correct_matches / len(ground_truth) if len(ground_truth) > 0 else 0.0
            top3_accuracy = top3_correct_count / len(ground_truth) if len(ground_truth) > 0 else 0.0

            summary["ranking_quality"] = {
                "exact_sku_accuracy": round(exact_accuracy, 4),
                "top_3_accuracy": round(top3_accuracy, 4),
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "f1_score": round(f1, 4),
                "details": {
                    "tp": tp,
                    "fp": fp,
                    "fn": fn,
                    "correct_matches_count": correct_matches,
                    "top3_retrieved_count": top3_correct_count,
                    "total_ground_truth_items": len(ground_truth)
                }
            }

    return summary

def evaluate_batch_results(
    matched_orders_list: List[Union[dict, str, Path]],
    ground_truth_csvs_list: List[Optional[Union[str, Path]]]
) -> Dict[str, Any]:
    """
    Computes aggregated performance metrics across a batch of matched orders and ground truths.
    """
    summaries = []
    for matched_data, gt_csv in zip(matched_orders_list, ground_truth_csvs_list):
        try:
            summaries.append(evaluate_matched_order(matched_data, gt_csv))
        except Exception as e:
            print(f"Error evaluating order: {e}")
            continue

    if not summaries:
        return {}

    # Aggregations
    total_items = 0
    sum_avg_score = 0.0
    sum_ambiguous_rate = 0.0
    sum_val_required_rate = 0.0

    total_high_conf = 0
    total_review_rec = 0
    total_human_val = 0
    total_val_req = 0

    sum_template_rate = 0.0
    sum_fallback_rate = 0.0
    sum_new_product_rate = 0.0

    # For ranking quality aggregation (only count orders with ground truth)
    gt_orders_count = 0
    sum_exact_accuracy = 0.0
    sum_top3_accuracy = 0.0
    sum_precision = 0.0
    sum_recall = 0.0
    sum_f1 = 0.0

    for s in summaries:
        mq = s["matching_quality"]
        total_items += mq["total_items"]
        sum_avg_score += mq["average_match_score"]
        sum_ambiguous_rate += mq["ambiguous_match_rate"]
        sum_val_required_rate += mq["validation_required_rate"]

        total_high_conf += mq["HIGH_CONFIDENCE_count"]
        total_review_rec += mq["REVIEW_RECOMMENDED_count"]
        total_human_val += mq["HUMAN_VALIDATION_REQUIRED_count"]
        total_val_req += mq["validation_required_count"]

        msa = s["matching_source_analysis"]
        sum_template_rate += msa["template_match_rate"]
        sum_fallback_rate += msa["fallback_catalog_match_rate"]
        sum_new_product_rate += msa["new_product_rate"]

        rq = s["ranking_quality"]
        if rq is not None:
            gt_orders_count += 1
            sum_exact_accuracy += rq["exact_sku_accuracy"]
            sum_top3_accuracy += rq["top_3_accuracy"]
            sum_precision += rq["precision"]
            sum_recall += rq["recall"]
            sum_f1 += rq["f1_score"]

    num_orders = len(summaries)
    
    batch_summary = {
        "batch_metadata": {
            "total_orders": num_orders,
            "total_items": total_items
        },
        "matching_quality": {
            "average_match_score": round(sum_avg_score / num_orders, 2) if num_orders > 0 else 0.0,
            "ambiguous_match_rate": round(sum_ambiguous_rate / num_orders, 4) if num_orders > 0 else 0.0,
            "validation_required_rate": round(sum_val_required_rate / num_orders, 4) if num_orders > 0 else 0.0,
            "HIGH_CONFIDENCE_count": total_high_conf,
            "REVIEW_RECOMMENDED_count": total_review_rec,
            "HUMAN_VALIDATION_REQUIRED_count": total_human_val,
            "validation_required_count": total_val_req
        },
        "matching_source_analysis": {
            "template_match_rate": round(sum_template_rate / num_orders, 4) if num_orders > 0 else 0.0,
            "fallback_catalog_match_rate": round(sum_fallback_rate / num_orders, 4) if num_orders > 0 else 0.0,
            "new_product_rate": round(sum_new_product_rate / num_orders, 4) if num_orders > 0 else 0.0
        },
        "ranking_quality": None
    }

    if gt_orders_count > 0:
        batch_summary["ranking_quality"] = {
            "average_exact_sku_accuracy": round(sum_exact_accuracy / gt_orders_count, 4),
            "average_top_3_accuracy": round(sum_top3_accuracy / gt_orders_count, 4),
            "average_precision": round(sum_precision / gt_orders_count, 4),
            "average_recall": round(sum_recall / gt_orders_count, 4),
            "average_f1_score": round(sum_f1 / gt_orders_count, 4),
            "evaluated_orders_count": gt_orders_count
        }

    return batch_summary

def evaluate_feedback_performance(
    feedback_jsonl_path: Union[str, Path],
    customer_code: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calculates review performance rates (confirmed, edited, and rejected rates) from feedback.jsonl logs.
    """
    path = Path(feedback_jsonl_path)
    if not path.exists():
        return {
            "total_reviewed_items": 0,
            "confirmed_rate": 0.0,
            "edited_rate": 0.0,
            "rejected_rate": 0.0,
            "counts": {"confirmed": 0, "edited": 0, "rejected": 0}
        }

    confirmed_count = 0
    edited_count = 0
    rejected_count = 0

    with path.open("r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                record = json.loads(line)
                # Filter by customer code if specified
                if customer_code and record.get("customer_code") != customer_code:
                    continue
                
                items = record.get("items", [])
                for item in items:
                    action = item.get("action", "").lower().strip()
                    if action == "confirmed":
                        confirmed_count += 1
                    elif action == "edited":
                        edited_count += 1
                    elif action == "rejected":
                        rejected_count += 1
            except Exception as e:
                # Ignore corrupted lines
                continue

    total_reviewed = confirmed_count + edited_count + rejected_count

    return {
        "total_reviewed_items": total_reviewed,
        "confirmed_rate": round(confirmed_count / total_reviewed, 4) if total_reviewed > 0 else 0.0,
        "edited_rate": round(edited_count / total_reviewed, 4) if total_reviewed > 0 else 0.0,
        "rejected_rate": round(rejected_count / total_reviewed, 4) if total_reviewed > 0 else 0.0,
        "counts": {
            "confirmed": confirmed_count,
            "edited": edited_count,
            "rejected": rejected_count
        }
    }
