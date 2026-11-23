const API_URL = "http://127.0.0.1:8000";
const ROTA_TAREFAS = "/tarefas"; 

const form = document.querySelector("#form-tarefa");
const codigo = document.querySelector("#id_tarefa");
const dataTarefa = document.querySelector("#data_tarefa");
const tituloTarefa = document.querySelector("#titulo_tarefa");
const statusTarefa = document.querySelector("#status_tarefa");
const mensagem = document.querySelector("#mensagem");
const lista = document.querySelector("#lista-tarefas");
const salvar = document.querySelector("#salvar");
const cancelar = document.querySelector("#cancelar");
const tituloForm = document.querySelector("#titulo-formulario");
let ocupado = false;

function mostrarMensagem(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.classList.toggle("erro", erro);
  mensagem.hidden = false;
}

function linhaDeAviso(texto) {
  lista.replaceChildren();
  const linha = document.createElement("tr");
  const celula = document.createElement("td");
  celula.colSpan = 5;
  celula.className = "vazio";
  celula.textContent = texto;
  linha.append(celula);
  lista.append(linha);
}

async function requisicao(caminho, opcoes = {}) {
  const resposta = await fetch(API_URL + caminho, opcoes);
  if (resposta.status === 204) return null;
  const dados = await resposta.json();
  if (!resposta.ok) {
    const detalhe = typeof dados.detail === "string"
      ? dados.detail : "Confira os campos e tente novamente.";
    throw new Error(detalhe);
  }
  return dados;
}

async function executar(acao) {
  if (ocupado) return;
  ocupado = true;
  document.querySelectorAll("input, select, button").forEach(el => el.disabled = true);
  
  try {
    await acao();
  } catch (erro) {
    mostrarMensagem(erro.message || "Não foi possível acessar a API.", true);
  } finally {
    ocupado = false;
    document.querySelectorAll("input, select, button").forEach(el => el.disabled = false);
  }
}

function limparFormulario() {
  form.reset();
  codigo.value = "";
  tituloForm.textContent = "Nova Tarefa";
  salvar.textContent = "Salvar Tarefa";
  cancelar.textContent = "Limpar";
}

function preencherTabela(tarefas) {
  linhaDeAviso("Nenhuma tarefa cadastrada.");
  if (!tarefas.length) return;
  lista.replaceChildren();
  
  tarefas.forEach(tarefa => {
    const linha = document.createElement("tr");
    const dataFormatada = tarefa.data ? tarefa.data.split("-").reverse().join("/") : "";
    
    [tarefa.id, dataFormatada, tarefa.titulo, tarefa.status].forEach(valor => {
      const celula = document.createElement("td");
      celula.textContent = valor || "-";
      linha.append(celula);
    });
    
    const acoes = document.createElement("td");
    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "botao botao-secundario";
    editar.textContent = "Editar";
    editar.addEventListener("click", () => {
      executar(() => editarTarefa(tarefa.id));
    });
    
    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "botao botao-secundario";
    excluir.textContent = "Excluir";
    excluir.addEventListener("click", () => {
      executar(() => excluirTarefa(tarefa));
    });
    
    acoes.append(editar, excluir);
    linha.append(acoes);
    lista.append(linha);
  });
}

async function carregarTarefas() {
  try {
    preencherTabela(await requisicao(ROTA_TAREFAS));
  } catch (erro) {
    linhaDeAviso("Não foi possível carregar as tarefas. Atualize a lista.");
    throw erro;
  }
}

async function editarTarefa(id) {
  const tarefa = await requisicao(`${ROTA_TAREFAS}/${id}`);
  codigo.value = tarefa.id;
  dataTarefa.value = tarefa.data;
  tituloTarefa.value = tarefa.titulo;
  statusTarefa.value = tarefa.status;
  
  tituloForm.textContent = `Editar Tarefa ${id}`;
  salvar.textContent = "Salvar alterações";
  cancelar.textContent = "Cancelar edição";
  mostrarMensagem("Edite os campos e clique em Salvar alterações.");
}

async function salvarTarefa() {
  const dados = {
    data: dataTarefa.value,
    titulo: tituloTarefa.value,
    status: statusTarefa.value
  };
  
  const id = codigo.value;
  const caminho = id ? `${ROTA_TAREFAS}/${id}` : ROTA_TAREFAS;
  
  await requisicao(caminho, {
    method: id ? "PUT" : "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(dados)
  });
  
  limparFormulario();
  await carregarTarefas();
  mostrarMensagem(id ? "Tarefa alterada com sucesso." : "Tarefa criada com sucesso.");
}

async function excluirTarefa(tarefa) {
  if (!window.confirm(`Excluir a tarefa "${tarefa.titulo}"?`)) return;
  await requisicao(`${ROTA_TAREFAS}/${tarefa.id}`, {method: "DELETE"});
  if (codigo.value === String(tarefa.id)) limparFormulario();
  await carregarTarefas();
  mostrarMensagem("Tarefa excluída com sucesso.");
}

form.addEventListener("submit", evento => {
  evento.preventDefault();
  if (!form.reportValidity()) return;
  executar(salvarTarefa);
});

cancelar.addEventListener("click", limparFormulario);

document.querySelector("#atualizar-lista").addEventListener("click", () => {
  executar(carregarTarefas);
});

// Inicia a tela
executar(carregarTarefas);