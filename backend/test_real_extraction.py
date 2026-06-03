import sys
import os
import json
from pathlib import Path
import dotenv

# Load environment variables from .env
dotenv.load_dotenv()

from app.extraction import GeminiOrderExtractor
from app.schemas import ExtractedOrder

def main():
    # 1. Define source file path
    default_file = (
        Path(__file__).parent 
        / "Start Data Project " 
        / "OneDrive_1_5-25-2026" 
        / "1. Orders" 
        / "E0131_001.txt"
    )
    
    file_path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_file
    
    print(f"=== Extraction Test ===")
    print(f"Source file: {file_path.absolute()}")
    
    if not file_path.exists():
        print(f"Error: File does not exist at {file_path}")
        sys.exit(1)
        
    # Determine mime-type
    ext = file_path.suffix.lower()
    if ext == ".txt":
        mime_type = "text/plain"
    elif ext in [".jpg", ".jpeg"]:
        mime_type = "image/jpeg"
    elif ext == ".png":
        mime_type = "image/png"
    elif ext == ".pdf":
        mime_type = "application/pdf"
    elif ext in [".m4a", ".mp4"]:
        mime_type = "audio/mp4"
    else:
        mime_type = "application/octet-stream"
        
    print(f"Inferred MIME-Type: {mime_type}")
    
    # 2. Read file content
    file_bytes = file_path.read_bytes()
    raw_content_preview = ""
    if mime_type == "text/plain":
        raw_content_preview = file_bytes.decode("utf-8", errors="ignore")
        print(f"\nRaw Input Text Content:\n{raw_content_preview}")
    else:
        print(f"\nRaw Input File Size: {len(file_bytes)} bytes")
        
    # 3. Setup Gemini extractor
    extractor = GeminiOrderExtractor()
    print(f"\nModel configured: {extractor.model}")
    print(f"API key loaded: {bool(extractor.api_key)}")
    
    if not extractor.api_key:
        print("\n[WARNING] No GEMINI_API_KEY detected in environment or .env!")
        print("Extractor will run in DEMO MODE and return hardcoded mock data.")
        
    # 4. Execute extraction
    print("\nSending request to Gemini...")
    try:
        if mime_type == "text/plain":
            # For plain text files, we can pass it as text parameter
            extracted = extractor.extract(text=raw_content_preview)
        else:
            # For images/PDFs, we pass bytes and mime_type
            extracted = extractor.extract(file_bytes=file_bytes, mime_type=mime_type)
            
        print("\nGemini Response Received Successfully!")
        
        # Convert to dict and dump JSON
        result_dict = extracted.model_dump() if hasattr(extracted, "model_dump") else extracted.dict()
        formatted_json = json.dumps(result_dict, indent=2, ensure_ascii=False)
        
        print("\n--- Parsed JSON Output ---")
        print(formatted_json)
        
        # Save to output file
        output_file = Path(__file__).parent / "extraction_result.json"
        output_file.write_text(formatted_json, encoding="utf-8")
        print(f"\nSaved structured JSON result to: {output_file.absolute()}")
        
    except Exception as e:
        print(f"\n[ERROR] Extraction failed!")
        print(f"Exception Type: {type(e)}")
        print(f"Exception Details: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
