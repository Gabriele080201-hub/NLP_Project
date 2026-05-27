"""Foppa order extraction module.

Public API
----------
GeminiOrderExtractor
    Main class. Use ``extract(text=..., file_bytes=..., mime_type=...)``.
ExtractedOrder, ExtractedItem
    Pydantic schemas describing the structured output (contract with
    the downstream matching module).
parse_order_json, demo_extraction
    Stand-alone helpers exposed for testing and offline development.
ExtractionError
    Raised on API failure or schema validation failure.

Example
-------
>>> from extraction import GeminiOrderExtractor
>>> extractor = GeminiOrderExtractor()
>>> order = extractor.extract(text="20 kg zucchero, 2 cartoni kombucha")
>>> for item in order.items:
...     print(item.raw_text, item.quantity, item.unit_hint)
"""

from .gemini_pipeline import (
    ExtractionError,
    GeminiOrderExtractor,
    demo_extraction,
    parse_order_json,
)
from .schemas import ExtractedItem, ExtractedOrder

__all__ = [
    "GeminiOrderExtractor",
    "ExtractedOrder",
    "ExtractedItem",
    "ExtractionError",
    "demo_extraction",
    "parse_order_json",
]

__version__ = "0.2.0"
