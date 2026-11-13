import pandas as pd
from analise import ler_dados


def carregar_dados_dashboard():
    dados = ler_dados()
    
    obrigatorias = {"data", "status"}
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

    status_validos = {"Pendente", "Concluido"}
    if not dados["status"].isin(status_validos).all():
        raise ValueError("O status deve ser: Pendente ou Concluido.")

    return dados


def tarefas_por_dia():
    dados = carregar_dados_dashboard()
    if dados.empty:
        return []
    totais = dados.groupby("data")["id"].count()
    return [
        {"data": data, "total_tarefas": int(total)}
        for data, total in totais.sort_index().items()
    ]


def concluidas_por_dia():
    dados = carregar_dados_dashboard()
    if dados.empty:
        return []
    
    concluidas = dados[dados["status"] == "Concluido"]
    totais = concluidas.groupby("data")["id"].count()
    
    todas_datas = dados["data"].unique()
    resultado = []
    for data in sorted(todas_datas):
        total = int(totais.get(data, 0))
        resultado.append({"data": data, "tarefas_concluidas": total})
        
    return resultado