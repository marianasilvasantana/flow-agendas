"""Novas análises para o dashboard baseadas no arquivo CSV do projeto."""
import pandas as pd

from analise import carregar_dados


def carregar_dados_dashboard():
    dados = carregar_dados()
    obrigatorias = {"data", "id"}
    faltantes = obrigatorias - set(dados.columns)
    if faltantes:
        raise ValueError("Colunas ausentes: " + ", ".join(sorted(faltantes)))
    if dados.empty:
        return dados

    datas = dados["data"].astype("string").str.strip()
    if not datas.str.fullmatch(r"\d{4}-\d{2}-\d{2}").fillna(False).all():
        raise ValueError("Use data no formato AAAA-MM-DD.")
    dados["data"] = pd.to_datetime(
        datas, format="%Y-%m-%d", errors="raise"
    ).dt.strftime("%Y-%m-%d")

    if (dados.groupby("id")["data"].nunique() > 1).any():
        raise ValueError("Um mesmo ID possui mais de uma data.")

    return dados


def compras_por_dia():
    """Quantos agendamentos/registros distintos ocorreram em cada dia?"""
    dados = carregar_dados_dashboard()
    if dados.empty:
        return []
    totais = dados.groupby("data")["id"].nunique()
    return [
        {"data": data, "total_compras": int(total)}
        for data, total in totais.sort_index().items()
    ]


def faturamento_por_dia():
    """Retorna o total de agendamentos em cada dia."""
    dados = carregar_dados_dashboard()
    if dados.empty:
        return []
    totais = dados.groupby("data")["id"].count()
    return [
        {"data": data, "faturamento": float(total)}
        for data, total in totais.sort_index().items()
    ]