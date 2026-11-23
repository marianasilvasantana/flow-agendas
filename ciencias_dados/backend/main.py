import sys
import os

# Pega o caminho absoluto da pasta atual (backend)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Pega o caminho absoluto da pasta pai (ciencias_dados)
PARENT_DIR = os.path.dirname(BASE_DIR)

# Adiciona a pasta pai (para achar 'backend.xxx')
sys.path.insert(0, PARENT_DIR)
# Adiciona a pasta atual 'backend' (para achar 'analise', 'controller', etc. diretamente)
sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.controller.resumo import router as resumo_router
from backend.controller.dashboard import router as dashboard_router

app = FastAPI(title="flowagendas API")

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
async def tratar_file_not_found(request, exc):
    return JSONResponse(status_code=503, content={"detail": str(exc)})
@app.exception_handler(ValueError)
async def tratar_value_error(request, exc):
    return JSONResponse(status_code=503, content={"detail": str(exc)})