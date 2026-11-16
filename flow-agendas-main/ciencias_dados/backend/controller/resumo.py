from fastapi import APIRouter
from analise import ler_dados, resumo

router = APIRouter(prefix="/resumo", tags=["Resumo"])

@router.get("/geral")
def consultar_resumo_geral():
    """Retorna o resumo geral das tarefas."""
    # A função 'resumo' já existe no seu arquivo analise.py
    return resumo(ler_dados())