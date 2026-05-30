import os
import json
from pathlib import Path
import dotenv

# Load environment variables
dotenv.load_dotenv()

from app.data_loader import load_all_data, CATALOG, CUSTOMER_HISTORY
from app.matching import match_order
from app.schemas import ExtractedOrder

def main():
    print("=== Matching Test ===")
    
    # 1. Load data
    data_dir = os.getenv("DATA_DIR")
    print(f"Loading masterdata from: {data_dir}")
    
    if not load_all_data(data_dir):
        print("Error: Failed to load masterdata from Excel files.")
        return
        
    print(f"Catalog loaded: {len(CATALOG)} items")
    print(f"Customer templates loaded: {len(CUSTOMER_HISTORY)} customers")
    
    # 2. Read extraction result
    result_path = Path("extraction_result.json")
    if not result_path.exists():
        print("Error: extraction_result.json does not exist. Run extraction test first.")
        return
        
    print(f"Reading extraction results from: {result_path.absolute()}")
    raw_json = result_path.read_text(encoding="utf-8")
    
    # Parse as Pydantic model
    extracted_order = ExtractedOrder.model_validate_json(raw_json)
    
    # Customer code parsed from filename E0131_001.txt is E0131
    customer_code = "E0131"
    threshold = int(os.getenv("MATCH_THRESHOLD", "85"))
    print(f"Matching for customer: {customer_code} (threshold: {threshold})")
    
    # 3. Match
    matched_order = match_order(extracted_order, customer_code=customer_code, threshold=threshold)
    
    # 4. Format according to tasks requirements:
    # - original raw_text
    # - quantity
    # - unit_hint
    # - best matched ItemCode
    # - matched description
    # - UnitOfMeasurement
    # - match confidence
    # - match source
    # - validation_required
    # - top 3 alternatives
    
    output_items = []
    for item in matched_order.items:
        selected = item.selected
        validation_required = item.validation_required
        confidence_label = item.confidence_label
        
        # Format alternatives as a simple list of codes + descriptions + scores
        alternatives_list = []
        for alt in item.alternatives:
            alternatives_list.append({
                "ItemCode": alt.code,
                "description": alt.description,
                "score": alt.score
            })
            
        output_items.append({
            "original raw_text": item.raw_text,
            "quantity": item.requested_quantity,
            "unit_hint": item.requested_unit_hint,
            "best matched ItemCode": selected.code,
            "matched description": selected.description,
            "UnitOfMeasurement": selected.unit,
            "match confidence": selected.score,
            "match source": selected.stage,
            "confidence_label": confidence_label,
            "validation_required": validation_required,
            "top 3 alternatives": alternatives_list
        })
        
    output_result = {
        "customer_code": customer_code,
        "delivery_note": matched_order.delivery_note,
        "items": output_items
    }
    
    # 5. Save results
    formatted_json = json.dumps(output_result, indent=2, ensure_ascii=False)
    
    print("\n=== Matched Result Preview ===")
    print(formatted_json)
    
    output_path = Path("matched_result.json")
    output_path.write_text(formatted_json, encoding="utf-8")
    print(f"\nSaved matched results to: {output_path.absolute()}")

if __name__ == "__main__":
    main()
