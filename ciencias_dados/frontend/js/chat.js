// 1. Localize na página os elementos do chat.
const API_CHAT = "http://127.0.0.1:8000";

// Elementos da nossa tela rosa
const form = document.querySelector("#chat-form");
const inputPergunta = document.querySelector("#chat-pergunta");
const botao = document.querySelector("#chat-enviar");
const statusChat = document.querySelector("#chat-status");
const caixaResposta = document.querySelector("#chat-dados");
const enunciado = document.querySelector("#chat-enunciado");
const lista = document.querySelector("#lista-dados");
const explicacao = document.querySelector("#chat-explicacao");
const aviso = document.querySelector("#chat-aviso");
const welcomeMsg = document.querySelector("#chat-welcome-msg");

// 2. Converta os formatos do CSV em linhas legíveis (ADAPTADO PARA O FLOW-AGENDAS).
function formatarResultado(dados) {
  if (!dados || Object.keys(dados).length === 0) return ["Sem dados para exibir."];

  if (Array.isArray(dados)) {
    return dados.length
      ? dados.map(item => (item.data || "") + ": " + (item.total_agendamentos || item.total || 0) + " agendamentos")
      : ["Não há agendamentos no período."];
  }

  const linhas = [];
  if ("total_agendamentos" in dados) linhas.push("Total de agendamentos: " + dados.total_agendamentos);
  if ("total_clientes" in dados) linhas.push("Clientes diferentes: " + dados.total_clientes);
  if ("total_servicos" in dados) linhas.push("Serviços diferentes: " + dados.total_servicos);
  if ("total_geral" in dados) linhas.push("Total geral: " + dados.total_geral);
  
  if (Array.isArray(dados.categorias)) {
    for (const item of dados.categorias) {
      const cat = item.categoria || item.status || "Categoria";
      const qtd = item.total || item.quantidade || 0;
      linhas.push(cat + ": " + qtd);
    }
  }

  if (Array.isArray(dados.por_status)) {
    for (const item of dados.por_status) {
      const st = (item.status || "").replaceAll("_", " ");
      linhas.push(st + ": " + item.total_agendamentos + " agendamentos");
    }
  }
  
  return linhas.length ? linhas : ["Adapte a tela ao formato desta consulta."];
}

// 3. Função principal que envia a pergunta (usada tanto pelo form quanto pelos botões)
async function enviarMensagem(pergunta) {
  if (!pergunta) return;

  // Esconde a mensagem de boas-vindas e a resposta antiga
  if (welcomeMsg) welcomeMsg.style.display = "none";
  if (caixaResposta) caixaResposta.style.display = "none";
  
  // Mostra status
  if (statusChat) statusChat.textContent = "A Aya está pensando…";
  if (botao) botao.disabled = true;

  try {
    const retorno = await fetch(API_CHAT + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pergunta: pergunta }), 
    });
    
    if (!retorno.ok) throw new Error("HTTP " + retorno.status);
    const dados = await retorno.json();

    // Preenche os dados
    if (enunciado) enunciado.textContent = pergunta;
    
    if (lista) {
      lista.replaceChildren();
      const linhasFormatadas = formatarResultado(dados.resultado || dados.dados);
      for (const linha of linhasFormatadas) {
        const p = document.createElement("p");
        p.textContent = "• " + linha;
        p.style.margin = "4px 0";
        lista.appendChild(p);
      }
    }
    
    if (explicacao) {
      explicacao.textContent = dados.explicacao || "Explicação indisponível.";
    }
    
    if (aviso) {
      aviso.textContent = dados.aviso || "";
      aviso.hidden = !dados.aviso;
    }
    
    // Mostra a caixa de resposta
    if (caixaResposta) caixaResposta.style.display = "block";
    if (statusChat) statusChat.textContent = ""; // limpa o status

  } catch (erro) {
    if (statusChat) statusChat.textContent = "A consulta falhou. Confira a API e tente novamente.";
    if (welcomeMsg) welcomeMsg.style.display = "block";
  } finally {
    if (botao) botao.disabled = false;
  }
}

// 4. Escuta o envio do formulário (apertar Enter ou clicar na setinha)
if (form) {
  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const pergunta = inputPergunta.value.trim();
    if (!pergunta) return;
    
    enviarMensagem(pergunta);
    inputPergunta.value = ""; // limpa a caixa de texto depois de enviar
  });
}

// 5. Função global para os botões de atalho (chips) da tela rosa
window.enviarPergunta = function(pergunta) {
  enviarMensagem(pergunta);
};