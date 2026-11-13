import os
import json
import webbrowser
import threading
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # Importação necessária para o frontend
from pydantic import BaseModel
from groq import Groq

from analise import ler_dados, resumo, por_categoria, por_data
from controller.dashboard import router as dashboard_router
from controller.resumo import router as resumo_router

# Configuração da API Key da Groq
MINHA_CHAVE_GROQ = os.getenv("GROQ_API_KEY", "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")
os.environ["GROQ_API_KEY"] = MINHA_CHAVE_GROQ

app = FastAPI(
    title="Flow Agendas - API Principal",
    description="Backend do Flow Agendas com análise de dados e assistente Aya.",
    version="1.0.0"
)

# Configuração do Middleware de CORS (Liberado para evitar erros no frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registar os Routers da aplicação
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


# --- ROTA DO CHATBOT (AYA) ---
class Mensagem(BaseModel):
    texto: str

PROMPT_SISTEMA = """
você é a Aya, assistente virtual inteligente do 'Flow Agendas'.
Analisa a mensagem do utilizador para responder ou agendar tarefas.

Responde SEMPRE num objeto JSON válido com esta estrutura:
{
  "criar_evento": false,
  "resposta": "Sua resposta aqui."
}
"""

@app.post("/chat")
def responder_chat(msg: Mensagem):
    try:
        client = Groq(api_key=MINHA_CHAVE_GROQ)
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": PROMPT_SISTEMA},
                {"role": "user", "content": msg.texto}
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        return {"criar_evento": False, "resposta": f"Erro na API: {str(e)}"}


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
# CONFIGURAÇÃO PARA SERVIR O FRONTEND E ABRIR O NAVEGADOR AUTOMATICAMENTE
# =====================================================================

# Monta a pasta frontend na raiz (/) para que o http://127.0.0.1:8000 abra o resumo.html
# O "../" assume que o main.py está dentro da pasta 'backend'
if os.path.exists("../frontend"):
    app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

def abrir_navegador():
    webbrowser.open("http://127.0.0.1:8000")

@app.on_event("startup")
async def startup_event():
    # Abre o navegador 1.5 segundos após o servidor ligar
    threading.Timer(1.5, abrir_navegador).start()