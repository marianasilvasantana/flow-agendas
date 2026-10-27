from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from analise import ler_dados, por_categoria, por_data, resumo

app = FastAPI(title='API- Flow Agendas')

# Permite que o frontend (outra origem) consuma a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],  
    allow_credentials=True,
    allow_methods=['GET'],
    allow_headers=['*'],
)


def carregar_dados():
    try:
        return ler_dados()
    except (OSError, UnicodeError) as erro:
        raise HTTPException(
            status_code=503,
            detail='Não foi possível abrir database/agendas.csv.',
        ) from erro
    except (ValueError, KeyError) as erro:
        raise HTTPException(
            status_code=422,
            detail='Confira o cabeçalho, as colunas, as datas e os números do CSV.',
        ) from erro


@app.get('/')
def inicio():
    return {'mensagem': 'Backend do Flow Agendas funcionando'}


@app.get('/analise/resumo')
def consultar_resumo():
    return resumo(carregar_dados())


@app.get('/analise/categorias')
def consultar_categorias():
    return por_categoria(carregar_dados())


@app.get('/analise/datas')
def consultar_datas():
    return por_data(carregar_dados())