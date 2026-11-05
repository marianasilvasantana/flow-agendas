"""Rotas que entregam dados das tarefas para os gráficos do Flow Agendas."""
from fastapi import APIRouter

from analise_dashboard import tarefas_por_categoria, tarefas_por_dia

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/tarefas-por-dia")
def consultar_tarefas_por_dia():
    """Retorna a quantidade de tarefas pendentes, concluídas e canceladas agrupadas por dia."""
    return tarefas_por_dia()


@router.get("/tarefas-por-categoria")
def consultar_tarefas_por_categoria():
    """Retorna o total de tarefas distintas agrupadas por categoria."""
    return tarefas_por_categoria()