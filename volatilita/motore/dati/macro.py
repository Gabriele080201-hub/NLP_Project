import os
import time
import pandas as pd
from datetime import datetime, timedelta
from ..config import SERIE_FRED, ANNI_STORIA, CARTELLA_CACHE


def _client_fred():
    from fredapi import Fred

    chiave = os.environ.get("FRED_API_KEY", "")
    if not chiave:
        raise RuntimeError("FRED_API_KEY non impostata nel file .env")
    return Fred(api_key=chiave)


def scarica_macro(anni: int = ANNI_STORIA) -> pd.DataFrame:
    cache = CARTELLA_CACHE / "macro.parquet"
    if cache.exists() and (time.time() - cache.stat().st_mtime) < 86400:
        return pd.read_parquet(cache)

    fred = _client_fred()
    inizio = (datetime.now() - timedelta(days=365 * anni)).strftime("%Y-%m-%d")

    serie = {}
    for nome, id_fred in SERIE_FRED.items():
        try:
            s = fred.get_series(id_fred, observation_start=inizio)
            serie[nome] = s
        except Exception:
            continue

    if not serie:
        raise RuntimeError("Nessuna serie FRED scaricata — verifica FRED_API_KEY")

    df = pd.DataFrame(serie)
    df.index = pd.to_datetime(df.index).tz_localize(None)
    df = df.sort_index().ffill()
    df.to_parquet(cache)
    return df
