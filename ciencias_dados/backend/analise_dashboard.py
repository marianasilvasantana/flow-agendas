import pandas as pd

from analise import ler_dados as carregar_dados

def carregar_dados_dashboard():
    dados = carregar_dados()
    
    obrigatorias = {"id", "nome_usuario", "titulo", "categoria", "data", "horario_inicio", "horario_fim", "prioridade", "status", "descricao"}
    faltantes = obrigatorias - set(dados.columns)
    if faltantes:
        raise ValueError("Colunas ausentes: " + ", ".join(sorted(faltantes)))
    if dados.empty:
        return dados

    datas = dados["data"].astype("string").str.strip()
    if not datas.str.fullmatch(r"\d{4}-\d{2}-\d{2}").fillna(False).all():
        raise ValueError("Use data_venda no formato AAAA-MM-DD.")
    dados["data_venda"] = pd.to_datetime(
        datas, format="%Y-%m-%d", errors="raise"
    ).dt.strftime("%Y-%m-%d")
    if (dados.groupby("id")["data"].nunique() > 1).any():
        raise ValueError("Uma tarefa tem mais de uma data.")
    
    return dados  # <--- AQUI ESTÁ A CORREÇÃO

def tarefas_por_dia():
    dados = carregar_dados_dashboard()
    if dados.empty:
        return []
    totais = dados.groupby("data")["id"].nunique()
    return [
        {"data": data, "total_tarefas": int(total)}
        for data, total in totais.sort_index().items()
    ]

def faturamento_por_dia():
    dados = carregar_dados_dashboard()
    if dados.empty:
        return []
    totais = dados.groupby("data_venda")["subtotal_centavos"].sum()
    return [
        {"data": data, "faturamento": int(total) / 100}
        for data, total in totais.sort_index().items()
    ]

def pessoas_cadastradas_por_dia():
    dados = carregar_dados_dashboard()
    if dados.empty:
        return []
    
    # Conta quantas pessoas únicas (nome_usuario) existem por data
    totais = dados.groupby("data")["nome_usuario"].nunique()
    return [
        {"data": data, "total_pessoas": int(total)}
        for data, total in totais.sort_index().items()
    ]