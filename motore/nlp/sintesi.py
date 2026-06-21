import os
from google import genai
from google.genai import types
from ..config import MODELLO_GEMINI

_client = None


def _gemini():
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    return _client


def _prompt(punteggiati: list[dict]) -> str:
    righe = []
    for p in punteggiati[:30]:
        segno = "+" if p["score"] >= 0 else ""
        righe.append(
            f"- [{p.get('data', '')}] {p.get('fonte', '')}: \"{p['titolo']}\" (score: {segno}{p['score']:.2f})"
        )

    return f"""Sei un analista quantitativo senior specializzato in mercati azionari globali.
Hai analizzato {len(punteggiati)} titoli di notizie finanziarie con sentiment scoring [-1=molto bearish, +1=molto bullish].

NOTIZIE:
{chr(10).join(righe)}

Produci una sintesi CONCISA in italiano:

DRIVER DI MERCATO:
• [Driver 1]
• [Driver 2]
• [Driver 3]

RISCHI PRINCIPALI:
1. [Rischio 1]
2. [Rischio 2]

TONO: [RISK-ON / RISK-OFF / NEUTRO] — [motivazione breve]

Solo l'analisi, nessun preambolo."""


def sintetizza_driver(punteggiati: list[dict], modello: str = MODELLO_GEMINI) -> str:
    if not punteggiati:
        return "Nessuna notizia disponibile per la sintesi."

    try:
        resp = _gemini().models.generate_content(
            model=modello,
            contents=[_prompt(punteggiati)],
            config=types.GenerateContentConfig(temperature=0.3, max_output_tokens=512),
        )
        return resp.text
    except Exception as e:
        return f"Sintesi non disponibile: {e}"
