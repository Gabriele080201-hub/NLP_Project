import numpy as np

_pipeline = None


def _carica():
    global _pipeline
    if _pipeline is None:
        from transformers import pipeline
        _pipeline = pipeline(
            "text-classification",
            model="ProsusAI/finbert",
            return_all_scores=True,
            device=-1,
        )
    return _pipeline


def punteggia_titoli(titoli: list[dict]) -> list[dict]:
    if not titoli:
        return []

    pipe = _carica()
    testi = [t["titolo"] for t in titoli]
    raw = pipe(testi, batch_size=16)

    risultato = []
    for item, scores in zip(titoli, raw):
        probs = {d["label"]: d["score"] for d in scores}
        score = probs.get("positive", 0.0) - probs.get("negative", 0.0)
        etichetta = max(probs, key=probs.get)
        risultato.append({
            **item,
            "score": round(score, 4),
            "etichetta": etichetta,
            "p_positivo": round(probs.get("positive", 0.0), 4),
            "p_negativo": round(probs.get("negative", 0.0), 4),
            "p_neutro": round(probs.get("neutral", 0.0), 4),
        })

    return risultato


def sentiment_aggregato(punteggiati: list[dict]) -> float:
    if not punteggiati:
        return 0.0
    return round(float(np.mean([p["score"] for p in punteggiati])), 4)
