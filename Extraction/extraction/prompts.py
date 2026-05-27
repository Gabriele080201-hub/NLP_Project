"""Prompt content for the Foppa extraction pipeline.

Kept separate from the orchestration code so the domain text (dialect
glossary, brands, few-shot examples) can be tuned without touching
Python logic.
"""

from __future__ import annotations

import json
from typing import Any

EXTRACTION_PROMPT = """
[ROLE]
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
  - "ct" / "carton" / "cartoni" => unit "carton"
  - "se ce"                     => "se c'e" (if available)
  - "gelo"                      => frozen
  - "mono" / "monodessert"      => single-portion dessert

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
  carton    Karton, cartone, cartoni, ct, scatola
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

[TASK]
1. Read the full document (image / text / audio transcript / PDF).
2. Separate logistical notes from actual order lines:
   - Delivery dates, "deliver tomorrow", "per martedi" -> delivery_note
   - Greetings, phone signatures, "thanks" -> ignore
3. For each remaining line extract:
   - raw_text  : the item phrase exactly as written
   - quantity  : the numeric amount, or null if not readable
   - unit_hint : canonical unit word (see vocabulary), or null
   - notes     : any extra comment about THAT specific item
4. Set customer_hint only if a customer name or code is explicit.
5. Put the full recognized text in the top-level raw_text field.

[GUARDRAILS]
- NEVER invent quantities, item names, or unit codes.
- If you cannot read a quantity clearly, set quantity to null.
- If a line is crossed out, skip it.
- Preserve original spelling and language in raw_text.
- Dialect words like "tuischmo" or "wie olm" are NOT items.
- Phone signatures and greetings are NOT items.
- Do not translate item names.
- PRE-PRINTED ORDER FORMS: if the document is a printed checklist of
  products and the customer marks only some, extract ONLY the rows
  with a handwritten quantity, tick, circle or annotation. Printed
  rows with no mark are NOT part of the order.
- NEVER infer "quantity = 1" by default. If no number is visible,
  set quantity = null. Plausibility is not evidence.

[OUTPUT]
Return a single JSON object matching the ExtractedOrder schema.
""".strip()


FEW_SHOT_EXAMPLES: list[dict[str, Any]] = [
    {
        "description": "Typed Italian message with phone signature noise",
        "input_text": (
            "Inviato da iPhone\n\n"
            "buongiorno posso ordinare per domani:\n"
            "20 kg zucchero\n"
            "spinacino in foglie gelo 10 kg\n"
            "kombucha 2 cartoni\n"
            "grazie"
        ),
        "expected_output": {
            "customer_hint": None,
            "delivery_note": "per domani",
            "raw_text": (
                "buongiorno posso ordinare per domani: 20 kg zucchero "
                "spinacino in foglie gelo 10 kg kombucha 2 cartoni grazie"
            ),
            "items": [
                {"raw_text": "zucchero", "quantity": 20, "unit_hint": "kg", "notes": None},
                {"raw_text": "spinacino in foglie gelo", "quantity": 10, "unit_hint": "kg", "notes": "frozen"},
                {"raw_text": "kombucha", "quantity": 2, "unit_hint": "carton", "notes": None},
            ],
        },
    },
    {
        "description": "Pre-printed checklist: only marked rows count",
        "input_text": (
            "BESTELLFORMULAR                Mengen\n"
            "  Mehl 25kg                    [ 3 ]\n"
            "  Zucker 25kg                  [   ]\n"
            "  Pelati 3/1                   [   ]\n"
            "  Maiskorn 3/1                 [ 6 ]\n"
            "  Senf 875ml                   [   ]\n"
        ),
        "expected_output": {
            "customer_hint": None,
            "delivery_note": None,
            "raw_text": "Bestellformular: Mehl 25kg 3, Maiskorn 3/1 6.",
            "items": [
                {"raw_text": "Mehl 25kg", "quantity": 3, "unit_hint": "sack", "notes": None},
                {"raw_text": "Maiskorn 3/1", "quantity": 6, "unit_hint": "can", "notes": None},
            ],
        },
    },
    {
        "description": "Short German dialect message",
        "input_text": (
            "Von meinem iPad Hoi bitte tuischmo 5 schweinskaiserteile "
            "ohne deckl vom angebot dozui\nDanke"
        ),
        "expected_output": {
            "customer_hint": None,
            "delivery_note": None,
            "raw_text": "bitte tuischmo 5 schweinskaiserteile ohne deckl vom angebot dozui",
            "items": [
                {"raw_text": "schweinskaiserteile ohne deckl", "quantity": 5, "unit_hint": None, "notes": "vom Angebot"},
            ],
        },
    },
]


def format_examples_block() -> str:
    """Render the few-shot examples as a single prompt section.

    Returns
    -------
    str
        Markdown-style block to append after EXTRACTION_PROMPT.
    """
    blocks = [
        f"--- EXAMPLE {i}: {ex['description']} ---\n"
        f"INPUT:\n{ex['input_text']}\n\n"
        f"EXPECTED OUTPUT:\n"
        f"{json.dumps(ex['expected_output'], indent=2, ensure_ascii=False)}\n"
        for i, ex in enumerate(FEW_SHOT_EXAMPLES, start=1)
    ]
    return "[FEW-SHOT EXAMPLES]\n" + "\n".join(blocks)
