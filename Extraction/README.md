# Extraction Module — Foppa Order Capture

This module is the **input stage** of the AI-powered order capture
pipeline for Foppa GmbH. It transforms heterogeneous customer messages
(handwritten photos, typed text, voice notes) into a validated
`ExtractedOrder` JSON object that the downstream matching module can
consume.

It does **not** do product matching, scoring, or ERP code assignment —
that is the next stage.

## What it handles

| Input type | How to pass it |
|------------|----------------|
| Image (JPG, PNG, WEBP) | `file_bytes=..., mime_type="image/jpeg"` |
| Plain text (TXT, WhatsApp) | `text="..."` |
| Audio (M4A, MP3, WAV, OGG) | `file_bytes=..., mime_type="audio/mp4"` |

All inputs produce the same `ExtractedOrder` schema.

## Quick start

```bash
pip install -r requirements.txt
```

Set your Gemini API key — either in a `.env` file or as an environment variable:

```bash
# .env file (recommended)
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash   # optional, this is the default
```

On **Windows PowerShell** use:
```powershell
$env:GEMINI_API_KEY = "your-key-here"
```

## Usage

```python
from extraction import GeminiOrderExtractor

extractor = GeminiOrderExtractor()   # reads GEMINI_API_KEY from .env or env

# --- From a text message ---
order = extractor.extract(text="20 kg zucchero, 2 cartoni kombucha")

# --- From an image or audio file ---
with open("Data/1. Orders/V0557_0001.jpg", "rb") as f:
    order = extractor.extract(file_bytes=f.read(), mime_type="image/jpeg")

# --- Inspect results ---
print("Delivery note:", order.delivery_note)
for item in order.items:
    print(item.raw_text, item.quantity, item.unit_hint)
```

If `GEMINI_API_KEY` is not set, the extractor falls back to **demo
mode** and returns a fixed mock order. This lets other parts of the
pipeline be developed without spending API credits.

## Architecture

```
extraction/
├── __init__.py         # Public API
├── gemini_pipeline.py  # GeminiOrderExtractor — main class
├── prompts.py          # System prompt, domain glossary, few-shot examples
└── schemas.py          # Pydantic models (ExtractedOrder, ExtractedItem)

tests/
└── test_extraction.py  # Unit tests (no real API calls)

Data/
├── 1. Orders/          # Sample orders: .jpg, .png, .txt, .m4a + ground-truth .csv
└── 2. Masterdata/      # Product catalogue (CompleteItemArchive.xlsx, Schablone.xlsx)

run_simulation.py       # Quick demo: runs extraction on 10 samples and compares to CSV
test.ipynb              # Interactive notebook for manual testing
```

## Public API

### `GeminiOrderExtractor`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `api_key` | `str \| None` | `None` | Gemini API key. Falls back to `GEMINI_API_KEY` env var. |
| `model` | `str \| None` | `None` | Model name. Falls back to `GEMINI_MODEL` env var, then `gemini-2.5-flash`. |

**Attributes:**
- `live_enabled` (`bool`): `True` when a real Gemini client is active, `False` in demo mode.

**Method `extract(...)`:**

| Argument | Type | Description |
|----------|------|-------------|
| `text` | `str \| None` | Plain text message. Mutually exclusive with `file_bytes`. |
| `file_bytes` | `bytes \| None` | Raw bytes of an image or audio file. |
| `mime_type` | `str \| None` | MIME type of `file_bytes` (required when `file_bytes` is provided). |

Returns an `ExtractedOrder`. Raises `ValueError` on bad argument combinations and `ExtractionError` on API or schema failures.

### Output Schema

```python
class ExtractedOrder:
    customer_hint:  str | None      # customer name/code if visible in the document
    delivery_note:  str | None      # delivery date or special instruction
    raw_text:       str             # full recognized text or transcript
    items:          list[ExtractedItem]

class ExtractedItem:
    raw_text:   str             # item phrase exactly as written
    quantity:   float | None   # numeric amount, or null if not readable
    unit_hint:  str | None     # canonical unit: "kg", "carton", "sack", "bottle", …
    notes:      str | None     # item-specific comment
```

## Design choices

- **Single extraction class**: `GeminiOrderExtractor.extract()` accepts both text and binary payloads, keeping the public API minimal.
- **Prompts in their own file**: [`prompts.py`](extraction/prompts.py) contains the full system prompt, dialect glossary, unit vocabulary, and few-shot examples. Edit this file to tune extraction behaviour without touching orchestration logic.
- **No external OCR or STT**: Gemini's native multimodal vision and audio understanding handle handwriting, printed forms, and dialect speech in a single API call.
- **Demo mode**: development without API keys is a first-class use case.
- **Typed exceptions**: `ExtractionError` wraps both API failures and schema validation errors so callers can handle them uniformly.

## Testing

```bash
pytest tests/ -v
```

All 12 tests pass and **do not call the real Gemini API**. They cover
demo mode, argument validation, JSON schema validation, and prompt content.

## Simulation

```bash
python run_simulation.py
```

Runs extraction on 10 sample files (jpg, png, txt, m4a) and prints the
structured output next to the ground-truth CSV for visual comparison.

## Limitations

- Files larger than ~20 MB should use the Gemini Files API (not yet implemented).
- South Tyrolean dialect coverage relies on the glossary in `prompts.py`; add new terms as they are observed.
- Demo mode returns a fixed mock order; it does not vary per input.
