import json
import math
import pandas as pd
from pathlib import Path
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from .schemi import Salute, Previsione, RispostaDriver, RispostaNotizie, RispostaBacktest, PuntoSerie

_STATO = Path(__file__).parent.parent / "stato"

app = FastAPI(title="Volatilità ETF — VWCE")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _leggi(nome: str) -> dict:
    percorso = _STATO / nome
    if not percorso.exists():
        raise HTTPException(
            status_code=404,
            detail=f"{nome} non trovato — esegui POST /api/aggiorna prima",
        )
    return json.loads(percorso.read_text())


@app.get("/api/salute", response_model=Salute)
def salute():
    percorso = _STATO / "previsione.json"
    if percorso.exists():
        d = json.loads(percorso.read_text())
        return Salute(ok=True, aggiornato=d.get("aggiornato"), messaggio="ok")
    return Salute(ok=False, messaggio="pipeline mai eseguita — chiama POST /api/aggiorna")


@app.get("/api/previsione", response_model=Previsione)
def previsione():
    return _leggi("previsione.json")


@app.get("/api/driver", response_model=RispostaDriver)
def driver():
    return _leggi("driver.json")


@app.get("/api/notizie", response_model=RispostaNotizie)
def notizie():
    return _leggi("notizie.json")


@app.get("/api/backtest", response_model=RispostaBacktest)
def backtest():
    d = _leggi("backtest.json")
    return {k: v for k, v in d.items() if k != "dettaglio"}


@app.get("/api/serie", response_model=list[PuntoSerie])
def serie():
    percorso = _STATO / "serie.parquet"
    if not percorso.exists():
        raise HTTPException(404, "serie.parquet non trovata")

    df = pd.read_parquet(percorso).reset_index()
    risultati = []
    for _, riga in df.iterrows():
        rv10 = riga.get("rv_fwd10")
        risultati.append(PuntoSerie(
            data=str(riga["data"])[:10],
            rv_annualizzata=float(riga["rv_annualizzata"]),
            rv_fwd10=float(rv10) if rv10 is not None and not math.isnan(float(rv10)) else None,
        ))
    return risultati


@app.post("/api/aggiorna")
def aggiorna(background: BackgroundTasks):
    from motore.pipeline import esegui_pipeline
    background.add_task(esegui_pipeline)
    return {"messaggio": "pipeline avviata in background"}
