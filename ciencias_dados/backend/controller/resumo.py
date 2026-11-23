"""Rotas de consulta. Os cálculos estão no arquivo analise.py."""
from fastapi import APIRouter
from backend.analise import ler_dados, resumo

router = APIRouter(prefix="/resumo", tags=["Resumo"])

@router.get("/geral")
def consultar_resumo_geral():
    """Retorna o resumo geral das tarefas."""
    return resumo(ler_dados())

@router.get("/tarefas")
def total_tarefas():
    """Quantas tarefas foram realizadas no período do CSV?"""
    dados = ler_dados()
    resultado = resumo(dados)
    return {"total_tarefas": resultado["total_tarefas"]}

@router.get("/usuarios")
def consultar_total_usuarios():
    """Quantos usuarios diferentes temos?"""
    dados = ler_dados()
    resultado = resumo(dados)
    return {"total_usuarios": resultado["total_usuarios"]}

@router.get("/data")
def consultar_total_data():
    """Quantas datas diferentes tem?"""
    dados = ler_dados()
    # Conta a quantidade de datas (dias) únicas no CSV
    return {"total_datas": int(dados["data"].nunique())}

@router.get("/categorias")
def total_categorias():
    """Quantas categorias tem no total?"""
    dados = ler_dados()
    # Conta a quantidade de categorias únicas no CSV
    return {"total_categorias": int(dados["categoria"].nunique())}