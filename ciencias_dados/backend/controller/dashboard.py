from fastapi import APIRouter
from analise_dashboard import (
    total_tarefas, usuarios_cadastrados, analise_por_data, total_de_categorias,
    tarefas_por_dia, concluidas_por_dia, analise_por_categoria,
    tarefas_por_mes, concluidas_por_mes
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/cards")
def get_cards():
    return {"total_tarefas": total_tarefas(), "usuarios_cadastrados": usuarios_cadastrados(), "total_categorias": total_de_categorias()}

@router.get("/tarefas-por-dia")
def consultar_total_tarefas(): return tarefas_por_dia()

@router.get("/concluidas-por-dia")
def consultar_concluidas_por_dia(): return concluidas_por_dia()

@router.get("/tarefas-por-mes") # <-- NOVA ROTA MENSAL
def consultar_tarefas_por_mes(): return tarefas_por_mes()

@router.get("/concluidas-por-mes") # <-- NOVA ROTA MENSAL
def consultar_concluidas_por_mes(): return concluidas_por_mes()

@router.get("/analise-por-data")
def consultar_analise_por_data(): return analise_por_data()

@router.get("/analise-por-categoria")
def consultar_analise_por_categoria(): return analise_por_categoria()