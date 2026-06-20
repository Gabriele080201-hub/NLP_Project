import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from .previsore import _lgbm


def qlike(y_vero: np.ndarray, y_pred: np.ndarray) -> float:
    rapporto = y_vero / np.maximum(y_pred, 1e-8)
    return float(np.mean(rapporto - np.log(rapporto) - 1))


def copertura_empirica(y_vero: np.ndarray, inferiore: np.ndarray, superiore: np.ndarray) -> float:
    return float(np.mean((y_vero >= inferiore) & (y_vero <= superiore)))


def backtest_walk_forward(
    X: pd.DataFrame,
    y: pd.Series,
    finestra_iniziale: int = 500,
    passo: int = 21,
) -> dict:
    n = len(X)
    finestra_iniziale = min(finestra_iniziale, int(n * 0.5))

    if n - finestra_iniziale < passo:
        return {
            "finestre": 0,
            "rmse_medio": None,
            "mae_medio": None,
            "r2_oos_medio": None,
            "qlike_medio": None,
            "dettaglio": [],
        }

    risultati = []
    for inizio in range(finestra_iniziale, n - passo, passo):
        X_tr = X.iloc[:inizio]
        y_tr = y.iloc[:inizio]
        X_te = X.iloc[inizio:inizio + passo]
        y_te = y.iloc[inizio:inizio + passo]

        m = _lgbm()
        m.fit(X_tr, y_tr)
        y_hat = m.predict(X_te)

        risultati.append({
            "data": str(X_te.index[0])[:10],
            "rmse": float(np.sqrt(mean_squared_error(y_te, y_hat))),
            "mae": float(mean_absolute_error(y_te, y_hat)),
            "r2_oos": float(r2_score(y_te, y_hat)),
            "qlike": qlike(y_te.values, y_hat),
        })

    df = pd.DataFrame(risultati)

    return {
        "finestre": len(df),
        "rmse_medio": round(float(df["rmse"].mean()), 6),
        "mae_medio": round(float(df["mae"].mean()), 6),
        "r2_oos_medio": round(float(df["r2_oos"].mean()), 4),
        "qlike_medio": round(float(df["qlike"].mean()), 6),
        "dettaglio": risultati,
    }
