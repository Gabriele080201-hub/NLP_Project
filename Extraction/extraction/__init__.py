"""Foppa order extraction module.

Public API
----------
GeminiOrderExtractor
    Main class. Call ``extract(path)`` with any supported file, or
    ``extract(text=...)`` for raw strings.
ExtractedOrder, ExtractedItem
    Pydantic schemas describing the structured output (contract with
    the downstream matching module).
parse_order_json, demo_extraction
    Stand-alone helpers exposed for testing and offline development.
ExtractionError
    Raised on API failure or schema validation failure.
UnsupportedFileTypeError
    Raised when the file extension is not supported.

Example
-------
>>> from extraction import GeminiOrderExtractor
>>> extractor = GeminiOrderExtractor()
>>> order = extractor.extract("Data/1. Orders/V0557_0001.jpg")
>>> for item in order.items:
...     print(item.raw_text, item.quantity, item.unit_hint)
"""

from .gemini_pipeline import (
    ExtractionError,
    GeminiOrderExtractor,
    UnsupportedFileTypeError,
    demo_extraction,
    parse_order_json,
)
from .schemas import ExtractedItem, ExtractedOrder

__all__ = [
    "GeminiOrderExtractor",
    "ExtractedOrder",
    "ExtractedItem",
    "ExtractionError",
    "UnsupportedFileTypeError",
    "demo_extraction",
    "parse_order_json",
]

__version__ = "0.3.0"
