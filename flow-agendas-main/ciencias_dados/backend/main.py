"""Execute dentro de backend: python -m uvicorn main:app --reload."""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Importa as funções de análise das agendas
from analise import ler_dados, por_categoria, por_data, resumo

# 1. Instância do app criada PRIMEIRO
app = FastAPI(
    title="API - Flow Agendas",
    description="API de análise de dados de agendamentos e compromissos.",
)

# 2. Configuração do CORS para permitir a comunicação com o Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_methods=["GET"],
    allow_headers=["Content-Type"],
)


def carregar_dados():
    """Função utilitária para validar e carregar a base de dados."""
    try:
        return ler_dados()
    except (OSError, UnicodeError) as erro:
        raise FileNotFoundError("Não foi possível abrir database/agendas.csv.") from erro
    except (ValueError, KeyError) as erro:
        raise ValueError("Confira o cabeçalho, as colunas, as datas e os números do CSV.") from erro


# Tratadores globais de exceção conforme a estrutura solicitada
@app.exception_handler(FileNotFoundError)
async def arquivo_nao_encontrado(request: Request, erro: FileNotFoundError):
    return JSONResponse(
        status_code=503,
        content={"detail": str(erro)},
    )


@app.exception_handler(ValueError)
async def dados_invalidos(request: Request, erro: ValueError):
    return JSONResponse(
        status_code=422,
        content={"detail": str(erro)},
    )


# Rotas do Flow Agendas
@app.get("/")
def inicio():
    return {"mensagem": "Backend do Flow Agendas funcionando"}


@app.get("/analise/resumo")
def consultar_resumo():
    return resumo(carregar_dados())


@app.get("/analise/categorias")
def consultar_categorias():
    return por_categoria(carregar_dados())


@app.get("/analise/datas")
def consultar_datas():
    return por_data(carregar_dados())