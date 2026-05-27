"""Tests for the Foppa extraction module.

Coverage:
- Demo mode (no API key) returns a valid ExtractedOrder from a path.
- Demo mode also works with text=.
- extract() rejects invalid argument combinations.
- UnsupportedFileTypeError is raised for unknown extensions.
- FileNotFoundError is raised for missing files.
- _detect_mime() maps extensions correctly.
- parse_order_json accepts valid JSON and rejects malformed JSON.
- The prompt content includes the key domain markers (role, dialect,
  unit vocabulary).
- Few-shot examples are formatted as a non-empty block.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from extraction import (
    ExtractedOrder,
    ExtractionError,
    GeminiOrderExtractor,
    UnsupportedFileTypeError,
    demo_extraction,
    parse_order_json,
)
from extraction.gemini_pipeline import _detect_mime
from extraction.prompts import EXTRACTION_PROMPT, format_examples_block


def _isolate_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Pretend no API key is configured (env and .env both empty)."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setattr(
        "extraction.gemini_pipeline.load_dotenv", lambda *a, **kw: False
    )


# ---------- Demo mode ----------


def test_demo_mode_from_path(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Without an API key, extract(path) returns a mocked order."""
    _isolate_env(monkeypatch)
    extractor = GeminiOrderExtractor()
    assert extractor.live_enabled is False

    fake = tmp_path / "fake.jpg"
    fake.write_bytes(b"fake")
    order = extractor.extract(fake)
    assert isinstance(order, ExtractedOrder)
    assert order.raw_text
    assert len(order.items) > 0


def test_demo_mode_from_text(monkeypatch: pytest.MonkeyPatch) -> None:
    """Without an API key, extract(text=...) returns a mocked order."""
    _isolate_env(monkeypatch)
    extractor = GeminiOrderExtractor()
    order = extractor.extract(text="20 kg zucchero")
    assert isinstance(order, ExtractedOrder)


def test_demo_extraction_standalone() -> None:
    """`demo_extraction` is importable and returns a valid order."""
    order = demo_extraction()
    assert isinstance(order, ExtractedOrder)
    assert order.items


# ---------- extract() argument validation ----------


def test_extract_requires_some_input(monkeypatch: pytest.MonkeyPatch) -> None:
    """`extract()` raises when neither path nor text is given."""
    _isolate_env(monkeypatch)
    extractor = GeminiOrderExtractor()
    with pytest.raises(ValueError):
        extractor.extract()


def test_extract_rejects_both_inputs(monkeypatch: pytest.MonkeyPatch) -> None:
    """`extract()` raises when both path and text are given."""
    _isolate_env(monkeypatch)
    extractor = GeminiOrderExtractor()
    with pytest.raises(ValueError):
        extractor.extract("some.jpg", text="also text")


# ---------- MIME detection ----------


@pytest.mark.parametrize(
    "filename,expected",
    [
        ("order.jpg",  "image/jpeg"),
        ("order.JPG",  "image/jpeg"),
        ("order.jpeg", "image/jpeg"),
        ("order.png",  "image/png"),
        ("order.webp", "image/webp"),
        ("order.txt",  "text/plain"),
        ("order.m4a",  "audio/mp4"),
        ("order.mp3",  "audio/mpeg"),
        ("order.wav",  "audio/wav"),
        ("order.ogg",  "audio/ogg"),
    ],
)
def test_mime_detection(filename: str, expected: str) -> None:
    """Common Foppa file extensions are correctly detected."""
    assert _detect_mime(Path(filename)) == expected


def test_unsupported_extension_raises() -> None:
    """An unknown extension raises UnsupportedFileTypeError."""
    with pytest.raises(UnsupportedFileTypeError):
        _detect_mime(Path("archive.zip"))


def test_missing_file_raises(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """A missing file raises FileNotFoundError (in live mode routing)."""
    _isolate_env(monkeypatch)
    extractor = GeminiOrderExtractor()
    # Force live mode so the file-existence check is reached.
    extractor.live_enabled = True
    extractor.client = object()
    with pytest.raises(FileNotFoundError):
        extractor.extract(tmp_path / "missing.jpg")


# ---------- JSON validation ----------


def test_parse_order_json_accepts_valid() -> None:
    """A schema-conforming JSON is parsed into an ExtractedOrder."""
    payload = json.dumps(
        {
            "customer_hint": None,
            "delivery_note": "per domani",
            "raw_text": "20 kg zucchero",
            "items": [
                {
                    "raw_text": "zucchero",
                    "quantity": 20,
                    "unit_hint": "kg",
                    "notes": None,
                }
            ],
        }
    )
    order = parse_order_json(payload)
    assert order.items[0].quantity == 20


def test_parse_order_json_rejects_malformed() -> None:
    """Malformed JSON raises ExtractionError."""
    with pytest.raises(ExtractionError):
        parse_order_json("not a json")


def test_parse_order_json_rejects_missing_field() -> None:
    """JSON missing the required `raw_text` fails schema validation."""
    with pytest.raises(ExtractionError):
        parse_order_json(json.dumps({"items": []}))


# ---------- Prompt content ----------


def test_prompt_declares_role() -> None:
    """EXTRACTION_PROMPT identifies the assistant role and domain."""
    assert "Foppa" in EXTRACTION_PROMPT
    assert "South Tyrol" in EXTRACTION_PROMPT


def test_prompt_includes_dialect_hints() -> None:
    """Local dialect terms appear so Gemini does not treat them as items."""
    assert "tuischmo" in EXTRACTION_PROMPT
    assert "wie olm" in EXTRACTION_PROMPT


def test_prompt_includes_unit_vocabulary() -> None:
    """The canonical unit vocabulary is listed."""
    for unit in ("kg", "carton", "sack", "bucket", "bottle"):
        assert unit in EXTRACTION_PROMPT


def test_examples_block_is_formatted() -> None:
    """Few-shot examples produce a non-empty markdown block."""
    block = format_examples_block()
    assert "EXAMPLE" in block
    assert "INPUT" in block
    assert "EXPECTED OUTPUT" in block
