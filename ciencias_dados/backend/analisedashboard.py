from decimal import Decimal, InvalidOperation

import pandas as pd

from analise import carregar_dados


def carregar_dados_dashboard():
    dados = carregar_dados()
    obrigatorias = {"pessoas_cadastradas", "total_tarefas", "total_categorias"}
    faltantes = obrigatorias - set(dados.columns)
    if faltantes:
        raise ValueError("Colunas ausentes: " + ", ".join(sorted(faltantes)))
    if dados.empty:
        return dados

    datas = dados["data_venda"].astype("string").str.strip()
    if not datas.str.fullmatch(r"\d{4}-\d{2}-\d{2}").fillna(False).all():
        raise ValueError("Use data_venda no formato AAAA-MM-DD.")
    dados["data_venda"] = pd.to_datetime(
        datas, format="%Y-%m-%d", errors="raise"
    ).dt.strftime("%Y-%m-%d")
    if (dados.groupby("id_venda")["data_venda"].nunique() > 1).any():
        raise ValueError("Uma venda possui mais de uma data.")
    
    
