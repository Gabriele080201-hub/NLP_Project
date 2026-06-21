import time
import requests
import feedparser
import pandas as pd
from ..config import CARTELLA_CACHE

_GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc"

_RSS_BANCHE = {
    "fed_fomc": "https://www.federalreserve.gov/feeds/press_monetary.xml",
    "fed_speech": "https://www.federalreserve.gov/feeds/speeches.xml",
    "ecb_press": "https://www.ecb.europa.eu/rss/press.html",
}

_GPR_URL = "https://www.matteoiacoviello.com/gpr_files/gpr_web_latest.xlsx"


def scarica_news_gdelt(n: int = 50) -> list[dict]:
    try:
        resp = requests.get(
            _GDELT_URL,
            params={
                "query": "stock market OR financial markets OR volatility OR Fed OR ECB sourcelang:english",
                "mode": "ArtList",
                "maxrecords": n,
                "format": "json",
                "sort": "DateDesc",
            },
            timeout=15,
        )
        resp.raise_for_status()
        articoli = resp.json().get("articles", [])
        return [
            {
                "titolo": a.get("title", ""),
                "fonte": a.get("domain", ""),
                "data": a.get("seendate", "")[:8],
            }
            for a in articoli
            if a.get("title")
        ]
    except Exception:
        return []


def scarica_rss_banche(n_per_feed: int = 10) -> list[dict]:
    risultati = []
    for fonte, url in _RSS_BANCHE.items():
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:n_per_feed]:
                risultati.append({
                    "titolo": entry.get("title", ""),
                    "fonte": fonte,
                    "data": entry.get("published", "")[:10],
                })
        except Exception:
            continue
    return risultati


def scarica_gpr() -> pd.DataFrame:
    cache = CARTELLA_CACHE / "gpr.parquet"
    if cache.exists() and (time.time() - cache.stat().st_mtime) < 7 * 86400:
        return pd.read_parquet(cache)

    try:
        df = pd.read_excel(_GPR_URL, sheet_name=0)
        df["data"] = pd.to_datetime(
            df["month"].astype(str).str.replace("m", "-"), format="%Y-%m"
        )
        df = df.set_index("data").sort_index()
        colonne = [c for c in ["GPRD", "GPRD_ACT", "GPRD_THR"] if c in df.columns]
        df = df[colonne].rename(columns={"GPRD": "gpr", "GPRD_ACT": "gpr_atti", "GPRD_THR": "gpr_minacce"})
        df.to_parquet(cache)
        return df
    except Exception:
        return pd.DataFrame(columns=["gpr"])
