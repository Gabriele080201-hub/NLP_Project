import os
import json
import csv
from pathlib import Path
import dotenv

# Load environment variables
dotenv.load_dotenv()

from app.data_loader import load_all_data, CATALOG
from app.extraction import GeminiOrderExtractor
from app.matching import match_order
from app.schemas import ExtractedOrder

def parse_ground_truth(csv_path: Path):
    if not csv_path.exists():
        return None
    
    expected = []
    # Read as tab-separated since we saw tabs in the CSV output
    content = csv_path.read_text(encoding="utf-8", errors="ignore")
    # Determine delimiter
    delim = "\t" if "\t" in content else ","
    
    reader = csv.reader(content.splitlines(), delimiter=delim)
    for row in reader:
        if not row or len(row) < 4:
            continue
        expected.append({
            "ItemCode": row[0].strip(),
            "description": row[1].strip(),
            "Unit": row[2].strip(),
            "quantity": float(row[3].strip().replace(",", ".")) if row[3] else 0.0
        })
    return expected

def main():
    # 1. Load data
    data_dir = os.getenv("DATA_DIR")
    if not load_all_data(data_dir):
        print("Error: Failed to load masterdata.")
        return
        
    orders_dir = Path(data_dir) / "1. Orders"
    
    # Test cases: customer_code, file_name, ground_truth_name
    test_cases = [
        ("B0244", "B0244_0001.txt", "B0244_0001.csv"),
        ("O0140", "O0140_0001.txt", "O0140_0001.csv"),
        ("S0942", "S0942_0001.txt", "S0942_0001.csv"),
        ("E0131", "E0131_0001.jpg", "E0131_0001.csv"),
        ("B0433", "B0433_0001.jpg", "B0433_0001.csv"),
    ]
    
    extractor = GeminiOrderExtractor()
    
    print(f"=== Running Batch Pipeline (Live Gemini: {extractor.live_enabled}) ===")
    
    for customer_code, filename, csv_name in test_cases:
        file_path = orders_dir / filename
        csv_path = orders_dir / csv_name
        
        print(f"\n--- Processing: {filename} (Customer: {customer_code}) ---")
        if not file_path.exists():
            print(f"Skipping: {file_path} does not exist.")
            continue
            
        ext = file_path.suffix.lower()
        if ext == ".txt":
            mime_type = "text/plain"
        elif ext in [".jpg", ".jpeg"]:
            mime_type = "image/jpeg"
        elif ext == ".png":
            mime_type = "image/png"
        else:
            mime_type = "application/octet-stream"
            
        # 1. Extract with retry on 503
        import time
        file_bytes = file_path.read_bytes()
        extracted = None
        for attempt in range(5):
            try:
                if mime_type == "text/plain":
                    raw_text = file_bytes.decode("utf-8", errors="ignore")
                    extracted = extractor.extract(text=raw_text)
                else:
                    extracted = extractor.extract(file_bytes=file_bytes, mime_type=mime_type)
                break
            except Exception as e:
                print(f"  [WARNING] Extraction attempt {attempt+1} failed: {e}")
                if attempt < 4:
                    wait_time = (attempt + 1) * 6
                    print(f"  Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                else:
                    raise e
            
        # 2. Match
        matched = match_order(extracted, customer_code=customer_code)
        
        # 3. Format Output
        output_items = []
        for item in matched.items:
            selected = item.selected
            
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
                "confidence_label": item.confidence_label,
                "validation_required": item.validation_required,
                "top 3 alternatives": alternatives_list
            })
            
        result_json = {
            "customer_code": customer_code,
            "delivery_note": matched.delivery_note,
            "items": output_items
        }
        
        # 4. Save result
        out_path = Path(f"{customer_code}_matched.json")
        out_path.write_text(json.dumps(result_json, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Saved matched result to: {out_path.absolute()}")
        
        # 5. Compare with ground truth
        ground_truth = parse_ground_truth(csv_path)
        if ground_truth:
            print("\nComparing with Ground Truth:")
            print(f"Ground Truth CSV size: {len(ground_truth)} items")
            print(f"Extracted/Matched size: {len(output_items)} items")
            
            # Map of expected ItemCodes
            expected_codes = {item["ItemCode"]: item for item in ground_truth}
            matched_codes = {item["best matched ItemCode"]: item for item in output_items}
            
            print("\nMatches Summary:")
            for m_item in output_items:
                m_code = m_item["best matched ItemCode"]
                raw_text = m_item["original raw_text"]
                conf = m_item["match confidence"]
                label = m_item["confidence_label"]
                val_req = m_item["validation_required"]
                
                if m_code in expected_codes:
                    gt_item = expected_codes[m_code]
                    print(f"  [CORRECT] Matched '{raw_text}' -> {m_code} ({gt_item['description']})")
                else:
                    print(f"  [MISMATCH/NEW] Matched '{raw_text}' -> {m_code} ({m_item['matched description']})")
                    
            # Check for missing items
            missing = [code for code in expected_codes if code not in matched_codes]
            if missing:
                print("\nMissing items in match output (not matched to expected code):")
                for code in missing:
                    print(f"  [MISSING] {code} ({expected_codes[code]['description']})")
        else:
            print("No ground truth CSV available.")

if __name__ == "__main__":
    main()
