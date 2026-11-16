from urllib.error import HTTPError

from fastapi import APIRouter
from pydantic import BaseModel, Field

from chat_dados import CONSULTAS, consultar, encontrar_pergunta
from ollama_cloud import explicar

router = APIRouter(prefix="/chat", tags=["Chat"])


class EntradaChat(BaseModel):
    pergunta: str = Field(min_length=1, max_length=300)


@router.get("/perguntas")
def listar_perguntas():
    return list(CONSULTAS)


@router.post("")
def responder(entrada: EntradaChat):
    pergunta = encontrar_pergunta(entrada.pergunta)
    if pergunta is None:
        return {
            "resultado": None, "explicacao": None,
            "aviso": "Escolha uma pergunta da lista em /chat/perguntas.",
        }

    resultado = consultar(pergunta)
    explicacao, aviso = None, None
    try:
        explicacao = explicar(pergunta, resultado)
    except RuntimeError as erro:
        aviso = str(erro)
    except HTTPError as erro:
        aviso = f"Ollama Cloud retornou HTTP {erro.code}."
    except (OSError, ValueError, KeyError, TypeError):
        aviso = "Não foi possível obter a explicação do Ollama Cloud."

    return {
        "resultado": resultado, "explicacao": explicacao, "aviso": aviso,
    }
