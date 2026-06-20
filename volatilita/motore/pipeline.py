import json
import numpy as np
import pandas as pd
from datetime import datetime, timezone

from .caratteristiche.segnali import costruisci_tabellone
from .caratteristiche.volatilita import annualizza
from .modelli.har import addestra_har, prevedi_har
from .modelli.previsore import addestra_previsore, prevedi_con_intervallo
from .modelli.backtest import backtest_walk_forward
from .spiegazioni.shap_vol import spiega_previsione
from .dati.notizie import scarica_news_gdelt, scarica_rss_banche
from .nlp.sentiment import punteggia_titoli, sentiment_aggregato
from .nlp.sintesi import sintetizza_driver
from .config import CARTELLA_STATO, ORIZZONTE


def _regime(punto: float, media_storica: float) -> str:
    if punto > media_storica * 1.3:
        return "ALTA"
    if punto < media_storica * 0.7:
        return "BASSA"
    return "MEDIA"


def esegui_pipeline() -> dict:
    X, y, rv = costruisci_tabellone()

    har = addestra_har(X, y)
    previsione = addestra_previsore(X, y)

    X_ultimo = X.iloc[[-1]]
    punto, inferiore, superiore = prevedi_con_intervallo(previsione, X_ultimo)
    punto_har = prevedi_har(har, X.iloc[-1])

    driver_shap = spiega_previsione(previsione.modello, X_ultimo)
    backtest = backtest_walk_forward(X, y)

    news = scarica_news_gdelt(50) + scarica_rss_banche(10)
    punteggiati = punteggia_titoli(news)
    score_sentiment = sentiment_aggregato(punteggiati)
    sintesi = sintetizza_driver(punteggiati)

    media_storica = float(y.mean())
    ts = datetime.now(timezone.utc).isoformat()

    previsione_json = {
        "aggiornato": ts,
        "orizzonte_giorni": ORIZZONTE,
        "punto": round(punto, 6),
        "inferiore_95": round(inferiore, 6),
        "superiore_95": round(superiore, 6),
        "punto_har": round(punto_har, 6),
        "regime": _regime(punto, media_storica),
        "rv_media_storica": round(media_storica, 6),
        "oscillazione_attesa_pct": round((superiore - inferiore) / 2 * 100, 2),
    }

    notizie_json = {
        "aggiornato": ts,
        "score_sentiment": score_sentiment,
        "titoli": punteggiati[:30],
        "sintesi": sintesi,
    }

    driver_json = {
        "aggiornato": ts,
        "driver": driver_shap,
    }

    backtest_json = {
        "aggiornato": ts,
        **backtest,
    }

    rv_ann = annualizza(rv)
    serie = pd.DataFrame({
        "rv_annualizzata": rv_ann,
        "rv_fwd10": y.reindex(rv_ann.index),
    }).dropna(subset=["rv_annualizzata"])
    serie.index.name = "data"

    (CARTELLA_STATO / "previsione.json").write_text(
        json.dumps(previsione_json, ensure_ascii=False, indent=2)
    )
    (CARTELLA_STATO / "notizie.json").write_text(
        json.dumps(notizie_json, ensure_ascii=False, indent=2)
    )
    (CARTELLA_STATO / "driver.json").write_text(
        json.dumps(driver_json, ensure_ascii=False, indent=2)
    )
    (CARTELLA_STATO / "backtest.json").write_text(
        json.dumps(backtest_json, ensure_ascii=False, indent=2)
    )
    serie.to_parquet(CARTELLA_STATO / "serie.parquet")

    return previsione_json


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    risultato = esegui_pipeline()
    print(json.dumps(risultato, indent=2, ensure_ascii=False))
