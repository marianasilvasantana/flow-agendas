/* ============================================
   NAVEGAÇÃO ENTRE ABAS
   ============================================ */
   document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item, .logout-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const targetTab = item.getAttribute('data-tab');
            if (!targetTab) return;

            // Remove a classe active de todos os itens e abas
            menuItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Ativa o item clicado e a aba correspondente
            item.classList.add('active');

            const selectedSection = document.getElementById(targetTab);
            if (selectedSection) {
                selectedSection.classList.add('active');
            }
        });
    });
});

/* ============================================
   BEM-ESTAR
   ============================================ */
let totalWaterMl = 1200;
const goalWaterMl = 2000;

let totalWorkoutMin = 45;
const goalWorkoutMin = 60;

const goalSleepMin = 480; // 8h

// Atualiza o texto e o anel de progresso de um card
function updateRing(card, text, percent) {
    if (!card) return;
    const value = card.querySelector('.progress-value');
    const circle = card.querySelector('.progress-circle');
    if (value) value.innerText = text;
    if (circle) circle.style.setProperty('--percent', Math.min(percent, 100));
}

function addWater(amount) {
    totalWaterMl += amount;

    const waterText = document.getElementById('water-text');
    if (!waterText) return;

    const card = waterText.closest('.wellness-card');
    const percent = (totalWaterMl / goalWaterMl) * 100;

    updateRing(card, (totalWaterMl / 1000).toFixed(1) + 'L', percent);
}

// Converte "23:30" em minutos desde meia-noite (ou null se for inválido)
function parseTime(text) {
    const match = /^(\d{1,2}):(\d{2})$/.exec((text || '').trim());
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;

    return hours * 60 + minutes;
}

function registerSleep() {
    const card = window.event?.currentTarget?.closest('.wellness-card');

    const sleptAt = parseTime(prompt('Hora que dormiu (ex: 23:30):'));
    if (sleptAt === null) return alert('Horário inválido. Use o formato HH:MM.');

    const wokeAt = parseTime(prompt('Hora que acordou (ex: 06:45):'));
    if (wokeAt === null) return alert('Horário inválido. Use o formato HH:MM.');

    // Se acordou "antes" de dormir, passou da meia-noite
    let duration = wokeAt - sleptAt;
    if (duration <= 0) duration += 24 * 60;

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (card) {
        updateRing(card, `${hours}h ${minutes}m`, (duration / goalSleepMin) * 100);
    }
}

function registerWorkout() {
    const card = window.event?.currentTarget?.closest('.wellness-card');

    const minutes = Number(prompt('Quantos minutos de treino?'));
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return alert('Digite um número de minutos maior que zero.');
    }

    totalWorkoutMin += minutes;
    if (card) {
        updateRing(card, `${totalWorkoutMin} min`, (totalWorkoutMin / goalWorkoutMin) * 100);
    }
}

/* ============================================
   ESTUDO
   ============================================ */
function selectSubject(name, examTitle, examContent) {
    const titleElem = document.getElementById('selected-subject-title');
    const examTitleElem = document.getElementById('exam-title');
    const examContentElem = document.getElementById('exam-content');

    if (titleElem) titleElem.innerText = name;
    if (examTitleElem) examTitleElem.innerText = examTitle;
    if (examContentElem) examContentElem.innerText = examContent;

    document.querySelectorAll('.course-card').forEach(card => card.classList.remove('active'));
    if (window.event?.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }
}

/* ============================================
   CONFIGURAÇÕES
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'flow-agendas-config';

    const DEFAULTS = {
        nome: '',
        email: '',
        idioma: 'pt-BR',
        fuso: 'America/Sao_Paulo',
        sobre: '',
        notifEventos: true,
        notifEstudo: true,
        notifBemEstar: true,
        notifEmail: false,
        antecedencia: '15',
        perfilPublico: false,
        historicoChat: true,
        confirmarExclusao: true
    };

    const fields = document.querySelectorAll('[data-setting]');
    const navItems = document.querySelectorAll('.settings-nav-item');
    const panels = document.querySelectorAll('.settings-panel');
    const btnSave = document.getElementById('btn-save');
    const btnCancel = document.getElementById('btn-cancel');
    const btnRestore = document.getElementById('btn-restore');
    const status = document.getElementById('save-status');
    const avatar = document.getElementById('avatar');
    const avatarInput = document.getElementById('avatar-input');

    if (!btnSave) return;

    function loadSaved() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return { ...DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
        } catch {
            return { ...DEFAULTS };
        }
    }

    let saved = loadSaved();

    function readForm() {
        const values = {};
        fields.forEach(field => {
            const key = field.dataset.setting;
            values[key] = field.type === 'checkbox' ? field.checked : field.value.trim();
        });
        return values;
    }

    function writeForm(values) {
        fields.forEach(field => {
            const value = values[field.dataset.setting];
            if (field.type === 'checkbox') field.checked = Boolean(value);
            else field.value = value ?? '';
        });
        updateAvatarInitial();
    }

    function isDirty() {
        return JSON.stringify(readForm()) !== JSON.stringify({ ...saved, ...normalize(saved) });
    }

    function normalize(values) {
        const out = {};
        Object.keys(values).forEach(key => {
            out[key] = typeof values[key] === 'string' ? values[key].trim() : values[key];
        });
        return out;
    }

    function refreshStatus() {
        const dirty = isDirty();
        btnSave.disabled = !dirty;
        if (status) {
            status.textContent = dirty ? 'Alterações não salvas' : 'Alterações salvas';
            status.classList.toggle('unsaved', dirty);
        }
    }

    function updateAvatarInitial() {
        if (!avatar || avatar.style.backgroundImage) return;
        const setNomeElem = document.getElementById('set-nome');
        const nome = setNomeElem ? setNomeElem.value.trim() : '';
        avatar.textContent = nome ? nome[0].toUpperCase() : '?';
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            const targetPanel = document.getElementById('panel-' + item.dataset.panel);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    fields.forEach(field => {
        field.addEventListener('input', () => {
            updateAvatarInitial();
            refreshStatus();
        });
        field.addEventListener('change', refreshStatus);
    });

    btnSave.addEventListener('click', () => {
        const values = readForm();
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
        } catch {
            alert('Não foi possível salvar neste navegador.');
            return;
        }
        saved = values;
        refreshStatus();
    });

    btnCancel.addEventListener('click', () => {
        writeForm(saved);
        refreshStatus();
    });

    btnRestore.addEventListener('click', () => {
        if (!confirm('Restaurar todas as configurações para o padrão?')) return;
        writeForm(DEFAULTS);
        refreshStatus();
    });

    if (avatarInput) {
        avatarInput.addEventListener('change', () => {
            const file = avatarInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                if (avatar) {
                    avatar.style.backgroundImage = `url(${reader.result})`;
                    avatar.textContent = '';
                }
            };
            reader.readAsDataURL(file);
        });
    }

    writeForm(saved);
    refreshStatus();
});

/* ============================================
   LÓGICA DO CHATBOT (AYA) & CRIAÇÃO DE EVENTOS
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.querySelector('.chat-input input');
    const sendBtn = document.querySelector('.chat-send');
    const chatBody = document.querySelector('.chat-body');
    const chatChips = document.querySelectorAll('.chat-chip');

    if (!chatInput || !sendBtn || !chatBody) return;

    function adicionarBalao(texto, tipo) {
        const welcomeBlock = chatBody.querySelector('.chat-welcome');
        if (welcomeBlock) welcomeBlock.style.display = 'none';

        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `message ${tipo === 'usuario' ? 'user' : 'bot'}`;
        mensagemDiv.textContent = texto;

        chatBody.appendChild(mensagemDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function adicionarEventoNaAgenda(titulo, data, hora) {
        const calendarGrid = document.querySelector('.calendar-grid');
        if (!calendarGrid) return;

        const novoCard = document.createElement('div');
        novoCard.className = 'card purple';
        novoCard.innerHTML = `
            <span class="card-tag">${titulo}</span>
            <span class="card-time">${hora || 'Dia todo'} (${data || 'Em breve'})</span>
        `;

        const colunaDia = calendarGrid.querySelector('.calendar-day-col') || calendarGrid;
        colunaDia.appendChild(novoCard);
    }

    async function enviarMensagem(texto) {
        const mensagemUsuario = texto || chatInput.value.trim();
        if (!mensagemUsuario) return;

        adicionarBalao(mensagemUsuario, 'usuario');
        if (!texto) chatInput.value = '';

        try {
            const resposta = await fetch('http://127.0.0.1:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto: mensagemUsuario })
            });

            if (!resposta.ok) throw new Error('Erro na conexão');

            const dados = await resposta.json();
            
            adicionarBalao(dados.resposta, 'bot');

            if (dados.criar_evento) {
                adicionarEventoNaAgenda(dados.titulo, dados.data, dados.hora);
            }

        } catch {
            adicionarBalao('Desculpe, estou com dificuldades de conexão com o servidor.', 'bot');
        }
    }

    sendBtn.addEventListener('click', () => enviarMensagem());

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            enviarMensagem();
        }
    });

    chatChips.forEach(chip => {
        chip.addEventListener('click', () => {
            enviarMensagem(chip.textContent);
        });
    });
});

/* ============================================
   RESUMO DE INTELIGÊNCIA DE DADOS (API / CSV)
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:8000';

    const totalCompras = document.querySelector('#total-compras');
    const totalClientes = document.querySelector('#total-clientes');
    const totalProdutos = document.querySelector('#total-produtos');
    const listaPagamentos = document.querySelector('#lista-pagamentos');
    const listaDatas = document.querySelector('#lista-datas');
    const totalPagamentos = document.querySelector('#total-pagamentos');
    const botaoAtualizar = document.querySelector('#botao-atualizar');
    const mensagem = document.querySelector('#mensagem');
    const atualizacao = document.querySelector('#atualizacao');
    const resumo = document.querySelector('#resumo');

    if (!botaoAtualizar) return;

    const nomesCategorias = {
        agendado: 'Agendado',
        concluido: 'Concluído',
        cancelado: 'Cancelado',
        em_andamento: 'Em Andamento',
        dinheiro: 'Dinheiro',
        pix: 'Pix',
        cartao_debito: 'Cartão de débito',
        cartao_credito: 'Cartão de crédito',
        fiado: 'Fiado'
    };

    function numero(valor) {
        return (valor || 0).toLocaleString('pt-BR');
    }

    function mostrarMensagem(texto, erro = false) {
        if (!mensagem) return;
        mensagem.textContent = texto;
        mensagem.className = erro ? 'mensagem erro' : 'mensagem';
        mensagem.hidden = false;
    }

    function estadoTabela(texto) {
        if (listaPagamentos) {
            listaPagamentos.replaceChildren();
            const linha = listaPagamentos.insertRow();
            const celula = linha.insertCell();
            celula.colSpan = 2;
            celula.style.textAlign = 'center';
            celula.style.padding = '20px';
            celula.style.color = '#636366';
            celula.textContent = texto;
        }

        if (listaDatas) {
            listaDatas.replaceChildren();
            const linha = listaDatas.insertRow();
            const celula = linha.insertCell();
            celula.colSpan = 4;
            celula.style.textAlign = 'center';
            celula.style.padding = '20px';
            celula.style.color = '#636366';
            celula.textContent = texto;
        }
    }

    function limparTotais() {
        if (totalCompras) totalCompras.textContent = '—';
        if (totalClientes) totalClientes.textContent = '—';
        if (totalProdutos) totalProdutos.textContent = '—';
        if (totalPagamentos) totalPagamentos.textContent = '—';
    }

    async function consultar(caminho) {
        let resposta;
        try {
            resposta = await fetch(API_URL + caminho);
        } catch {
            throw new Error('Não foi possível acessar a API. Confira se o backend FastAPI está ligado.');
        }
        const dados = await resposta.json();
        if (!resposta.ok) {
            const detalhe = typeof dados.detail === 'string' ? dados.detail : 'Falha na consulta.';
            throw new Error(detalhe);
        }
        return dados;
    }

    function exibirCategorias(dados) {
        if (!listaPagamentos) return;
        listaPagamentos.replaceChildren();

        const lista = dados.por_forma_pagamento || dados.categorias || [];

        for (const item of lista) {
            const linha = listaPagamentos.insertRow();
            const chave = item.forma_pagamento || item.categoria || item.status;

            const celulaNome = linha.insertCell();
            celulaNome.style.padding = '12px';
            celulaNome.textContent = nomesCategorias[chave] || chave;

            const celulaQtd = linha.insertCell();
            celulaQtd.style.padding = '12px';
            celulaQtd.style.textAlign = 'right';
            const valorQtd = item.total_compras ?? item.quantidade ?? 0;
            celulaQtd.textContent = numero(valorQtd);
        }

        if (lista.length === 0) {
            estadoTabela('Nenhum dado encontrado para exibição.');
        }

        if (totalPagamentos) {
            totalPagamentos.textContent = numero(dados.total_compras || dados.total_geral || 0);
        }
    }

    function exibirTabelaDatas(dados) {
        if (!listaDatas) return;
        listaDatas.replaceChildren();

        const datas = dados.por_data || dados.datas || [];

        for (const item of datas) {
            const linha = listaDatas.insertRow();

            const celData = linha.insertCell();
            celData.style.padding = '12px';
            celData.textContent = item.data || item.dia || '—';

            const celPend = linha.insertCell();
            celPend.style.padding = '12px';
            celPend.style.textAlign = 'right';
            celPend.textContent = numero(item.pendentes || 0);

            const celConc = linha.insertCell();
            celConc.style.padding = '12px';
            celConc.style.textAlign = 'right';
            celConc.textContent = numero(item.concluidas || 0);

            const celTotal = linha.insertCell();
            celTotal.style.padding = '12px';
            celTotal.style.textAlign = 'right';
            celTotal.textContent = numero(item.total || (item.pendentes + item.concluidas) || 0);
        }

        if (datas.length === 0) {
            const linha = listaDatas.insertRow();
            const celula = linha.insertCell();
            celula.colSpan = 4;
            celula.style.textAlign = 'center';
            celula.style.padding = '20px';
            celula.style.color = '#636366';
            celula.textContent = 'Nenhum registro por data no período.';
        }
    }

    async function carregarResumo() {
        botaoAtualizar.disabled = true;
        botaoAtualizar.textContent = 'Carregando...';
        if (resumo) resumo.setAttribute('aria-busy', 'true');
        if (mensagem) mensagem.hidden = true;
        if (atualizacao) atualizacao.textContent = 'Consultando a API...';

        limparTotais();
        estadoTabela('Carregando os dados do relatório...');

        try {
            const dados = await consultar('/analise/resumo');

            if (totalCompras) totalCompras.textContent = numero(dados.total_compras || dados.total_agendamentos || 0);
            if (totalClientes) totalClientes.textContent = numero(dados.total_clientes || 0);
            if (totalProdutos) totalProdutos.textContent = numero(dados.total_produtos || dados.total_categorias || 0);

            exibirCategorias(dados);
            exibirTabelaDatas(dados);

            if (atualizacao) atualizacao.textContent = 'Última consulta: ' + new Date().toLocaleString('pt-BR');
            mostrarMensagem('Dados atualizados com sucesso a partir da API!');
        } catch (erro) {
            limparTotais();
            estadoTabela('Dados indisponíveis. Verifique se o backend está ligado.');
            if (atualizacao) atualizacao.textContent = 'A consulta não foi concluída.';
            mostrarMensagem(erro.message, true);
        } finally {
            botaoAtualizar.disabled = false;
            botaoAtualizar.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Atualizar dados';
            if (resumo) resumo.setAttribute('aria-busy', 'false');
        }
    }

    botaoAtualizar.addEventListener('click', carregarResumo);
    carregarResumo();
});FastAPI