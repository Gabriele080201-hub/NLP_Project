from typing import Optional
from pydantic import BaseModel


class Salute(BaseModel):
    ok: bool
    aggiornato: Optional[str] = None
    messaggio: str


class Previsione(BaseModel):
    aggiornato: str
    orizzonte_giorni: int
    punto: float
    inferiore_95: float
    superiore_95: float
    punto_har: float
    regime: str
    rv_media_storica: float
    oscillazione_attesa_pct: float


class Driver(BaseModel):
    segnale: str
    contributo: float


class RispostaDriver(BaseModel):
    aggiornato: str
    driver: list[Driver]


class TitoloNotizia(BaseModel):
    titolo: str
    fonte: str
    data: str
    score: float
    etichetta: str


class RispostaNotizie(BaseModel):
    aggiornato: str
    score_sentiment: float
    sintesi: str
    titoli: list[TitoloNotizia]


class RispostaBacktest(BaseModel):
    aggiornato: str
    finestre: int
    rmse_medio: Optional[float] = None
    mae_medio: Optional[float] = None
    r2_oos_medio: Optional[float] = None
    qlike_medio: Optional[float] = None


class PuntoSerie(BaseModel):
    data: str
    rv_annualizzata: float
    rv_fwd10: Optional[float] = None
