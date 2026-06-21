import time
import pandas as pd
import yfinance as yf
from ..config import TICKER, TICKER_FALLBACK, TICKER_VOL, ANNI_STORIA, CARTELLA_CACHE


def _da_yfinance(ticker: str, anni: int) -> pd.DataFrame | None:
    try:
        df = yf.Ticker(ticker).history(period=f"{anni}y", auto_adjust=True)
        if df.empty:
            return None
        serie = df[["Close"]].rename(columns={"Close": "chiusura"})
        serie.index = pd.to_datetime(serie.index).tz_localize(None)
        return serie.sort_index().dropna()
    except Exception:
        return None


def _da_stooq(ticker: str, anni: int) -> pd.DataFrame | None:
    try:
        from pandas_datareader import data as pdr
        from datetime import datetime, timedelta

        start = datetime.now() - timedelta(days=365 * anni)
        df = pdr.DataReader(ticker, "stooq", start=start)
        if df.empty:
            return None
        serie = df[["Close"]].rename(columns={"Close": "chiusura"})
        serie.index = pd.to_datetime(serie.index).tz_localize(None)
        return serie.sort_index().dropna()
    except Exception:
        return None


def scarica_prezzi(anni: int = ANNI_STORIA) -> pd.DataFrame:
    cache = CARTELLA_CACHE / "prezzi.parquet"
    if cache.exists() and (time.time() - cache.stat().st_mtime) < 86400:
        return pd.read_parquet(cache)

    df = _da_yfinance(TICKER, anni)

    if df is None:
        for fb in TICKER_FALLBACK:
            df = _da_yfinance(fb, anni)
            if df is not None:
                break

    if df is None:
        df = _da_stooq(TICKER, anni)

    if df is None:
        raise RuntimeError(f"Impossibile scaricare prezzi per {TICKER}")

    df.to_parquet(cache)
    return df


def scarica_indici_vol(anni: int = ANNI_STORIA) -> pd.DataFrame:
    cache = CARTELLA_CACHE / "indici_vol.parquet"
    if cache.exists() and (time.time() - cache.stat().st_mtime) < 86400:
        return pd.read_parquet(cache)

    frames = []
    for ticker in TICKER_VOL:
        try:
            raw = yf.download(ticker, period=f"{anni}y", auto_adjust=False, progress=False)
            if raw.empty:
                continue
            nome = ticker.replace("^", "").lower()
            if isinstance(raw.columns, pd.MultiIndex):
                raw.columns = raw.columns.droplevel(1)
            s = raw[["Close"]].rename(columns={"Close": nome})
            s.index = pd.to_datetime(s.index).tz_localize(None)
            frames.append(s)
            time.sleep(0.5)
        except Exception:
            continue

    if not frames:
        raise RuntimeError("Impossibile scaricare indici di volatilità")

    result = pd.concat(frames, axis=1).sort_index()
    result.to_parquet(cache)
    return result
