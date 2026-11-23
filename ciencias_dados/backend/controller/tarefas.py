from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import os
import uuid

# Cria o roteador para as tarefas
router = APIRouter(prefix="/tarefas", tags=["Tarefas"])


CSV_PATH = "agendas.csv"

# Modelo de dados que o Front-end vai enviar
class TarefaCreate(BaseModel):
    data: str
    titulo: str
    status: str

class TarefaUpdate(BaseModel):
    data: str
    titulo: str
    status: str

def ler_dados():
    if not os.path.exists(CSV_PATH):
        
        colunas = ["id", "nome_usuario", "titulo", "categoria", "data", "horario_inicio", "horario_fim", "prioridade", "status", "descricao"]
        df = pd.DataFrame(columns=colunas)
        os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
        df.to_csv(CSV_PATH, index=False)
    return pd.read_csv(CSV_PATH, dtype=str).fillna("")

def salvar_dados(df):
    df.to_csv(CSV_PATH, index=False)


@router.get("")
def listar_tarefas():
    df = ler_dados()
    # Retorna apenas as colunas que o front-end precisa
    tarefas = df[["id", "data", "titulo", "status"]].to_dict(orient="records")
    return tarefas


@router.post("")
def criar_tarefa(tarefa: TarefaCreate):
    df = ler_dados()
    
    # Gera um ID automático (ex: t-1234)
    novo_id = f"t-{uuid.uuid4().hex[:4]}"
    
   
    nova_linha = {
        "id": novo_id,
        "nome_usuario": "Sistema", # Valor padrão
        "titulo": tarefa.titulo,
        "categoria": "Geral",      # Valor padrão
        "data": tarefa.data,
        "horario_inicio": "",      # Valor padrão
        "horario_fim": "",         # Valor padrão
        "prioridade": "Média",     # Valor padrão
        "status": tarefa.status,
        "descricao": ""
    }
    
    # Adiciona a nova linha ao DataFrame
    df = pd.concat([df, pd.DataFrame([nova_linha])], ignore_index=True)
    salvar_dados(df)
    
    return {"id": novo_id, **tarefa.dict()}


@router.put("/{id_tarefa}")
def editar_tarefa(id_tarefa: str, tarefa: TarefaUpdate):
    df = ler_dados()
    
    # Verifica se a tarefa existe
    if id_tarefa not in df["id"].values:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")
    
    # Atualiza os campos permitidos
    df.loc[df["id"] == id_tarefa, "titulo"] = tarefa.titulo
    df.loc[df["id"] == id_tarefa, "data"] = tarefa.data
    df.loc[df["id"] == id_tarefa, "status"] = tarefa.status
    
    salvar_dados(df)
    return {"mensagem": "Tarefa atualizada com sucesso."}


@router.delete("/{id_tarefa}")
def excluir_tarefa(id_tarefa: str):
    df = ler_dados()
    
    if id_tarefa not in df["id"].values:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")
    
    # Remove a linha onde o ID bate
    df = df[df["id"] != id_tarefa]
    salvar_dados(df)
    
    return {"mensagem": "Tarefa excluída com sucesso."}