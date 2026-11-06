"""Execute dentro de backend: python -m uvicorn main:app --reload."""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from controller.resumo import router as resumo_router
from controller.dashboard import router as dashboard_router

app = FastAPI(
    title="API- flow agendas",
    description="Consultar os dados apartir do CSV.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_methods=["GET"],
    allow_headers=["Content-Type"],
)

app.include_router(resumo_router)
app.include_router(dashboard_router)


@app.exception_handler(FileNotFoundError)
async def arquivo_nao_encontrado(request: Request, erro: FileNotFoundError):
    return JSONResponse(
        status_code=503,
        content={"detail": "Arquivo database/vendas.csv não encontrado."},
    )


@app.exception_handler(ValueError)
async def dados_invalidos(request: Request, erro: ValueError):
    return JSONResponse(
        status_code=503,
        content={"detail": f"Não foi possível analisar o CSV: {erro}"},
    )