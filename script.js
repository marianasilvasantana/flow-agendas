document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item, .logout-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const targetTab = item.getAttribute('data-tab');
            if (!targetTab) return;

            // Remove a classe active de todos
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
    const card = event.currentTarget.closest('.wellness-card');

    const sleptAt = parseTime(prompt('Hora que dormiu (ex: 23:30):'));
    if (sleptAt === null) return alert('Horário inválido. Use o formato HH:MM.');

    const wokeAt = parseTime(prompt('Hora que acordou (ex: 06:45):'));
    if (wokeAt === null) return alert('Horário inválido. Use o formato HH:MM.');

    // Se acordou "antes" de dormir, passou da meia-noite
    let duration = wokeAt - sleptAt;
    if (duration <= 0) duration += 24 * 60;

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    updateRing(card, `${hours}h ${minutes}m`, (duration / goalSleepMin) * 100);
}

function registerWorkout() {
    const card = event.currentTarget.closest('.wellness-card');

    const minutes = Number(prompt('Quantos minutos de treino?'));
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return alert('Digite um número de minutos maior que zero.');
    }

    totalWorkoutMin += minutes;
    updateRing(card, `${totalWorkoutMin} min`, (totalWorkoutMin / goalWorkoutMin) * 100);
}

/* ============================================
   ESTUDO
   ============================================ */
function selectSubject(name, examTitle, examContent) {
    // 1. Atualiza o título e a notinha no painel direito
    document.getElementById('selected-subject-title').innerText = name;
    document.getElementById('exam-title').innerText = examTitle;
    document.getElementById('exam-content').innerText = examContent;

    // 2. Destaca o card clicado
    document.querySelectorAll('.course-card').forEach(card => card.classList.remove('active'));
    event.currentTarget.classList.add('active');
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

    // Carrega o que foi salvo (ou usa os padrões)
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
        status.textContent = dirty ? 'Alterações não salvas' : 'Alterações salvas';
        status.classList.toggle('unsaved', dirty);
    }

    function updateAvatarInitial() {
        if (avatar.style.backgroundImage) return;
        const nome = document.getElementById('set-nome').value.trim();
        avatar.textContent = nome ? nome[0].toUpperCase() : '?';
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            document.getElementById('panel-' + item.dataset.panel).classList.add('active');
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

    avatarInput.addEventListener('change', () => {
        const file = avatarInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            avatar.style.backgroundImage = `url(${reader.result})`;
            avatar.textContent = '';
        };
        reader.readAsDataURL(file);
    });

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

    // Função para adicionar balão de mensagem na conversa
    function adicionarBalao(texto, tipo) {
        const welcomeBlock = chatBody.querySelector('.chat-welcome');
        if (welcomeBlock) welcomeBlock.style.display = 'none';

        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `message ${tipo === 'usuario' ? 'user' : 'bot'}`;
        mensagemDiv.textContent = texto;

        chatBody.appendChild(mensagemDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Função para adicionar o card de evento na agenda
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

    // Função para enviar mensagem ao backend
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
            
            // Exibe a resposta de texto da Aya
            adicionarBalao(dados.resposta, 'bot');

            // Se a IA detetou intenção de evento, injeta na agenda!
            if (dados.criar_evento) {
                adicionarEventoNaAgenda(dados.titulo, dados.data, dados.hora);
            }

        } catch (erro) {
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