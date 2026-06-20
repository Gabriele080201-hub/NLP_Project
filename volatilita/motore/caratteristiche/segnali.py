import pandas as pd
from ..dati.mercato import scarica_prezzi, scarica_indici_vol
from ..dati.macro import scarica_macro
from ..dati.notizie import scarica_gpr
from .volatilita import volatilita_realizzata, caratteristiche_har, target_forward
from ..config import ORIZZONTE


def costruisci_tabellone() -> tuple[pd.DataFrame, pd.Series, pd.Series]:
    prezzi = scarica_prezzi()["chiusura"]
    rv = volatilita_realizzata(prezzi)

    har = caratteristiche_har(rv)
    y = target_forward(rv, ORIZZONTE)

    indici = scarica_indici_vol()
    indici_lag = indici.shift(1)

    if "vix" in indici.columns:
        indici_lag["vix_delta"] = indici["vix"].diff(1).shift(1)
        indici_lag["vix_delta_5d"] = indici["vix"].diff(5).shift(1)

    macro = scarica_macro()
    macro_lag = macro.shift(1)

    gpr = scarica_gpr()
    if not gpr.empty:
        gpr_lag = gpr.reindex(har.index, method="ffill").shift(1)
    else:
        gpr_lag = pd.DataFrame(index=har.index)

    tabellone = pd.concat([har, indici_lag, macro_lag, gpr_lag], axis=1)
    tabellone = tabellone.join(y)

    colonna_target = f"rv_fwd{ORIZZONTE}"
    tabellone = tabellone.dropna(subset=["rv_1d", colonna_target])

    X = tabellone.drop(columns=[colonna_target])
    y_out = tabellone[colonna_target]

    return X, y_out, rv
