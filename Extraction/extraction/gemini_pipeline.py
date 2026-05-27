"""Gemini-powered extraction pipeline for Foppa orders.

Public API
----------
GeminiOrderExtractor
    Main class. Call ``extract(text=..., file_bytes=..., mime_type=...)``.
parse_order_json
    Validate Gemini's raw JSON response against the ExtractedOrder schema.
demo_extraction
    Return a fixed mock order so downstream modules can be developed
    without a real API key.
ExtractionError
    Raised on API failure or schema validation failure.
"""

from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv

from .prompts import EXTRACTION_PROMPT, format_examples_block
from .schemas import ExtractedItem, ExtractedOrder

DEFAULT_MODEL = "gemini-2.5-flash"


class ExtractionError(Exception):
    """Raised when Gemini fails or returns output that does not match
    the ExtractedOrder schema."""


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


def demo_extraction(text: str | None = None) -> ExtractedOrder:
    """Return a realistic fixed order for offline development.

    Parameters
    ----------
    text : str, optional
        Ignored. Present so callers can pass the same arguments they
        would pass to a live extractor.

    Returns
    -------
    ExtractedOrder
        A deterministic mocked order.
    """
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
    """Extract Foppa orders from text or file bytes using Gemini.

    The class loads ``.env`` on init so ``GEMINI_API_KEY`` and
    ``GEMINI_MODEL`` can be configured outside the code. If no API key
    is found anywhere, the extractor falls back to demo mode and
    returns mocked data — useful for offline development.

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
        *,
        text: str | None = None,
        file_bytes: bytes | None = None,
        mime_type: str | None = None,
    ) -> ExtractedOrder:
        """Extract an order from a text message or a file payload.

        Provide either ``text`` (typed messages) OR ``file_bytes`` plus
        ``mime_type`` (images, PDF, audio). Both branches return the
        same ExtractedOrder schema.

        Parameters
        ----------
        text : str, optional
            Plain text message.
        file_bytes : bytes, optional
            Raw bytes of an image, PDF, or audio file.
        mime_type : str, optional
            MIME type of ``file_bytes`` (e.g. ``image/jpeg``,
            ``application/pdf``, ``audio/mp4``). Required when
            ``file_bytes`` is provided.

        Returns
        -------
        ExtractedOrder
            The validated structured order. In demo mode a fixed mock
            order is returned.

        Raises
        ------
        ValueError
            If neither ``text`` nor ``(file_bytes, mime_type)`` is given.
        ExtractionError
            If the Gemini call fails or the response does not match
            the schema.
        """
        if text is None and file_bytes is None:
            raise ValueError(
                "Provide either `text` or `file_bytes` with `mime_type`."
            )
        if file_bytes is not None and mime_type is None:
            raise ValueError("`mime_type` is required when `file_bytes` is given.")

        if not self.live_enabled:
            return demo_extraction(text)

        from google.genai import types

        full_prompt = f"{EXTRACTION_PROMPT}\n\n{format_examples_block()}"

        if file_bytes is not None:
            contents: Any = [
                types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                full_prompt,
            ]
        else:
            contents = f"{full_prompt}\n\n[INPUT TEXT]\n{text}"

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
