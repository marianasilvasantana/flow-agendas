from pathlib import Path
import pandas as pd

CAMINHO_CSV = Path(__file__).resolve().parent.parent / "database" / "agendas.csv"


def ler_dados():
    if not CAMINHO_CSV.exists():
        raise FileNotFoundError(f"Arquivo não encontrado em: {CAMINHO_CSV}")

    df = pd.read_csv(CAMINHO_CSV)

    colunas = [
        "id",
        "nome_usuario",
        "titulo",
        "categoria",
        "data",
        "horario_inicio",
        "horario_fim",
        "prioridade",
        "status",
        "descricao",
    ]

    if not set(colunas).issubset(df.columns):
        raise ValueError(
            f"Colunas ausentes no CSV. Colunas esperadas: {colunas}"
        )

    df = df[colunas].copy()

    # Preenche descrições vazias com texto padrão em vez de lançar erro
    df["descricao"] = df["descricao"].fillna("")
    df["status"] = df["status"].fillna("Pendente")
    df["categoria"] = df["categoria"].fillna("Geral")

    # Garante a conversão correta de datas e IDs
    df["data"] = pd.to_datetime(df["data"], errors="coerce")
    df["id"] = pd.to_numeric(df["id"], errors="coerce")

    # Remove linhas inválidas que não possuem ID ou Data
    df = df.dropna(subset=["id", "data"])

    return df


def resumo(df):
    if df.empty:
        return {
            "total_tarefas": 0,
            "total_usuarios": 0,
            "pendentes": 0,
            "concluidos": 0,
            "cancelados": 0,
            "estudo": 0,
            "trabalho": 0,
            "saude_pessoal": 0,
            "data_inicial": "",
            "data_final": "",
        }

    return {
        "total_tarefas": int(len(df)),
        "total_usuarios": int(df["nome_usuario"].nunique()),
        "pendentes": int((df["status"].str.lower() == "pendente").sum()),
        "concluidos": int((df["status"].str.lower() == "concluido").sum())
        + int((df["status"].str.lower() == "concluído").sum()),
        "cancelados": int((df["status"].str.lower() == "cancelado").sum()),
        "estudo": int((df["categoria"].str.lower() == "estudo").sum()),
        "trabalho": int((df["categoria"].str.lower() == "trabalho").sum()),
        "saude_pessoal": int(
            df["categoria"]
            .str.lower()
            .isin(["pessoal/saude", "pessoal", "saúde", "saude"])
            .sum()
        ),
        "data_inicial": df["data"].min().strftime("%Y-%m-%d"),
        "data_final": df["data"].max().strftime("%Y-%m-%d"),
    }


def por_categoria(df):
    if df.empty:
        return []

    tabela = (
        df.groupby("categoria", as_index=False)
        .agg(
            total_tarefas=("id", "count"),
            concluidas=(
                "status",
                lambda x: int(x.str.lower().isin(["concluido", "concluído"]).sum()),
            ),
        )
    )
    tabela = tabela.sort_values("total_tarefas", ascending=False)
    return tabela.to_dict(orient="records")


def por_data(df):
    if df.empty:
        return []

    tabela = (
        df.groupby("data", as_index=False)
        .agg(
            total_tarefas=("id", "count"),
            concluidas=(
                "status",
                lambda x: int(x.str.lower().isin(["concluido", "concluído"]).sum()),
            ),
        )
    )
    tabela["data"] = tabela["data"].dt.strftime("%Y-%m-%d")
    return tabela.to_dict(orient="records")


if __name__ == "__main__":
    dados = ler_dados()
    print("Primeiras cinco tarefas:")
    print(dados.head())
    print("\nResumo:")
    print(resumo(dados))