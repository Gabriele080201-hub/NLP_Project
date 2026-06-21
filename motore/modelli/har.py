import pandas as pd
import numpy as np
import statsmodels.api as sm


_COLONNE_HAR = ["rv_1d", "rv_5d", "rv_22d"]


def addestra_har(X: pd.DataFrame, y: pd.Series):
    colonne = [c for c in _COLONNE_HAR if c in X.columns]
    Xh = sm.add_constant(X[colonne])
    return sm.OLS(y, Xh).fit()


def prevedi_har(modello, X_riga: pd.Series) -> float:
    colonne = [c for c in _COLONNE_HAR if c in X_riga.index]
    x = sm.add_constant(pd.DataFrame([X_riga[colonne]]), has_constant="add")
    return float(modello.predict(x).iloc[0])
