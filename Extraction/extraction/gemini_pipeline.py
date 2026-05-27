"""Gemini-powered extraction pipeline for Foppa orders.

Public API
----------
GeminiOrderExtractor
    Main class. Call ``extract(path)`` with any supported file, or
    ``extract(text=...)`` for raw text strings.
parse_order_json
    Validate Gemini's raw JSON response against the ExtractedOrder schema.
demo_extraction
    Return a fixed mock order so downstream modules can be developed
    without a real API key.
ExtractionError
    Raised on API failure or schema validation failure.
UnsupportedFileTypeError
    Raised when the file extension is not supported.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from .prompts import EXTRACTION_PROMPT, format_examples_block
from .schemas import ExtractedItem, ExtractedOrder

DEFAULT_MODEL = "gemini-2.5-flash"

# Maps file extension -> MIME type sent to Gemini.
# Adding a new format means adding one line here.
_EXTENSION_TO_MIME: dict[str, str] = {
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png":  "image/png",
    ".webp": "image/webp",
    ".txt":  "text/plain",
    ".m4a":  "audio/mp4",
    ".mp3":  "audio/mpeg",
    ".wav":  "audio/wav",
    ".ogg":  "audio/ogg",
}


class ExtractionError(Exception):
    """Raised when Gemini fails or returns output that does not match
    the ExtractedOrder schema."""


class UnsupportedFileTypeError(ExtractionError):
    """Raised when the file extension is not in the supported list."""


def _detect_mime(path: Path) -> str:
    """Return the MIME type for *path* based on its extension.

    Raises
    ------
    UnsupportedFileTypeError
        If the extension is not supported.
    """
    ext = path.suffix.lower()
    mime = _EXTENSION_TO_MIME.get(ext)
    if mime is None:
        supported = ", ".join(_EXTENSION_TO_MIME)
        raise UnsupportedFileTypeError(
            f"Unsupported file type '{ext}'. Supported: {supported}"
        )
    return mime


def parse_order_json(text: str) -> ExtractedOrder:
    """Validate a JSON string against the ExtractedOrder schema.

    Parameters
    ----------
    text : str
        Raw JSON string returned by Gemini.

    Returns
    -------
    ExtractedOrder
        The validated order.

    Raises
    ------
    ExtractionError
        If the JSON is malformed or does not match the schema.
    """
    try:
        return ExtractedOrder.model_validate_json(text)
    except Exception as exc:
        raise ExtractionError(f"Schema validation failed: {exc}") from exc


def demo_extraction(*_args: Any, **_kwargs: Any) -> ExtractedOrder:
    """Return a realistic fixed order for offline development."""
    return ExtractedOrder(
        customer_hint=None,
        delivery_note="per domani",
        raw_text=(
            "buongiorno posso ordinare per domani: 20 kg zucchero, "
            "kombucha 2 cartoni, grazie"
        ),
        items=[
            ExtractedItem(raw_text="zucchero", quantity=20, unit_hint="kg"),
            ExtractedItem(raw_text="kombucha", quantity=2, unit_hint="carton"),
        ],
    )


class GeminiOrderExtractor:
    """Extract Foppa orders from a file path or a text string using Gemini.

    The class loads ``.env`` on init so ``GEMINI_API_KEY`` and
    ``GEMINI_MODEL`` can be configured outside the code. If no API key
    is found, the extractor falls back to demo mode and returns mocked
    data — useful for offline development.

    Parameters
    ----------
    api_key : str, optional
        Gemini API key. Falls back to env var ``GEMINI_API_KEY``.
    model : str, optional
        Gemini model name. Falls back to env var ``GEMINI_MODEL``,
        then to ``gemini-2.5-flash``.

    Attributes
    ----------
    live_enabled : bool
        True when a real Gemini client is configured, False in demo mode.
    model : str
        Active model name.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
    ) -> None:
        load_dotenv()
        self.model = model or os.getenv("GEMINI_MODEL", DEFAULT_MODEL)
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.client: Any | None = None
        self.live_enabled = False

        if api_key:
            try:
                from google import genai

                self.client = genai.Client(api_key=api_key)
                self.live_enabled = True
            except ImportError:
                # SDK not installed — stay in demo mode silently.
                pass

    def extract(
        self,
        path: str | Path | None = None,
        *,
        text: str | None = None,
    ) -> ExtractedOrder:
        """Extract a structured order from a file or a text string.

        Pass a file path **or** a raw text string — the method figures
        out the rest automatically.

        Parameters
        ----------
        path : str or Path, optional
            Path to an order file (.jpg, .png, .webp, .txt, .m4a,
            .mp3, .wav, .ogg). The MIME type is detected from the
            extension automatically.
        text : str, optional
            Raw text message (keyword-only). Use this when you already
            have the text in memory and don't need a file.

        Returns
        -------
        ExtractedOrder
            The validated structured order. In demo mode a fixed mock
            order is returned.

        Raises
        ------
        ValueError
            If neither ``path`` nor ``text`` is provided, or if both
            are provided at the same time.
        FileNotFoundError
            If *path* does not exist on disk.
        UnsupportedFileTypeError
            If the file extension is not supported.
        ExtractionError
            If the Gemini call fails or the response fails schema
            validation.

        Examples
        --------
        >>> extractor.extract("Data/1. Orders/V0557_0001.jpg")
        >>> extractor.extract("Data/1. Orders/B0244_0001.txt")
        >>> extractor.extract("Data/1. Orders/B0578_0001.m4a")
        >>> extractor.extract(text="20 kg zucchero, 2 cartoni kombucha")
        """
        if path is None and text is None:
            raise ValueError("Provide a file path or text=... (not both, not neither).")
        if path is not None and text is not None:
            raise ValueError("Provide either a file path or text=..., not both.")

        if not self.live_enabled:
            return demo_extraction()

        from google.genai import types

        full_prompt = f"{EXTRACTION_PROMPT}\n\n{format_examples_block()}"

        # --- Build the contents list for Gemini ---
        if text is not None:
            contents: Any = f"{full_prompt}\n\n[INPUT TEXT]\n{text}"
        else:
            file_path = Path(path)
            if not file_path.is_file():
                raise FileNotFoundError(f"File not found: {file_path}")

            mime = _detect_mime(file_path)

            if mime == "text/plain":
                # Read as text so Gemini sees plain characters, not raw bytes.
                raw_text = file_path.read_text(encoding="utf-8", errors="replace")
                contents = f"{full_prompt}\n\n[INPUT TEXT]\n{raw_text}"
            else:
                contents = [
                    types.Part.from_bytes(
                        data=file_path.read_bytes(), mime_type=mime
                    ),
                    full_prompt,
                ]

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0,
                    response_mime_type="application/json",
                    response_schema=ExtractedOrder,
                ),
            )
        except Exception as exc:
            raise ExtractionError(f"Gemini call failed: {exc}") from exc

        return parse_order_json(response.text)
