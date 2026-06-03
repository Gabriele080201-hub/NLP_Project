from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ExtractedItem(BaseModel):
    raw_text: str = Field(description="Item phrase as recognized in the input.")
    quantity: Optional[float] = Field(default=None, description="Requested quantity if visible.")
    unit_hint: Optional[str] = Field(default=None, description="Unit or package hint from the input.")
    notes: Optional[str] = Field(default=None, description="Any item-specific comment.")


class ExtractedOrder(BaseModel):
    customer_hint: Optional[str] = Field(default=None, description="Customer name or hint if present.")
    delivery_note: Optional[str] = Field(default=None, description="Delivery note, e.g. deliver tomorrow.")
    raw_text: str = Field(description="Best recognized text or transcript.")
    items: List[ExtractedItem] = Field(default_factory=list)


class Product(BaseModel):
    code: str
    description: str
    unit: str
    package_size: str
    aliases: List[str] = Field(default_factory=list)


class ProductCandidate(BaseModel):
    code: str
    description: str
    unit: str
    package_size: str
    score: int
    stage: str
    explanation: str


class MatchedItem(BaseModel):
    raw_text: str
    requested_quantity: Optional[float]
    requested_unit_hint: Optional[str]
    selected: ProductCandidate
    confidence_label: str = Field(default="HUMAN_VALIDATION_REQUIRED", description="Confidence level: HIGH_CONFIDENCE, REVIEW_RECOMMENDED, or HUMAN_VALIDATION_REQUIRED")
    validation_required: bool = Field(default=True, description="Whether human validation/review is required")
    alternatives: List[ProductCandidate] = Field(default_factory=list)


class MatchedOrder(BaseModel):
    customer_code: str
    delivery_note: Optional[str]
    items: List[MatchedItem]


class ExtractResponse(BaseModel):
    live_gemini: bool
    model: str
    customer_code: str
    extracted: ExtractedOrder
    matched: MatchedOrder


class ReviewedItem(BaseModel):
    action: str = Field(description="Validation action: 'confirmed', 'edited', or 'rejected'")
    corrected_item_code: Optional[str] = Field(default=None, description="The corrected item code if edited.")
    original_raw_text: str = Field(description="Original raw text of the item.")
    predicted_item_code: str = Field(description="The item code predicted by the matching engine.")
    confidence_label: str = Field(description="Confidence label assigned by matching engine.")
    validation_required: bool = Field(description="Whether validation was required.")


class FeedbackPayload(BaseModel):
    customer_code: str
    items: List[ReviewedItem] = Field(default_factory=list)
    reviewer_note: Optional[str] = None

