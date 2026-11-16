import os
import json
import webbrowser
import threading
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import ollama

from controller.chat import router as chat_router
from analise import ler_dados, resumo, por_categoria, por_data
from controller.dashboard import router as dashboard_router
from controller.resumo import router as resumo_router

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
app.include_router(chat_router) # Adicionado aqui conforme o seu pedido anterior

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

@app.get("/chat/perguntas")
def listar_perguntas():
    return [
        "Qual o total de agendamentos?",
        "Quais são as categorias mais agendadas?",
        "Como está a evolução dos agendamentos por data?"
    ]

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
        categorias_calculadas = por_categoria(dados_do_csv)
        
        resumo_dados = {
            "total_geral": len(dados_do_csv) if hasattr(dados_do_csv, '__len__') else "Ver dashboard",
            "categorias": categorias_calculadas,
        }

        # B. A IA (Ollama) explica o resultado
        # Pega as variáveis que você definiu no terminal
        api_key = os.getenv("OLLAMA_API_KEY")
        modelo = os.getenv("OLLAMA_MODELO", "glm-5.3:cloud")

        if not api_key:
            raise ValueError("A variável OLLAMA_API_KEY não foi encontrada no ambiente.")

        # Configura o cliente do Ollama para a nuvem
        client = ollama.Client(
            host="https://ollama.com",
            headers={'Authorization': f'Bearer {api_key}'}
        )

        response = client.chat(
            model=modelo,
            messages=[
                {"role": "system", "content": PROMPT_SISTEMA},
                {"role": "user", "content": f"O utilizador perguntou: '{dados.pergunta}'. Os dados calculados foram: {resumo_dados}. Explique isso de forma curta."}
            ]
        )
        
        explicacao = response['message']['content']

        # C. Devolve no formato que o chat.js espera
        return {
            "resultado": resumo_dados,
            "explicacao": explicacao,
            "aviso": ""
        }
    except Exception as e:
        # Se a IA falhar, o Python ainda entrega os dados
        print(f"Erro no Ollama: {e}") # Ajuda a ver o erro no terminal
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
# CONFIGURAÇÃO PARA SERVIR O FRONTEND
# =====================================================================
if os.path.exists("../frontend"):
    app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

def abrir_navegador():
    webbrowser.open("http://127.0.0.1:8000")

@app.on_event("startup")
async def startup_event():
    threading.Timer(1.5, abrir_navegador).start()