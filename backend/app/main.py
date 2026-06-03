from __future__ import annotations

import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

APP_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_ROOT = APP_ROOT / "frontend"

# Load secrets (GEMINI_API_KEY, etc.) from backend/.env regardless of the
# current working directory. The .env file is git-ignored and must never be
# committed; see .env.example for the expected keys.
load_dotenv(APP_ROOT / ".env")

from .data_loader import load_all_data, CATALOG
from .extraction import GeminiOrderExtractor
from .matching import match_order
from .schemas import ExtractResponse, FeedbackPayload

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load Schablone.xlsx and CompleteItemArchive.xlsx into memory at startup
    success = load_all_data()
    if success:
        print(f"Masterdata loaded successfully. In-memory Catalog size: {len(CATALOG)}")
    else:
        print("Failed to load Excel masterdata. Running with mock fallback data.")
    yield


app = FastAPI(title="AI ERP Order Reconstruction API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for MVP simplicity, can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

extractor = GeminiOrderExtractor()


def model_dump(value):
    if hasattr(value, "model_dump"):
        return value.model_dump()
    return value.dict()


@app.get("/api/health")
async def health() -> dict:
    return {
        "ok": True,
        "live_gemini": extractor.live_enabled,
        "model": extractor.model,
        "catalog_size": len(CATALOG)
    }


@app.post("/api/extract", response_model=ExtractResponse)
async def extract_order(
    customer_code: str = Form(default="CUST-DEMO"),
    text: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
) -> ExtractResponse:
    file_bytes = None
    mime_type = None

    if file is not None and file.filename:
        file_bytes = await file.read()
        mime_type = file.content_type or "application/octet-stream"

    if not text and not file_bytes and extractor.live_enabled:
        raise HTTPException(status_code=400, detail="Provide text or upload a file.")

    # 1. Gemini extraction
    extracted = extractor.extract(text=text, file_bytes=file_bytes, mime_type=mime_type)
    
    # 2. Schema matching
    threshold = int(os.getenv("MATCH_THRESHOLD", "85"))
    matched = match_order(extracted, customer_code=customer_code, threshold=threshold)

    return ExtractResponse(
        live_gemini=extractor.live_enabled,
        model=extractor.model,
        customer_code=customer_code,
        extracted=extracted,
        matched=matched,
    )


@app.post("/api/feedback")
async def save_feedback(payload: FeedbackPayload) -> JSONResponse:
    feedback_path = APP_ROOT / os.getenv("FEEDBACK_PATH", "feedback.jsonl")
    record = model_dump(payload)
    record["received_at"] = datetime.now(timezone.utc).isoformat()

    with feedback_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=True) + "\n")

    return JSONResponse({"ok": True, "path": str(feedback_path)})


# Mount frontend placeholder if the folder exists (to prevent startup failure if frontend folder is not created yet)
if FRONTEND_ROOT.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_ROOT, html=True), name="frontend")
