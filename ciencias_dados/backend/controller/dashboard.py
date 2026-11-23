"""Rotas que entregam dados para os futuros gráficos."""
from fastapi import APIRouter

from backend.analise_dashboard import tarefas_por_dia, pessoas_cadastradas_por_dia

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/tarefas-por-dia")
def consultar_tarefas_por_dia():
    """Quantas tarefas distintas ocorreram em cada dia?"""
    return tarefas_por_dia()


@router.get("/pessoas-cadastradas-por-dia")
def consultar_pessoas_cadastradas_por_dia():
    """Qual foi o total vendido em cada dia?"""
    return pessoas_cadastradas_por_dia()
