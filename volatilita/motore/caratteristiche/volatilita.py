import numpy as np
import pandas as pd


def volatilita_realizzata(prezzi: pd.Series) -> pd.Series:
    rendimenti = np.log(prezzi / prezzi.shift(1)).dropna()
    return rendimenti.abs().rename("rv")


def caratteristiche_har(rv: pd.Series) -> pd.DataFrame:
    df = pd.DataFrame(index=rv.index)
    df["rv_1d"] = rv.shift(1)
    df["rv_5d"] = rv.shift(1).rolling(5).mean()
    df["rv_22d"] = rv.shift(1).rolling(22).mean()
    df["rv_ratio"] = df["rv_5d"] / (df["rv_22d"] + 1e-8)
    return df


def target_forward(rv: pd.Series, orizzonte: int) -> pd.Series:
    return rv.rolling(orizzonte).mean().shift(-orizzonte).rename(f"rv_fwd{orizzonte}")


def annualizza(rv: pd.Series) -> pd.Series:
    return (rv * np.sqrt(252)).rename("rv_ann")
