import os
import json
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
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

# Configuração do Middleware de CORS para permitir requisições do Live Server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
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
        content={"detail": "Arquivo database/flow_agendas_com_usuarios.csv não encontrado."},
    )


@app.exception_handler(ValueError)
async def dados_invalidos(request: Request, erro: ValueError):
    return JSONResponse(
        status_code=503,
        content={"detail": f"Não foi possível analisar o CSV: {erro}"},
    )