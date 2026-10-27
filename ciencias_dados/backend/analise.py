from pathlib import Path
import pandas as pd


CAMINHO_CSV = Path(__file__).resolve().parent.parent / 'database' / 'agendas.csv'

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
        
    if df.duplicated().any():
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

def por_categoria(df):
    tabela = df.groupby('categoria', as_index=False).agg(
        total_tarefas=('id', 'count'),
        concluidas=('status', lambda x: int((x == 'Concluido').sum()))
    )
    tabela = tabela.sort_values('total_tarefas', ascending=False)
    return tabela.to_dict(orient='records')

def por_data(df):
    tabela = df.groupby('data', as_index=False).agg(
        total_tarefas=('id', 'count'),
        concluidas=('status', lambda x: int((x == 'Concluido').sum()))
    )
    tabela['data'] = tabela['data'].dt.strftime('%Y-%m-%d')
    return tabela.to_dict(orient='records')

if __name__ == '__main__':
    dados = ler_dados()
    print('Primeiras cinco tarefas:')
    print(dados.head())
    print('\nResumo:')
    print(resumo(dados))
