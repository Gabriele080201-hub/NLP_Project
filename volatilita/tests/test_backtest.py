import numpy as np
import pandas as pd
import pytest
from motore.modelli.backtest import qlike, copertura_empirica, backtest_walk_forward
from motore.caratteristiche.volatilita import volatilita_realizzata, caratteristiche_har, target_forward


def test_qlike_ottimale():
    y = np.array([0.01, 0.02, 0.015, 0.012])
    assert qlike(y, y) < 1e-10


def test_qlike_positivo():
    y = np.array([0.01, 0.02, 0.015])
    y_hat = np.array([0.008, 0.025, 0.010])
    assert qlike(y, y_hat) >= 0


def test_copertura_totale():
    y = np.array([0.01, 0.02, 0.015, 0.012])
    assert copertura_empirica(y, y - 0.005, y + 0.005) == 1.0


def test_copertura_nulla():
    y = np.array([0.01, 0.02])
    assert copertura_empirica(y, y + 0.1, y + 0.2) == 0.0


def test_backtest_dataset_piccolo():
    np.random.seed(0)
    n = 150
    p = pd.Series(
        100 * np.exp(np.cumsum(np.random.normal(0, 0.01, n))),
        index=pd.date_range("2020-01-01", periods=n, freq="B"),
    )
    rv = volatilita_realizzata(p)
    har = caratteristiche_har(rv)
    y = target_forward(rv, 10)
    df = har.join(y).dropna()
    X = df.drop(columns=[c for c in df.columns if "fwd" in c])
    y_c = df[[c for c in df.columns if "fwd" in c]].iloc[:, 0]

    risultato = backtest_walk_forward(X, y_c, finestra_iniziale=500, passo=21)
    assert isinstance(risultato, dict)
    assert "finestre" in risultato


def test_backtest_dataset_sufficiente():
    np.random.seed(1)
    n = 800
    p = pd.Series(
        100 * np.exp(np.cumsum(np.random.normal(0, 0.01, n))),
        index=pd.date_range("2018-01-01", periods=n, freq="B"),
    )
    rv = volatilita_realizzata(p)
    har = caratteristiche_har(rv)
    y = target_forward(rv, 10)
    df = har.join(y).dropna()
    X = df[["rv_1d", "rv_5d", "rv_22d", "rv_ratio"]]
    y_c = df[[c for c in df.columns if "fwd" in c]].iloc[:, 0]

    risultato = backtest_walk_forward(X, y_c, finestra_iniziale=300, passo=21)
    assert risultato["finestre"] > 0
    assert risultato["r2_oos_medio"] is not None
    assert risultato["qlike_medio"] >= 0
