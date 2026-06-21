import pandas as pd
import numpy as np


def spiega_previsione(modello, X_ultimo: pd.DataFrame, n_top: int = 8) -> list[dict]:
    try:
        import shap

        explainer = shap.TreeExplainer(modello)
        spiegazione = explainer(X_ultimo)
        valori = spiegazione.values

        if valori.ndim > 1:
            valori = valori[0]

        nomi = X_ultimo.columns.tolist()
        contributi = [
            {"segnale": n, "contributo": round(float(c), 6)}
            for n, c in zip(nomi, valori)
        ]
        return sorted(contributi, key=lambda x: abs(x["contributo"]), reverse=True)[:n_top]

    except Exception as e:
        return [{"segnale": "shap_non_disponibile", "contributo": 0.0}]
