# Extraction Module — Foppa Order Capture

This module is the **input stage** of the AI-powered order capture
pipeline for Foppa GmbH. It transforms heterogeneous customer messages
(handwritten photos, typed text, voice notes) into a validated
`ExtractedOrder` JSON object that the downstream matching module can
consume.

It does **not** do product matching, scoring, or ERP code assignment —
that is the next stage.

## What it handles

| Input type      | Extensions                | How                          |
|-----------------|---------------------------|------------------------------|
| Image           | `.jpg`, `.jpeg`, `.png`, `.webp` | Gemini multimodal vision     |
| Text            | `.txt`                    | Cleaned + sent to Gemini     |
| Audio           | `.m4a`, `.mp3`, `.wav`, `.ogg`   | Gemini native audio input    |

All paths produce the same `ExtractedOrder` schema.

## Quick start

```bash
pip install -r requirements.txt
export GEMINI_API_KEY="your-key-here"
```

```python
from extraction import OrderExtractor

extractor = OrderExtractor()                 # reads GEMINI_API_KEY
order = extractor.extract_file(
    "order_photo.jpg",
    customer_code="B0491",
)

for item in order.items:
    print(item.raw_text, item.quantity, item.unit_hint)

print("Delivery:", order.delivery_note)
```

If `GEMINI_API_KEY` is not set, the extractor falls back to **demo
mode** and returns a fixed mock order. This lets other parts of the
pipeline be developed without spending API credits.

## Architecture

```
extraction/
├── __init__.py            # Public API
├── extractor.py           # OrderExtractor - main orchestrator
├── exceptions.py          # Typed errors
├── schemas.py             # Pydantic models (ExtractedOrder, ExtractedItem)
├── validation.py          # Retry helper
├── strategies/
│   ├── base.py            # Abstract strategy
│   ├── image.py           # JPG / PNG / WEBP
│   ├── text.py            # Plain text + noise cleaning
│   └── audio.py           # M4A / MP3 / WAV / OGG
└── prompts/
    ├── system_prompt.py   # Domain-specific system prompt
    └── examples.py        # Few-shot examples
```

The orchestrator detects the MIME type, picks the matching strategy,
and runs it with a small retry budget. Each strategy passes the file
to Gemini together with the system prompt, few-shot examples, and the
Pydantic schema for structured output.

## Design choices

- **Strategy pattern**: adding a new file type means a new file in
  `strategies/`, no changes elsewhere.
- **Prompts in their own files**: the prompt is the part you will tune
  most often. Keeping it separate from Python logic makes iteration
  fast and safe.
- **No external OCR**: Gemini's native vision outperforms staged
  OCR-then-LLM pipelines on handwriting and dialect documents (see the
  Fraunhofer IAIS benchmark).
- **Demo mode**: development without API keys is a first-class use case.
- **Typed exceptions**: callers can map errors to the right HTTP code.

## Testing

```bash
pytest tests/ -v
```

The tests cover demo mode, MIME detection, prompt construction, text
cleaning, schema validation, and the retry helper. They do **not**
call the real Gemini API.

## Limitations

- Files larger than ~20 MB should use the Gemini Files API (not yet
  implemented here).
- South Tyrolean dialect coverage relies on the glossary in
  `system_prompt.py`; add new terms as they are observed.
- Demo mode returns a fixed mock; it does not vary per input.
