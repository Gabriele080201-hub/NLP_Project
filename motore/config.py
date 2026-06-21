from pathlib import Path

RADICE = Path(__file__).parent.parent

TICKER = "VWCE.MI"
TICKER_FALLBACK = ["VWCE.DE", "VWCE.AS"]
TICKER_VOL = ["^VIX", "^VIX9D", "^VVIX"]

SERIE_FRED = {
    "vix": "VIXCLS",
    "vix_9d": "VXST",
    "hy_oas": "BAMLH0A0HYM2",
    "ig_oas": "BAMLC0A0CM",
    "term": "T10Y2Y",
    "nfci": "NFCI",
}

ORIZZONTE = 10
ANNI_STORIA = 5
ALPHA_CI = 0.05

CARTELLA_CACHE = RADICE / "cache"
CARTELLA_STATO = RADICE / "stato"

MODELLO_GEMINI = "gemini-2.5-flash"

CARTELLA_CACHE.mkdir(exist_ok=True)
CARTELLA_STATO.mkdir(exist_ok=True)
