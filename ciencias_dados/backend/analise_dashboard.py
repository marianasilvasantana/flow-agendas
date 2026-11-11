import pandas as pd
from analise import ler_dados

def carregar_dados_dashboard():
    dados = ler_dados()
    if dados.empty: return dados
    obrigatorias = {"data", "status"}
    faltantes = obrigatorias - set(dados.columns)
    if faltantes: raise ValueError("Colunas ausentes: " + ", ".join(sorted(faltantes)))
    datas = dados["data"].astype("string").str.strip()
    if not datas.str.fullmatch(r"\d{4}-\d{2}-\d{2}").fillna(False).all(): raise ValueError("Use data no formato AAAA-MM-DD.")
    dados["data"] = pd.to_datetime(datas, format="%Y-%m-%d", errors="raise").dt.strftime("%Y-%m-%d")
    status_validos = {"Pendente", "Concluido", "Cancelado"}
    if not dados["status"].isin(status_validos).all(): raise ValueError("O status deve ser: Pendente, Concluido ou Cancelado.")
    return dados

def total_tarefas(): return len(carregar_dados_dashboard())

def usuarios_cadastrados():
    dados = carregar_dados_dashboard()
    return int(dados['nome_usuario'].nunique()) if 'nome_usuario' in dados.columns else 0

def total_de_categorias():
    dados = carregar_dados_dashboard()
    return int(dados['categoria'].nunique()) if 'categoria' in dados.columns else 0

def tarefas_por_dia():
    dados = carregar_dados_dashboard()
    if dados.empty: return []
    totais = dados.groupby("data")["id"].count()
    return [{"data": data, "total_tarefas": int(total)} for data, total in totais.sort_index().items()]

def concluidas_por_dia():
    dados = carregar_dados_dashboard()
    if dados.empty: return []
    concluidas = dados[dados["status"] == "Concluido"]
    totais = concluidas.groupby("data")["id"].count()
    todas_datas = dados["data"].unique()
    resultado = []
    for data in sorted(todas_datas):
        total = int(totais.get(data, 0))
        resultado.append({"data": data, "tarefas_concluidas": total})
    return resultado

def analise_por_data():
    dados = carregar_dados_dashboard()
    if dados.empty: return []
    pivot = dados.pivot_table(index='data', columns='status', values='id', aggfunc='count', fill_value=0)
    resultado = []
    for data, row in pivot.iterrows():
        pendentes = int(row.get('Pendente', 0))
        concluidas = int(row.get('Concluido', 0))
        canceladas = int(row.get('Cancelado', 0))
        resultado.append({"data": data, "pendentes": pendentes, "concluidas": concluidas, "canceladas": canceladas, "total": pendentes + concluidas + canceladas})
    return sorted(resultado, key=lambda x: x['data'])

def analise_por_categoria():
    dados = carregar_dados_dashboard()
    if dados.empty or 'categoria' not in dados.columns: return []
    totais = dados.groupby("categoria")["id"].count()
    return [{"categoria": cat, "total": int(total)} for cat, total in totais.sort_values(ascending=False).items()]

# --- FUNÇÕES MENSAIS (AQUI ESTÁ O SEGREDO PARA O GRÁFICO LIMPO) ---
def tarefas_por_mes():
    dados = carregar_dados_dashboard()
    if dados.empty: return []
    dados['mes'] = pd.to_datetime(dados['data']).dt.strftime('%Y-%m')
    totais = dados.groupby("mes")["id"].count()
    return [{"mes": mes, "total_tarefas": int(total)} for mes, total in totais.sort_index().items()]

def concluidas_por_mes():
    dados = carregar_dados_dashboard()
    if dados.empty: return []
    dados['mes'] = pd.to_datetime(dados['data']).dt.strftime('%Y-%m')
    concluidas = dados[dados["status"] == "Concluido"]
    totais = concluidas.groupby("mes")["id"].count()
    todos_os_meses = dados['mes'].unique()
    resultado = []
    for mes in sorted(todos_os_meses):
        total = int(totais.get(mes, 0))
        resultado.append({"mes": mes, "tarefas_concluidas": total})
    return resultado