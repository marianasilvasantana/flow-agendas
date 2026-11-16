import os
import json
import webbrowser
import threading
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from groq import Groq

from analise import ler_dados, resumo, por_categoria, por_data
from controller.dashboard import router as dashboard_router
from controller.resumo import router as resumo_router

# Configuração da API Key da Groq
MINHA_CHAVE_GROQ = os.getenv("GROQ_API_KEY",chave aqui")
os.environ["GROQ_API_KEY"] = MINHA_CHAVE_GROQ

app = FastAPI(
    title="Flow Agendas - API Principal",
    description="Backend do Flow Agendas com análise de dados e assistente Aya.",
    version="1.0.0"
)

# Configuração do Middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000"
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# Registar os Routers
app.include_router(resumo_router)
app.include_router(dashboard_router)

# --- ROTAS DE ANÁLISE DIRETA ---
@app.get("/analise/resumo")
def consultar_resumo():
    return resumo(ler_dados())

@app.get("/analise/categorias")
def consultar_categorias():
    return por_categoria(ler_dados())

@app.get("/analise/datas")
def consultar_datas():
    return por_data(ler_dados())


# =====================================================================
# ROTAS DO CHAT DA AYA
# =====================================================================

# 1. Rota para o chat.js buscar as perguntas (mesmo que a tela rosa não use, mantemos por segurança)
@app.get("/chat/perguntas")
def listar_perguntas():
    return [
        "Qual o total de agendamentos?",
        "Quais são as categorias mais agendadas?",
        "Como está a evolução dos agendamentos por data?"
    ]

# 2. Modelo para receber a pergunta do chat.js
class Pergunta(BaseModel):
    pergunta: str

PROMPT_SISTEMA = """
Você é a Aya, assistente virtual inteligente do 'Flow Agendas'.
Sua tarefa é explicar de forma simples e amigável os dados de agendamentos que o sistema Python calculou.
"""

@app.post("/chat")
def responder_chat(dados: Pergunta):
    try:
        # A. O Python calcula os dados do CSV
        dados_do_csv = ler_dados()
        
        # Pega as categorias calculadas pelo Python
        categorias_calculadas = por_categoria(dados_do_csv)
        
        # Faz um resumo simples para mandar para a IA
        resumo_dados = {
            "total_geral": len(dados_do_csv) if hasattr(dados_do_csv, '__len__') else "Ver dashboard",
            "categorias": categorias_calculadas,
        }

        # B. A IA explica o resultado
        client = Groq(api_key=MINHA_CHAVE_GROQ)
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": PROMPT_SISTEMA},
                {"role": "user", "content": f"O utilizador perguntou: '{dados.pergunta}'. Os dados calculados foram: {resumo_dados}. Explique isso de forma curta."}
            ],
            temperature=0.2,
        )
        explicacao = completion.choices[0].message.content

        # C. Devolve no formato que o chat.js espera
        return {
            "resultado": resumo_dados,
            "explicacao": explicacao,
            "aviso": ""
        }
    except Exception as e:
        # Se a IA falhar, o Python ainda entrega os dados
        return {
            "resultado": {"total_geral": "Consultar dashboard", "categorias": []},
            "explicacao": "A IA está indisponível no momento. Mas os dados do sistema continuam funcionando.",
            "aviso": f"Aviso do sistema: {str(e)}"
        }

# --- TRATAMENTO DE EXCEÇÕES ---
@app.exception_handler(FileNotFoundError)
async def arquivo_nao_encontrado(request: Request, erro: FileNotFoundError):
    return JSONResponse(
        status_code=503,
        content={"detail": "Arquivo CSV não encontrado. Verifique o caminho no analise.py."},
    )

@app.exception_handler(ValueError)
async def dados_invalidos(request: Request, erro: ValueError):
    return JSONResponse(
        status_code=503,
        content={"detail": f"Não foi possível analisar o CSV: {erro}"},
    )

# =====================================================================
# CONFIGURAÇÃO PARA SERVIR O FRONTEND (DEVE SER A ÚLTIMA COISA)
# =====================================================================
if os.path.exists("../frontend"):
    app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

def abrir_navegador():
    # ALTERADO AQUI: Agora abre a raiz do site (tela rosa) em vez do chat.html
    webbrowser.open("http://127.0.0.1:8000")

@app.on_event("startup")
async def startup_event():
    threading.Timer(1.5, abrir_navegador).start()