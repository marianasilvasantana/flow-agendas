// A FastAPI calcula; o frontend apresenta os resultados e os gráficos.
const API_URL = "http://127.0.0.1:8000";

const painel = document.querySelector("#dashboard");
const botao = document.querySelector("#botao-atualizar");
const mensagem = document.querySelector("#mensagem");
const periodo = document.querySelector("#periodo");
const atualizacao = document.querySelector("#atualizacao");
const areaGraficos = document.querySelector("#graficos");
const avisoGraficos = document.querySelector("#aviso-graficos");
const listaCategorias = document.querySelector("#lista-categorias");
const listaDias = document.querySelector("#lista-dias");

let graficos = [];

const nomesCategorias = {
  estudo: "Estudo",
  trabalho: "Trabalho",
  pessoal: "Pessoal",
  saude: "Saúde",
  outros: "Outros"
};

function numero(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR");
}

function dataBrasil(valor) {
  if (!valor || typeof valor !== "string") return valor;
  return valor.split("-").reverse().join("/");
}

function mostrarMensagem(texto, erro = false) {
  if (!mensagem) return;
  mensagem.textContent = texto;
  mensagem.classList.toggle("erro", erro);
  mensagem.hidden = !texto;
}

function limparTela() {
  graficos.forEach((grafico) => {
    if (grafico) grafico.destroy();
  });
  graficos = [];
  if (areaGraficos) areaGraficos.hidden = true;
  ["total-tarefas", "total-usuarios", "total-concluidas"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "—";
  });
  if (listaCategorias) listaCategorias.replaceChildren();
  if (listaDias) listaDias.replaceChildren();
}

async function consultar(caminho) {
  const resposta = await fetch(API_URL + caminho);
  const dados = await resposta.json();
  if (!resposta.ok) {
    const textoErro = typeof dados.detail === "string" ? dados.detail : "A API recusou a consulta.";
    throw new Error(textoErro);
  }
  return dados;
}

function conferirDados(resumo, categorias, tarefasDias, concluidasDias) {
  const totais = [
    resumo.total_tarefas,
    resumo.total_usuarios,
    resumo.tarefas_concluidas
  ];

  const contagemValida = (valor) => Number.isInteger(valor) && valor >= 0;

  if (
    !totais.every(contagemValida) ||
    !Array.isArray(categorias) ||
    !Array.isArray(tarefasDias) ||
    !Array.isArray(concluidasDias)
  ) {
    throw new Error("Resposta fora do contrato. Confira o Swagger da API.");
  }

  let somaCategorias = 0;
  categorias.forEach((item) => {
    if (
      typeof item.categoria !== "string" ||
      !contagemValida(item.total_tarefas)
    ) {
      throw new Error("Categoria inválida na resposta.");
    }
    somaCategorias += item.total_tarefas;
  });

  if (tarefasDias.length !== concluidasDias.length) {
    throw new Error("As consultas por dia possuem datas diferentes.");
  }

  let somaDias = 0;
  tarefasDias.forEach((item, indice) => {
    const itemConcluidas = concluidasDias[indice];
    if (
      typeof item.data !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.data) ||
      itemConcluidas.data !== item.data ||
      !contagemValida(item.total_tarefas) ||
      !contagemValida(itemConcluidas.tarefas_concluidas) ||
      (indice > 0 && tarefasDias[indice - 1].data >= item.data)
    ) {
      throw new Error("Datas ou valores inválidos nas séries.");
    }
    somaDias += item.total_tarefas;
  });

  if (somaDias !== resumo.total_tarefas || somaCategorias !== resumo.total_tarefas) {
    throw new Error("Os totais não coincidem. Confira o CSV e atualize.");
  }
}

function adicionarLinha(tabela, valores) {
  if (!tabela) return;
  const linha = tabela.insertRow();
  valores.forEach((valor) => {
    linha.insertCell().textContent = valor;
  });
}

function mostrarDados(resumo, categorias, tarefasDias, concluidasDias) {
  document.querySelector("#total-tarefas").textContent = numero(resumo.total_tarefas);
  document.querySelector("#total-usuarios").textContent = numero(resumo.total_usuarios);
  document.querySelector("#total-concluidas").textContent = numero(resumo.tarefas_concluidas);

  categorias.forEach((item) => {
    adicionarLinha(listaCategorias, [
      nomesCategorias[item.categoria?.toLowerCase()] || item.categoria,
      numero(item.total_tarefas)
    ]);
  });

  tarefasDias.forEach((item, indice) => {
    adicionarLinha(listaDias, [
      dataBrasil(item.data),
      numero(item.total_tarefas),
      numero(concluidasDias[indice].tarefas_concluidas)
    ]);
  });

  if (tarefasDias.length) {
    periodo.textContent =
      "Período do CSV: " +
      dataBrasil(tarefasDias[0].data) +
      " a " +
      dataBrasil(tarefasDias[tarefasDias.length - 1].data);
  } else {
    periodo.textContent = "CSV sem tarefas registradas.";
    adicionarLinha(listaDias, ["Sem registros", "—", "—"]);
  }
  atualizacao.textContent = "Última consulta: " + new Date().toLocaleString("pt-BR");
}

function criarGrafico(id, tipo, rotulos, valores, tituloEixo, horizontal = false) {
  const linhaTempo = tipo === "line";
  const escalaNumerica = {
    beginAtZero: true,
    title: { display: true, text: tituloEixo },
    ticks: { precision: 0 }
  };

  const grafico = new Chart(document.getElementById(id), {
    type: tipo,
    data: {
      labels: rotulos,
      datasets: [{
        label: tituloEixo,
        data: valores,
        backgroundColor: linhaTempo ? "#E25C84" : "#4f46e5",
        borderColor: linhaTempo ? "#10b981" : "#4338ca",
        borderWidth: 2,
        tension: 0.3,
        fill: linhaTempo
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: horizontal ? "y" : "x",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (contexto) => `${numero(contexto.raw)} tarefas`
          }
        }
      },
      scales: horizontal ? { x: escalaNumerica } : { y: escalaNumerica }
    }
  });
  graficos.push(grafico);
}

function desenharGraficos(categorias, tarefasDias, concluidasDias) {
  areaGraficos.hidden = false;

  // 1. Gráfico por Categoria (Barras horizontais)
  criarGrafico(
    "grafico-categorias",
    "bar",
    categorias.map((item) => nomesCategorias[item.categoria?.toLowerCase()] || item.categoria),
    categorias.map((item) => item.total_tarefas),
    "Tarefas",
    true
  );

  // 2. Gráfico de Tarefas por Dia (Barras verticais)
  criarGrafico(
    "grafico-compras", // Mapeado para a segunda área de gráfico do HTML (grafico-tarefas)
    "bar",
    tarefasDias.map((item) => dataBrasil(item.data)),
    tarefasDias.map((item) => item.total_tarefas),
    "Tarefas Agendadas"
  );

  // 3. Gráfico de Concluídas por Dia (Linha temporal)
  criarGrafico(
    "grafico-faturamento", // Mapeado para a área de gráfico de evolução (grafico-concluidas)
    "line",
    concluidasDias.map((item) => dataBrasil(item.data)),
    concluidasDias.map((item) => item.tarefas_concluidas),
    "Tarefas Concluídas"
  );
}

async function carregarDashboard() {
  if (botao.disabled) return;
  botao.disabled = true;
  botao.textContent = "Carregando...";
  painel.setAttribute("aria-busy", "true");
  mostrarMensagem("");
  limparTela();

  periodo.textContent = "Consultando o período...";
  atualizacao.textContent = "Consultando as rotas da API...";
  avisoGraficos.textContent = "Aguardando os dados dos gráficos.";

  try {
    const dados = await Promise.all([
      consultar("/analise/resumo"),
      consultar("/analise/categorias"),
      consultar("/dashboard/tarefas-por-dia"),
      consultar("/dashboard/concluidas-por-dia")
    ]);

    conferirDados(dados[0], dados[1], dados[2], dados[3]);
    mostrarDados(dados[0], dados[1], dados[2], dados[3]);

    if (dados[0].total_tarefas === 0) {
      avisoGraficos.textContent = "Não há tarefas para desenhar gráficos.";
    } else if (typeof Chart !== "function") {
      avisoGraficos.textContent = "Gráficos indisponíveis. Consulte as tabelas.";
      mostrarMensagem("Dados carregados. Confira o arquivo local Chart.js.", true);
      return;
    } else {
      desenharGraficos(dados[1], dados[2], dados[3]);
      avisoGraficos.textContent = "Passe o ponteiro pelos gráficos ou confira as tabelas.";
    }

    mostrarMensagem("Dados atualizados e contagens conferidas.");
  } catch (erro) {
    limparTela();
    periodo.textContent = "Período indisponível.";
    atualizacao.textContent = "A consulta não foi concluída.";
    avisoGraficos.textContent = "Dados indisponíveis. Falha não significa ausência de tarefas.";
    mostrarMensagem(erro.message + " Confira a API, a URL e o CORS.", true);
  } finally {
    botao.disabled = false;
    botao.textContent = "Atualizar dados";
    painel.setAttribute("aria-busy", "false");
  }
}

botao.addEventListener("click", carregarDashboard);
document.addEventListener("DOMContentLoaded", carregarDashboard);