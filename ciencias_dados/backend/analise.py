from pathlib import Path
import pandas as pd

CAMINHO_CSV = Path(__file__).resolve().parent.parent / 'database' / 'flow_agendas_com_usuarios.csv'

#print(df.head()) 
#print(df.columns)
#print(df.dtypes) 
#print(df.isna().sum())

def ler_dados():
    df = pd.read_csv(CAMINHO_CSV)
    
    colunas = [
        'id', 'nome_usuario', 'titulo', 'categoria', 'data',
        'horario_inicio', 'horario_fim', 'prioridade', 'status', 'descricao'
    ]
    if not set(colunas).issubset(df.columns):
        raise ValueError('Confira as colunas do CSV de tarefas.')
        
    df = df[colunas].copy()
    
    if df.empty or df.isna().any().any():
        raise ValueError('O CSV está vazio ou contém campos ausentes.')
        
    df['data'] = pd.to_datetime(df['data'], format='%Y-%m-%d', errors='raise')
    
    df['id'] = pd.to_numeric(df['id'], errors='raise')
    if (df['id'] <= 0).any():
        raise ValueError('Os identificadores devem ser inteiros positivos.')
        
    if df.duplicated().anyfrom():
        raise ValueError('Há linhas idênticas. Verifique a fonte antes de analisar.')
        
    return df

def resumo(df):
    return {
        'total_tarefas': int(len(df)),
        'total_usuarios': int(df['nome_usuario'].nunique()),
        'pendentes': int((df['status'] == 'Pendente').sum()),
        'concluidos': int((df['status'] == 'Concluido').sum()),
        'cancelados': int((df['status'] == 'Cancelado').sum()),
        'estudo': int((df['categoria'] == 'Estudo').sum()),
        'trabalho': int((df['categoria'] == 'Trabalho').sum()),
        'saude_pessoal': int((df['categoria'] == 'Pessoal/Saude').sum()),
        'data_inicial': df['data'].min().strftime('%Y-%m-%d'),
        'data_final': df['data'].max().strftime('%Y-%m-%d')
    }

def por_produto(df):
    return df['categoria'].value_counts().to_dict()

def por_data(df):
    return df.groupby(df['data'].dt.strftime('%Y-%m')).size().to_dict()
