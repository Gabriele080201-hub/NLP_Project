"""Pydantic schemas for extracted orders.

These models define the contract between the extraction module and the
rest of the pipeline (matching, frontend). They are passed to Gemini as
`response_schema` so the model returns validated JSON directly.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ExtractedItem(BaseModel):
    """A single order line as recognized from the source document.

    Attributes
    ----------
    raw_text : str
        The item phrase exactly as it appears in the source.
    quantity : float, optional
        Requested quantity. None if not readable or unclear.
    unit_hint : str, optional
        Unit or packaging hint (e.g. "kg", "Sack", "KAN").
    notes : str, optional
        Any item-specific comment ("wie immer", "frisch", etc.).
    """

    raw_text: str = Field(description="Item phrase as recognized in the input.")
    quantity: Optional[float] = Field(
        default=None, description="Requested quantity if visible."
    )
    unit_hint: Optional[str] = Field(
        default=None, description="Unit or package hint from the input."
    )
    notes: Optional[str] = Field(
        default=None, description="Any item-specific comment."
    )


class ExtractedOrder(BaseModel):
    """Full order as extracted from a source file.

    This is the output of the extraction module and the input of the
    matching module.

    Attributes
    ----------
    customer_hint : str, optional
        Customer name or code if visible in the document.
    delivery_note : str, optional
        Logistical note such as delivery date or special handling.
    raw_text : str
        Best recognized full text (OCR or transcript).
    items : list of ExtractedItem
        List of recognized order lines.
    """

    customer_hint: Optional[str] = Field(
        default=None, description="Customer name or hint if present."
    )
    delivery_note: Optional[str] = Field(
        default=None, description="Delivery note, e.g. 'deliver tomorrow'."
    )
    raw_text: str = Field(description="Best recognized text or transcript.")
    items: List[ExtractedItem] = Field(default_factory=list)
