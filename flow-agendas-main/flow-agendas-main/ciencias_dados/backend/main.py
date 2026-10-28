"""
Backend do Flow Agendas (FastAPI)

Rodar (dentro da pasta onde está este arquivo):
    python -m uvicorn main:app --reload --port 8000

Rotas:
    GET  /analise/resumo  -> dados do resumo (lidos do CSV)
    GET  /debug           -> mostra o que o backend entendeu do CSV
    POST /chat            -> chatbot Aya

Colunas do CSV: id, nome_usuario, titulo, categoria, data, horario_inicio,
                horario_fim, prioridade, status, descricao
"""
import csv
import re
import unicodedata
from collections import defaultdict
from datetime import date
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

AQUI = Path(__file__).resolve().parent

# O backend procura o CSV nestes lugares, na ordem
CANDIDATOS = [
    AQUI.parent / "database" / "agendas.csv",
    AQUI / "database" / "agendas.csv",
    AQUI / "agendas.csv",
]

# Nome de cada coluna (sem acento, minúsculo). Pode acrescentar outros nomes.
ALIASES = {
    "id": ["id"],
    "usuario": ["nome_usuario", "usuario", "nome", "pessoa", "cliente", "aluno"],
    "categoria": ["categoria", "tipo", "area"],
    "titulo": ["titulo", "tarefa", "evento"],
    "data": ["data", "dia"],
    "hora": ["horario_inicio", "hora", "horario"],
    "prioridade": ["prioridade"],
    "status": ["status", "situacao"],
}

app = FastAPI(title="Flow Agendas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- utilidades ----------
def normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFD", texto or "")
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", "_", texto.strip().lower())


def achar_csv() -> Path | None:
    for caminho in CANDIDATOS:
        if caminho.exists():
            return caminho
    return None


def abrir_texto(caminho: Path) -> str:
    for codificacao in ("utf-8-sig", "latin-1"):
        try:
            return caminho.read_text(encoding=codificacao)
        except UnicodeDecodeError:
            continue
    return ""


def detectar_separador(texto: str) -> str:
    primeira = texto.splitlines()[0] if texto else ""
    return max([",", ";", "\t", "|"], key=primeira.count)


def ler_csv():
    """Devolve (linhas, colunas, mapa, caminho, separador)."""
    caminho = achar_csv()
    if not caminho:
        return [], [], {}, None, ","
    texto = abrir_texto(caminho)
    sep = detectar_separador(texto)
    leitor = csv.DictReader(texto.splitlines(), delimiter=sep)
    colunas = leitor.fieldnames or []
    linhas = list(leitor)

    por_nome = {normalizar(c): c for c in colunas}
    mapa = {}
    for papel, nomes in ALIASES.items():
        for nome in nomes:
            if nome in por_nome:
                mapa[papel] = por_nome[nome]
                break
    return linhas, colunas, mapa, caminho, sep


def pegar(linha: dict, mapa: dict, papel: str) -> str:
    coluna = mapa.get(papel)
    return (linha.get(coluna) or "").strip() if coluna else ""


def situacao(texto: str) -> str:
    """Classifica o status em: concluida, cancelada ou pendente."""
    t = normalizar(texto)
    if "conclu" in t or t in ("feito", "done", "sim", "true"):
        return "concluida"
    if "cancel" in t:
        return "cancelada"
    return "pendente"


def data_br(iso: str) -> str:
    """2026-10-15 -> 15/10/2026 (se não for ISO, devolve como veio)."""
    m = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", iso)
    return f"{m.group(3)}/{m.group(2)}/{m.group(1)}" if m else iso


def data_iso(texto: str) -> str:
    """15/10 ou 15/10/2026 -> 2026-10-15."""
    m = re.fullmatch(r"(\d{1,2})/(\d{1,2})(?:/(\d{4}))?", texto)
    if not m:
        return texto
    ano = int(m.group(3)) if m.group(3) else date.today().year
    return f"{ano:04d}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"


# ---------- rotas ----------
@app.get("/analise/resumo")
def resumo():
    linhas, _, mapa, _, _ = ler_csv()

    usuarios = {pegar(l, mapa, "usuario") for l in linhas if pegar(l, mapa, "usuario")}

    por_categoria = defaultdict(int)
    for l in linhas:
        por_categoria[pegar(l, mapa, "categoria") or "Sem categoria"] += 1

    por_data = {}
    for l in linhas:
        dia = pegar(l, mapa, "data") or "Sem data"
        item = por_data.setdefault(
            dia, {"_iso": dia, "pendentes": 0, "concluidas": 0, "cancelados": 0})
        item[{"concluida": "concluidas", "cancelada": "cancelados",
              "pendente": "pendentes"}[situacao(pegar(l, mapa, "status"))]] += 1

    datas = []
    for dia in sorted(por_data):
        item = por_data[dia]
        datas.append({
            "data": data_br(dia),
            "pendentes": item["pendentes"],
            "concluidas": item["concluidas"],
            "cancelados": item["cancelados"],
            "total": item["pendentes"] + item["concluidas"] + item["cancelados"],
        })

    return {
        "total_compras": len(linhas),
        "total_clientes": len(usuarios),
        "total_produtos": len(por_categoria),
        "total_geral": len(linhas),
        "categorias": [{"categoria": n, "quantidade": q} for n, q in sorted(por_categoria.items())],
        "por_data": datas,
    }


@app.get("/debug")
def debug():
    linhas, colunas, mapa, caminho, sep = ler_csv()
    return {
        "arquivo_encontrado": str(caminho) if caminho else None,
        "procurou_em": [str(c) for c in CANDIDATOS],
        "separador": sep,
        "colunas_do_csv": colunas,
        "colunas_reconhecidas": mapa,
        "total_de_linhas": len(linhas),
        "primeiras_linhas": linhas[:3],
    }


# ---------- chatbot ----------
class Mensagem(BaseModel):
    texto: str


def salvar_evento(titulo: str, data: str, hora: str) -> None:
    linhas, colunas, mapa, caminho, sep = ler_csv()
    if not caminho or not colunas:
        return
    nova = {c: "" for c in colunas}
    valores = {
        "id": str(len(linhas) + 1),
        "titulo": titulo,
        "data": data_iso(data) if data else date.today().isoformat(),
        "hora": hora,
        "categoria": "Estudo",
        "prioridade": "Media",
        "status": "Pendente",
    }
    for papel, valor in valores.items():
        if papel in mapa:
            nova[mapa[papel]] = valor
    texto = abrir_texto(caminho)
    with caminho.open("a", encoding="utf-8", newline="") as f:
        if texto and not texto.endswith("\n"):
            f.write("\r\n")
        csv.DictWriter(f, fieldnames=colunas, delimiter=sep).writerow(nova)


@app.post("/chat")
def chat(msg: Mensagem):
    texto = msg.texto.strip()
    baixo = texto.lower()

    if "como adicionar" in baixo and "evento" in baixo:
        return {"resposta": "Digite algo como: \"marcar prova de ciências 30/09 às 14:00\" "
                            "e eu coloco na sua agenda.", "criar_evento": False}
    if "sono" in baixo and baixo.startswith("como"):
        return {"resposta": "Vá em Bem-estar e clique no botão do card Sono. "
                            "Informe a hora que dormiu e a que acordou.", "criar_evento": False}
    if "ajuda" in baixo:
        return {"resposta": "Posso criar eventos (\"agendar vôlei 02/10 às 16:00\") "
                            "e explicar como usar o Flow Agendas.", "criar_evento": False}

    if re.search(r"\b(marcar|agendar|adicionar|criar)\b", baixo):
        hora_m = re.search(r"\b(\d{1,2}):(\d{2})\b", texto)
        data_m = re.search(r"\b(\d{1,2}/\d{1,2}(?:/\d{4})?)\b", texto)
        hora = hora_m.group(0) if hora_m else ""
        data = data_m.group(0) if data_m else ""

        titulo = re.sub(r"\b(marcar|agendar|adicionar|criar|evento|às|as|dia)\b", "", texto,
                        flags=re.IGNORECASE)
        titulo = re.sub(r"\d{1,2}:\d{2}|\d{1,2}/\d{1,2}(?:/\d{4})?", "", titulo)
        titulo = re.sub(r"\s+", " ", titulo).strip(" -,.") or "Novo evento"

        salvar_evento(titulo, data, hora)
        return {"resposta": f"Pronto! Adicionei \"{titulo}\" na sua agenda.",
                "criar_evento": True, "titulo": titulo, "data": data, "hora": hora}

    return {"resposta": "Não entendi muito bem. Tente: \"marcar prova 30/09 às 14:00\".",
            "criar_evento": False}