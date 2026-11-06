"""Rotas que entregam dados para os futuros gráficos."""
from fastapi import APIRouter

from analise_dashboard import compras_por_dia, faturamento_por_dia

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/compras-por-dia")
def consultar_compras_por_dia():
    """Quantas compras distintas ocorreram em cada dia?"""
    return compras_por_dia()


@router.get("/faturamento-por-dia")
def consultar_faturamento_por_dia():
    """Qual foi o total vendido em cada dia?"""
    return faturamento_por_dia()