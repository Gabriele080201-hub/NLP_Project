# Extraction Module — Foppa Order Capture

This module is the **input stage** of the AI-powered order capture
pipeline for Foppa GmbH. It transforms heterogeneous customer messages
(handwritten photos, typed text, voice notes) into a validated
`ExtractedOrder` JSON object that the downstream matching module can
consume.

It does **not** do product matching, scoring, or ERP code assignment —
that is the next stage.

## What it handles

| File type | Extensions |
|-----------|------------|
| Image | `.jpg`, `.jpeg`, `.png`, `.webp` |
| Plain text | `.txt` |
| Audio | `.m4a`, `.mp3`, `.wav`, `.ogg` |

The MIME type is detected automatically from the file extension —
no configuration needed.

## Quick start

```bash
pip install -r requirements.txt
```

Set your Gemini API key in a `.env` file at the project root:

```
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash   # optional, this is the default
```

On **Windows PowerShell** you can also set it for the current session:
```powershell
$env:GEMINI_API_KEY = "your-key-here"
```

## Usage

```python
from extraction import GeminiOrderExtractor

extractor = GeminiOrderExtractor()  # reads GEMINI_API_KEY from .env or env

# From an image
order = extractor.extract("Data/1. Orders/V0557_0001.jpg")

# From an audio voice note
order = extractor.extract("Data/1. Orders/B0578_0001.m4a")

# From a text file
order = extractor.extract("Data/1. Orders/B0244_0001.txt")

# From a raw text string (no file needed)
order = extractor.extract(text="20 kg zucchero, 2 cartoni kombucha")

# Inspect results
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
├── gemini_pipeline.py  # GeminiOrderExtractor — main class + MIME detection
├── prompts.py          # System prompt, domain glossary, few-shot examples
└── schemas.py          # Pydantic models (ExtractedOrder, ExtractedItem)

tests/
└── test_extraction.py  # Unit tests (no real API calls) — 24 tests, all pass

Data/
├── 1. Orders/          # Sample orders: .jpg, .png, .txt, .m4a + ground-truth .csv
└── 2. Masterdata/      # Product catalogue (CompleteItemArchive.xlsx, Schablone.xlsx)

run_simulation.py       # Quick demo: runs extraction on 10 samples vs. ground-truth CSV
test.ipynb              # Interactive notebook for manual testing
```

## Public API

### `GeminiOrderExtractor(api_key=None, model=None)`

| Parameter | Default | Description |
|-----------|---------|-------------|
| `api_key` | `None` | Gemini API key. Falls back to `GEMINI_API_KEY` env var. |
| `model` | `None` | Model name. Falls back to `GEMINI_MODEL` env var, then `gemini-2.5-flash`. |

**Attribute `live_enabled`** (`bool`): `True` when a real Gemini client is active, `False` in demo mode.

### `extractor.extract(path=None, *, text=None)`

| Argument | Type | Description |
|----------|------|-------------|
| `path` | `str` or `Path` | Path to a supported file. Extension is detected automatically. |
| `text` | `str` (keyword) | Raw text string. Use when you already have the text in memory. |

Pass **one or the other** — not both, not neither.

Raises `FileNotFoundError` if the file is missing, `UnsupportedFileTypeError` if the extension is not supported, and `ExtractionError` on API or schema failures.

### Output schema

```python
class ExtractedOrder:
    customer_hint:  str | None       # customer name/code if visible
    delivery_note:  str | None       # delivery date or special instruction
    raw_text:       str              # full recognized text or transcript
    items:          list[ExtractedItem]

class ExtractedItem:
    raw_text:   str             # item phrase exactly as written
    quantity:   float | None   # numeric amount, or null if not readable
    unit_hint:  str | None     # canonical unit: "kg", "carton", "sack", "bottle", …
    notes:      str | None     # item-specific comment
```

## Design choices

- **Path-first API**: one argument is enough. The MIME type, reading mode (bytes vs. text), and Gemini payload format are all resolved internally.
- **Prompts in their own file**: [`prompts.py`](extraction/prompts.py) contains the full system prompt, dialect glossary, unit vocabulary, and few-shot examples. Edit this file to tune extraction behaviour without touching orchestration logic.
- **No external OCR or STT**: Gemini's native multimodal vision and audio understanding handle handwriting, printed forms, and dialect speech in a single API call.
- **Demo mode**: development without API keys is a first-class use case.
- **Typed exceptions**: `ExtractionError` and `UnsupportedFileTypeError` let callers handle failures precisely.

## Testing

```bash
pytest tests/ -v
```

24 tests, all pass. No real Gemini API calls are made.

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
