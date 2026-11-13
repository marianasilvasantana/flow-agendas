"""Rotas que entregam dados de produtividade para os gráficos do Flow Agendas."""
from fastapi import APIRouter
from analise_dashboard import total_tarefas, usuarios_cadastrados, analise_por_data, total_de_categorias

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/tarefas-por-dia")
def consultar_total_tarefas():
    """Retorna a quantidade total de tarefas agendadas por dia."""
    return total_tarefas()


@router.get("/concluidas-por-dia")
def consultar_usuarios_cadastrados():
    """Retorna a quantidade de tarefas concluídas por dia."""
    return usuarios_cadastrados()

@router.get("/concluidas-por-dia")
def consultar_analise_por_data():
    """Retorna a quantidade de tarefas concluídas por dia."""
    return analise_por_data()

@router.get("/concluidas-por-dia")
def consultar_total_de_categorias():
    """Retorna a quantidade de tarefas concluídas por dia."""
    return total_de_categorias()