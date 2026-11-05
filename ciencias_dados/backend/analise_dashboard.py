"""Análises do dashboard do Flow Agendas."""
import pandas as pd

from analise import ler_dados

COL_ID = "id"
COL_DATA = "data"
COL_STATUS = "status"
COL_CATEGORIA = "categoria"

STATUS_VALIDOS = {
    "pendente": "pendente",
    "concluido": "concluido",
    "concluído": "concluido",
    "concluida": "concluido",
    "concluída": "concluido",
    "cancelado": "cancelado",
    "cancelada": "cancelado",
}


def validar_status(coluna):
    """Normaliza o status e recusa valores desconhecidos."""
    normalizados = []
    for valor in coluna:
        texto = str(valor).strip().lower()
        if texto not in STATUS_VALIDOS:
            raise ValueError(
                f"Status inválido: {valor!r}. Use pendente, concluído ou cancelado."
            )
        normalizados.append(STATUS_VALIDOS[texto])
    return normalizados


def carregar_dados_dashboard():
    dados = ler_dados().copy()

    obrigatorias = {COL_ID, COL_DATA, COL_STATUS, COL_CATEGORIA}
    faltantes = obrigatorias - set(dados.columns)
    if faltantes:
        raise ValueError("Colunas ausentes: " + ", ".join(sorted(faltantes)))
    if dados.empty:
        return dados

    datas = dados[COL_DATA].astype("string").str.strip()
    if not datas.str.fullmatch(r"\d{4}-\d{2}-\d{2}").fillna(False).all():
        raise ValueError("Use a data no formato AAAA-MM-DD.")
    dados[COL_DATA] = pd.to_datetime(
        datas, format="%Y-%m-%d", errors="raise"
    ).dt.strftime("%Y-%m-%d")

    dados["status_normalizado"] = validar_status(dados[COL_STATUS])
    return dados


def tarefas_por_dia():
    dados = carregar_dados_dashboard()
    if dados.empty:
        return []
    tabela = (
        dados.groupby([COL_DATA, "status_normalizado"])[COL_ID]
        .nunique()
        .unstack(fill_value=0)
        .sort_index()
    )
    resultado = []
    for data, linha in tabela.iterrows():
        pendentes = int(linha.get("pendente", 0))
        concluidas = int(linha.get("concluido", 0))
        canceladas = int(linha.get("cancelado", 0))
        resultado.append({
            "data": data,
            "pendentes": pendentes,
            "concluidas": concluidas,
            "canceladas": canceladas,
            "total": pendentes + concluidas + canceladas,
        })
    return resultado


def tarefas_por_categoria():
    dados = carregar_dados_dashboard()
    if dados.empty:
        return []
    totais = dados.groupby(COL_CATEGORIA)[COL_ID].nunique().sort_index()
    return [
        {"categoria": str(cat), "total_tarefas": int(total)}
        for cat, total in totais.items()
    ]
def tarefas_por_dia_simples():
    dados = carregar_dados_dashboard()
    if dados.empty:
        return []
    
    totais = dados.groupby(COL_DATA)[COL_ID].nunique()
    
    return [
        {"data": data, "total_tarefas": int(total)}
        for data, total in totais.sort_index().items()
    ]
