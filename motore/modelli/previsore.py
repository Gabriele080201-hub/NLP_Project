from dataclasses import dataclass
import pandas as pd
import numpy as np
from lightgbm import LGBMRegressor
from mapie.regression import MapieRegressor


def _lgbm() -> LGBMRegressor:
    return LGBMRegressor(
        n_estimators=300,
        learning_rate=0.02,
        num_leaves=15,
        min_child_samples=20,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=0.1,
        random_state=42,
        verbosity=-1,
    )


@dataclass
class Previsione:
    punto: float
    inferiore: float
    superiore: float
    modello: LGBMRegressor
    mapie: MapieRegressor
    feature_nomi: list


def addestra_previsore(X: pd.DataFrame, y: pd.Series) -> Previsione:
    n = len(X)
    split = max(int(n * 0.7), n - 100)

    modello = _lgbm()
    modello.fit(X.iloc[:split], y.iloc[:split])

    mapie = MapieRegressor(estimator=modello, cv="prefit")
    mapie.fit(X.iloc[split:], y.iloc[split:])

    punto, pis = mapie.predict(X.iloc[[-1]], alpha=0.05)

    return Previsione(
        punto=float(punto[0]),
        inferiore=max(0.0, float(pis[0, 0, 0])),
        superiore=float(pis[0, 1, 0]),
        modello=modello,
        mapie=mapie,
        feature_nomi=list(X.columns),
    )


def prevedi_con_intervallo(previsione: Previsione, X_nuovo: pd.DataFrame) -> tuple[float, float, float]:
    punto, pis = previsione.mapie.predict(X_nuovo, alpha=0.05)
    return (
        float(punto[0]),
        max(0.0, float(pis[0, 0, 0])),
        float(pis[0, 1, 0]),
    )
