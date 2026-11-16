import json
import os
from urllib.request import Request, urlopen


def explicar(pergunta, resultado):
    chave = os.getenv("OLLAMA_API_KEY", "").strip()
    modelo = os.getenv("OLLAMA_MODELO", "").strip()
    if not chave or not modelo:
        raise RuntimeError("Configure OLLAMA_API_KEY e OLLAMA_MODELO.")

    instrucoes = (
        "Explique os dados em português em até duas frases. "
        "Use somente o resultado recebido. Não invente números "
        "nem sugira causas."
    )
    dados = {"pergunta": pergunta, "resultado": resultado}
    corpo = {
        "model": modelo,
        "stream": False,
        "messages": [
            {"role": "system", "content": instrucoes},
            {"role": "user", "content": json.dumps(dados, ensure_ascii=False)},
        ],
    }
    pedido = Request(
        "https://ollama.com/api/chat",
        data=json.dumps(corpo).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {chave}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urlopen(pedido, timeout=30) as resposta:
        texto = json.load(resposta)["message"]["content"]
        if not isinstance(texto, str) or not texto.strip():
            raise ValueError("O modelo não devolveu uma explicação.")
        return texto.strip()