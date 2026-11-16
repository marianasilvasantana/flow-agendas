from analise import (
    tarefas_totais, usuarios_cadastrados,
    tarefas_concluidas, categorias,
)
from analise_dashboard import Análise_Data

# Cada pergunta aponta para uma função da API que já existe.
CONSULTAS = {
    "Quantas tarefas foram colocadas na agenda?": tarefas_totais,
    "Quantos usuários diferentes se cadastraram?": usuarios_cadastrados,
    "Quantas tarefas diferentes foram concluidas?": tarefas_concluidas,
    "Quantas categorias tem?": categorias,
    "Quantas tarefas por data?": Análise_Data,
}

def encontrar_pergunta(texto):
    texto = texto.strip().casefold()
    for pergunta in CONSULTAS:
        if pergunta.casefold() == texto:
            return pergunta
    return None


def consultar(pergunta):
    # Os parênteses executam a função associada à pergunta.
    return CONSULTAS[pergunta]()