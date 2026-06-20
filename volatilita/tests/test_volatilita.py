import numpy as np
import pandas as pd
import pytest
from motore.caratteristiche.volatilita import (
    volatilita_realizzata,
    caratteristiche_har,
    target_forward,
    annualizza,
)


def _prezzi(n=300, seed=42):
    np.random.seed(seed)
    rend = np.random.normal(0, 0.01, n)
    prezzi = 100 * np.exp(np.cumsum(rend))
    return pd.Series(prezzi, index=pd.date_range("2020-01-01", periods=n, freq="B"))


def test_rv_non_negativa():
    rv = volatilita_realizzata(_prezzi())
    assert (rv >= 0).all()


def test_rv_lunghezza():
    p = _prezzi(300)
    rv = volatilita_realizzata(p)
    assert len(rv) == 299


def test_har_colonne():
    rv = volatilita_realizzata(_prezzi())
    har = caratteristiche_har(rv)
    assert {"rv_1d", "rv_5d", "rv_22d", "rv_ratio"}.issubset(har.columns)


def test_har_nessun_leakage():
    rv = volatilita_realizzata(_prezzi())
    har = caratteristiche_har(rv)
    rv_allineata = rv.reindex(har.index)
    assert not (rv_allineata == har["rv_1d"]).all()


def test_target_termina_nan():
    rv = volatilita_realizzata(_prezzi())
    y = target_forward(rv, 10)
    assert y.iloc[-5:].isna().all()


def test_annualizza_scala():
    rv = volatilita_realizzata(_prezzi())
    rv_ann = annualizza(rv)
    rapporto = rv_ann / rv
    assert (rapporto.dropna() - np.sqrt(252)).abs().max() < 1e-10
