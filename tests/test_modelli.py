import numpy as np
import pandas as pd
import pytest
from motore.modelli.har import addestra_har, prevedi_har
from motore.modelli.previsore import addestra_previsore, prevedi_con_intervallo
from motore.caratteristiche.volatilita import volatilita_realizzata, caratteristiche_har, target_forward


def _dataset(n=600, seed=7):
    np.random.seed(seed)
    p = pd.Series(
        100 * np.exp(np.cumsum(np.random.normal(0, 0.01, n))),
        index=pd.date_range("2019-01-01", periods=n, freq="B"),
    )
    rv = volatilita_realizzata(p)
    har = caratteristiche_har(rv)
    y = target_forward(rv, 10)
    df = har.join(y).dropna()
    X = df[["rv_1d", "rv_5d", "rv_22d", "rv_ratio"]]
    y_out = df[[c for c in df.columns if "fwd" in c]].iloc[:, 0]
    return X, y_out


def test_har_prevede_positivo():
    X, y = _dataset()
    modello = addestra_har(X, y)
    pred = prevedi_har(modello, X.iloc[-1])
    assert pred > 0


def test_har_r2_ragionevole():
    X, y = _dataset()
    split = int(len(X) * 0.8)
    modello = addestra_har(X.iloc[:split], y.iloc[:split])
    import statsmodels.api as sm
    Xh = sm.add_constant(X.iloc[split:][["rv_1d", "rv_5d", "rv_22d"]])
    y_hat = modello.predict(Xh)
    from sklearn.metrics import r2_score
    r2 = r2_score(y.iloc[split:], y_hat)
    assert r2 > 0.1


def test_previsore_intervallo_valido():
    X, y = _dataset()
    prev = addestra_previsore(X, y)
    assert prev.inferiore <= prev.punto <= prev.superiore
    assert prev.inferiore >= 0


def test_previsore_nuovo_punto():
    X, y = _dataset()
    prev = addestra_previsore(X, y)
    p, inf, sup = prevedi_con_intervallo(prev, X.iloc[[-1]])
    assert inf >= 0
    assert inf <= p <= sup


def test_previsore_feature_nomi():
    X, y = _dataset()
    prev = addestra_previsore(X, y)
    assert prev.feature_nomi == list(X.columns)
