# Previsore di volatilità ETF — VWCE

Sistema open-source per la previsione della volatilità realizzata di un ETF
(default **VWCE.MI**, Vanguard FTSE All-World) su orizzonte 10 giorni, con
intervalli di confidenza, identificazione dei driver e sintesi delle notizie.

Non prevede il prezzo (impredittibile), ma **quanta volatilità aspettarsi**
nelle prossime 1-3 settimane, con un margine di errore onesto.

## Cosa fa

- **Previsione volatilità** a 10 giorni con LightGBM, baseline HAR (OLS)
- **Intervalli al 95%** con conformal prediction (MAPIE)
- **Driver** della previsione via SHAP (quale segnale la spinge su/giù)
- **Backtest** walk-forward: RMSE, R², QLIKE, copertura empirica
- **Sentiment** delle notizie con FinBERT + sintesi settimanale con Gemini Flash

## Architettura

Il calcolo (lento) è separato dal servizio (veloce):

```
motore/pipeline.py  →  fetch + features + train + forecast + SHAP + news
                       salva artefatti in stato/
api/main.py         →  legge stato/ e serve i risultati in <50ms
```

```
motore/
  config.py            parametri centralizzati (ticker, serie FRED)
  dati/                mercato (yfinance) · macro (FRED) · notizie (GDELT/RSS/GPR)
  caratteristiche/     volatilita realizzata + HAR · costruzione tabellone
  modelli/             har (OLS) · previsore (LightGBM+MAPIE) · backtest
  spiegazioni/         shap
  nlp/                 sentiment (FinBERT) · sintesi (Gemini Flash)
  pipeline.py          orchestrazione
api/
  main.py              endpoint FastAPI
  schemi.py            modelli Pydantic
tests/                 test su logica pura
```

## Avvio

```bash
pip install -r requirements.txt
cp .env.example .env     # inserisci GEMINI_API_KEY e FRED_API_KEY
```

Esegui la pipeline (genera gli artefatti):

```bash
PYTHONPATH=. python -m motore.pipeline
```

Avvia l'API:

```bash
PYTHONPATH=. uvicorn api.main:app --reload --port 8001
```

## Endpoint

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET  | `/api/salute` | stato e data ultimo aggiornamento |
| GET  | `/api/previsione` | volatilità prevista 10gg, intervallo 95%, regime |
| GET  | `/api/serie` | storico RV + forecast (per grafico) |
| GET  | `/api/driver` | contributi SHAP della previsione |
| GET  | `/api/notizie` | sintesi + titoli con sentiment |
| GET  | `/api/backtest` | RMSE, R², QLIKE, copertura |
| POST | `/api/aggiorna` | rilancia la pipeline in background |

## Chiavi API (gratuite)

- **FRED**: https://fred.stlouisfed.org/docs/api/api_key.html
- **Gemini**: https://aistudio.google.com/apikey

## Limiti onesti

- La copertura degli intervalli è garantita formalmente solo a 1 step; a 10
  giorni va verificata empiricamente (il backtest riporta la copertura reale).
- I dati macro hanno lag di pubblicazione; le feature sono sempre laggate per
  evitare look-ahead bias.
- La volatilità è prevedibile (R² ~0.55-0.60), la direzione del prezzo no.
