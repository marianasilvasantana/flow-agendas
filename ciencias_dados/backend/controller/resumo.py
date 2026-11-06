"""Rotas de resumo do projeto."""
from fastapi import APIRouter

from analise import (
    GET raiz
    analise resumo
    analise categoria
    analise data
)

router = APIRouter(prefix="/resumo", tags=["Resumo"])


@router.get("/compras")
def consultar_compras():
    """Total de registros/agendamentos."""
    return {"total_compras": compras_total()}


@router.get("/clientes")
def consultar_clientes():
    """Total de usuários distintos."""
    return {"total_clientes": clientes_total()}


@router.get("/produtos")
def consultar_produtos():
    """Total de categorias distintas."""
    return {"total_produtos": produtos_total()}


@router.get("/pagamentos")
def consultar_pagamentos():
    """Total de registros por status."""
    return compras_por_pagamento()