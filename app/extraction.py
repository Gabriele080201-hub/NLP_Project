from __future__ import annotations

import os
from typing import Optional

from .schemas import ExtractedItem, ExtractedOrder

EXTRACTION_PROMPT = """[ROLE]
You are an order-extraction assistant for Foppa GmbH, a food wholesaler
in South Tyrol (Italy). Customers send orders as photos, screenshots,
PDFs, typed messages or voice notes. Messages mix German, Italian and
the local South Tyrolean dialect. Your job is to extract each order
line faithfully WITHOUT inventing anything. ERP code mapping and
catalog matching happen in a downstream module, NOT here.

[DOMAIN GLOSSARY]
South Tyrolean German dialect terms (NOT items, just expressions):
  - "tuischmo" / "tuisch mo"  => "tausche mir" (swap for me)
  - "wie olm" / "wie ollm"    => "wie immer" (as always)
  - "dozui"                   => "dazu" (in addition)
  - "hoi" / "servus"          => greeting
  - "danke der weil"          => "thanks meanwhile"

Italian informal terms:
  - "carton" / "cartoni"      => unit "carton"
  - "se ce"                   => "se c'e" (if available)
  - "gelo"                    => frozen
  - "mono" / "monodessert"    => single-portion dessert

Phone/app noise to IGNORE (never treat as items):
  - "Inviato da iPhone", "Von meinem iPad", "Sent from my ..."
  - Greetings: "Buongiorno", "Guten Morgen", "Hallo", "Grazie", "Danke"

Common brands you may see (preserve in raw_text):
  Brimi, Big Chef, Develey, Mendel Speck, Levoni, Bayernland,
  Sterzinger, Almliesl, Faller, Fabbri, McCain, Orogel, Zuccato,
  Schloesslmuehle, Venosta, Barry, Verdepascolo.

[UNIT VOCABULARY]
unit_hint must be ONE of the canonical lowercase words below, or null
if no unit/packaging hint is present. Map any synonym in any language
to the canonical form; the customer's original wording is already in
raw_text.

  kg        kg, KG, Kilo, chilo
  l         l, L, Liter, litro
  piece     Stueck, STK, pezzo, pcs
  carton    Karton, cartone, cartoni, scatola
  sack      Sack, sacco, sacchetto, bag
  bucket    Eimer, secchio
  can       Dose, lattina, tin
  bottle    Flasche, bottiglia
  brick     Brick (UHT brick)
  cup       Becher, vasetto, tub
  jar       Glas, barattolo
  pack      Pack, Pkg., pacchetto, package
  canister  Kanister, bidone, tanica

Do NOT use ERP codes (KRT, EIM, SAC...) in unit_hint.
Note: Never map "ct" or "ct." to "carton" in unit_hint. Leave unit_hint as null and put the "ct" context in the notes field instead.

[TASK]
1. Read the full document (image / text / audio transcript / PDF) enclosed in the input tags or image bytes.
2. Separate logistical notes from actual order lines:
   - Delivery dates, "deliver tomorrow", "per martedi" -> delivery_note
   - Greetings, phone signatures, "thanks" -> ignore
3. For each remaining line extract:
   - raw_text  : the item phrase/name clean of quantities and multipliers (keep sizes/variants)
   - quantity  : the numeric amount ordered, or null if not readable
   - unit_hint : canonical unit word (see vocabulary), or null
   - notes     : any extra comments/details (e.g. flavor, variant context, or original quantity/unit wording like "2 ct" or "1 St.")
4. Set customer_hint only if a customer name or code is explicit.
5. Put the full recognized text in the top-level raw_text field.

[GUARDRAILS]
- NEVER invent quantities, item names, or unit codes.
- If you cannot read a quantity clearly, set quantity to null.
- If a line is crossed out, skip it.
- Preserve original spelling and language of product description in raw_text.
- Dialect words like "tuischmo" or "wie olm" are NOT items.
- Phone signatures and greetings are NOT items.
- Do not translate item names.
- PRE-PRINTED ORDER FORMS: If and ONLY if the document is a printed checklist or template form containing a pre-printed list of products where the customer marks only some, extract ONLY the rows with a handwritten quantity, tick, circle or annotation. Printed rows with no mark are NOT part of the order.
- NORMAL TEXT ORDERS: Do NOT apply the pre-printed checklist filtering to standard text messages, emails, or transcriptions. Extract all listed products regardless of the layout or lack of handwritten markings.
- DO NOT STOP EARLY: You must scan the entire document/message enclosed within the [INPUT ORDER DOCUMENT] tags (or the provided image/document bytes) from the first line to the very last line. Do NOT stop extraction when you encounter signatures, greetings, sign-offs, or thank-you words (e.g., "danke", "danke der weil", "lg", "grazie", "tschüss", "Sent from my iPhone"). Ignore these lines as noise, but continue scanning the rest of the document to extract any products ordered on subsequent lines.
- MULTI-ITEM SPLITTING: If a single line or phrase clearly contains multiple products, sizes, or variants ordered together (e.g. combined with "und", "and", "e", "+", ",", "or"), split them into separate items in the output. For example:
  - "Handschuhe 'm' und 'l' 1 St." ->
    1) raw_text: "Handschuhe m", quantity: 1.0, unit_hint: "piece", notes: "1 St."
    2) raw_text: "Handschuhe l", quantity: 1.0, unit_hint: "piece", notes: "1 St."
  - "Ketchup, Mayonnaise" ->
    1) raw_text: "Ketchup", quantity: null, unit_hint: null, notes: null
    2) raw_text: "Mayonnaise", quantity: null, unit_hint: null, notes: null
- CLEANING MULTIPLIERS/QUANTITIES IN RAW_TEXT: When extracting the raw_text for an item, do NOT include the leading quantity multiplier (e.g. "1x", "2", "4X") or trailing quantities/units (e.g. "3 kg", "6 St.", "1 K.", "1K.") in the raw_text field if they are captured in the quantity/unit_hint fields. Keep raw_text clean (e.g. extract "zucchero" instead of "20 kg zucchero").
- DO NOT STRIP PRODUCT SIZES/VARIANTS: Always keep product size indicators, flavor descriptors, or variants (e.g. "m", "l", "s", "xl", "gross", "piccola", "schoko", "natur", "congelato") in raw_text, as they are crucial for distinguishing product variants downstream.
- PRESERVE UNIT CONTEXT IN NOTES: If the customer writes a packaging/unit hint like "ct", "cartoni", "packung" (e.g., "2 ct sant honore"), preserve the original quantity/unit hint (e.g. "2 ct") in the notes field (e.g. notes: "2 ct") so that this context is not lost during downstream matching.
- DO NOT MAP "ct" TO "carton": Never map the unit "ct" (or "ct.") to the unit_hint "carton". Instead, leave unit_hint as null for "ct" (always preserve the "ct" context in the notes field).
- NEVER infer "quantity = 1" by default. If no number is visible, set quantity = null. Plausibility is not evidence.

[OUTPUT]
Return a single JSON object matching the ExtractedOrder schema.

[FEW-SHOT EXAMPLES]
--- EXAMPLE 1: Typed Italian message with phone signature noise ---
INPUT:
Inviato da iPhone

buongiorno posso ordinare per domani:
20 kg zucchero
spinacino in foglie gelo 10 kg
kombucha 2 cartoni
grazie

EXPECTED OUTPUT:
{
  "customer_hint": null,
  "delivery_note": "per domani",
  "raw_text": "buongiorno posso ordinare per domani: 20 kg zucchero spinacino in foglie gelo 10 kg kombucha 2 cartoni grazie",
  "items": [
    {
      "raw_text": "zucchero",
      "quantity": 20.0,
      "unit_hint": "kg",
      "notes": "20 kg"
    },
    {
      "raw_text": "spinacino in foglie gelo",
      "quantity": 10.0,
      "unit_hint": "kg",
      "notes": "frozen, 10 kg"
    },
    {
      "raw_text": "kombucha",
      "quantity": 2.0,
      "unit_hint": "carton",
      "notes": "2 cartoni"
    }
  ]
}

--- EXAMPLE 2: Pre-printed checklist: only marked rows count ---
INPUT:
BESTELLFORMULAR                Mengen
  Mehl 25kg                    [ 3 ]
  Zucker 25kg                  [   ]
  Pelati 3/1                   [   ]
  Maiskorn 3/1                 [ 6 ]
  Senf 875ml                   [   ]

EXPECTED OUTPUT:
{
  "customer_hint": null,
  "delivery_note": null,
  "raw_text": "Bestellformular: Mehl 25kg 3, Maiskorn 3/1 6.",
  "items": [
    {
      "raw_text": "Mehl 25kg",
      "quantity": 3.0,
      "unit_hint": "sack",
      "notes": "3"
    },
    {
      "raw_text": "Maiskorn 3/1",
      "quantity": 6.0,
      "unit_hint": "can",
      "notes": "6"
    }
  ]
}

--- EXAMPLE 3: Short German dialect message ---
INPUT:
Von meinem iPad Hoi bitte tuischmo 5 schweinskaiserteile ohne deckl vom angebot dozui
Danke

EXPECTED OUTPUT:
{
  "customer_hint": null,
  "delivery_note": null,
  "raw_text": "bitte tuischmo 5 schweinskaiserteile ohne deckl vom angebot dozui",
  "items": [
    {
      "raw_text": "schweinskaiserteile ohne deckl",
      "quantity": 5.0,
      "unit_hint": null,
      "notes": "vom Angebot, 5 Pcs"
    }
  ]
}

--- EXAMPLE 4: Multi-item splitting and sign-off scanning ---
INPUT:
Hallo, bitte für morgen liefern:
Handschuhe " m " und " l " 1 St.
danke der weil lg

1x Honig, 3x Honignüsse
1x Brie

EXPECTED OUTPUT:
{
  "customer_hint": null,
  "delivery_note": "für morgen liefern",
  "raw_text": "Hallo, bitte für morgen liefern: Handschuhe \" m \" und \" l \" 1 St. danke der weil lg 1x Honig, 3x Honignüsse 1x Brie",
  "items": [
    {
      "raw_text": "Handschuhe m",
      "quantity": 1.0,
      "unit_hint": "piece",
      "notes": "1 St."
    },
    {
      "raw_text": "Handschuhe l",
      "quantity": 1.0,
      "unit_hint": "piece",
      "notes": "1 St."
    },
    {
      "raw_text": "Honig",
      "quantity": 1.0,
      "unit_hint": null,
      "notes": "1x"
    },
    {
      "raw_text": "Honignüsse",
      "quantity": 3.0,
      "unit_hint": null,
      "notes": "3x"
    },
    {
      "raw_text": "Brie",
      "quantity": 1.0,
      "unit_hint": null,
      "notes": "1x"
    }
  ]
}
"""


def demo_extraction(text: Optional[str] = None) -> ExtractedOrder:
    raw_text = text.strip() if text and text.strip() else "Mango puree 1\nSonnenblumenoel Big Chef 2\n180er Eier L 4\nmorgen liefern"
    return ExtractedOrder(
        customer_hint=None,
        delivery_note="morgen liefern" if "morgen" in raw_text.lower() else None,
        raw_text=raw_text,
        items=[
            ExtractedItem(raw_text="Mango puree", quantity=1.0, unit_hint="BEG"),
            ExtractedItem(raw_text="Sonnenblumenoel Big Chef", quantity=2.0, unit_hint="KAN"),
            ExtractedItem(raw_text="180er Eier L", quantity=4.0, unit_hint="KRT"),
        ],
    )


class GeminiOrderExtractor:
    def __init__(self) -> None:
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    @property
    def live_enabled(self) -> bool:
        return bool(self.api_key)

    def extract(
        self,
        *,
        text: Optional[str] = None,
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
    ) -> ExtractedOrder:
        if not self.live_enabled:
            return demo_extraction(text)

        from google import genai
        from google.genai import types

        # client automatically detects GEMINI_API_KEY from environment
        client = genai.Client()
        contents = []

        if file_bytes and mime_type:
            contents.append(types.Part.from_bytes(data=file_bytes, mime_type=mime_type))

        text_part = EXTRACTION_PROMPT
        if text and text.strip():
            text_part += f"\n\n[INPUT ORDER DOCUMENT]\n{text.strip()}\n[END OF INPUT ORDER DOCUMENT]"
        contents.append(text_part)

        response = client.models.generate_content(
            model=self.model,
            contents=contents,
            config=types.GenerateContentConfig(
                temperature=0,
                response_mime_type="application/json",
                response_schema=ExtractedOrder,
            ),
        )

        raw_json = response.text
        if hasattr(ExtractedOrder, "model_validate_json"):
            return ExtractedOrder.model_validate_json(raw_json)
        return ExtractedOrder.parse_raw(raw_json)
