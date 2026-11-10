document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. NAVEGAÇÃO ENTRE AS ABAS
    // ==========================================
    const menuItems = document.querySelectorAll('.menu-item, .logout-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute('data-tab');
            if (!targetTab) return;
            
            menuItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            item.classList.add('active');
            const selectedSection = document.getElementById(targetTab);
            if (selectedSection) selectedSection.classList.add('active');
        });
    });

    // ==========================================
    // 2. BEM-ESTAR (Água, Sono, Treino)
    // ==========================================
    window.addWater = function(amount) {
        const waterText = document.getElementById('water-text');
        if (!waterText) return;
        let current = parseFloat(waterText.innerText) || 1.2;
        current += amount / 1000;
        waterText.innerText = current.toFixed(1) + 'L';
    };
    window.registerWorkout = function() { alert("Treino registrado com sucesso!"); };
    window.registerSleep = function() { alert("Horas de sono registradas!"); };

    // ==========================================
    // 3. ESTUDO
    // ==========================================
    window.selectSubject = function(name, examTitle, examContent) {
        const titleElem = document.getElementById('selected-subject-title');
        const examTitleElem = document.getElementById('exam-title');
        const examContentElem = document.getElementById('exam-content');

        if (titleElem) titleElem.innerText = name;
        if (examTitleElem) examTitleElem.innerText = examTitle;
        if (examContentElem) examContentElem.innerText = examContent;

        document.querySelectorAll('.course-card').forEach(card => card.classList.remove('active'));
        if (window.event?.currentTarget) window.event.currentTarget.classList.add('active');
    };

    // ==========================================
    // 4. CHATBOT (Visual Bonito e Simulado)
    // ==========================================
    const chatInput = document.querySelector('.chat-input input');
    const sendBtn = document.querySelector('.chat-send');
    const chatBody = document.querySelector('.chat-body');

    if (sendBtn && chatInput && chatBody) {
        const enviarMensagem = (texto) => {
            const msg = texto || chatInput.value.trim();
            if (!msg) return;
            
            // Esconde a mensagem inicial de "Olá, eu sou a Aya"
            const welcome = chatBody.querySelector('.chat-welcome');
            if (welcome) welcome.style.display = 'none';
            
            // 1. Cria o balão do Usuário
            chatBody.innerHTML += `
                <div style="background:#E25C84; color:white; padding:12px 16px; border-radius:15px 15px 0 15px; margin:10px 0; align-self:flex-end; max-width:80%; font-size:14px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                    ${msg}
                </div>`;
            
            if (!texto) chatInput.value = '';
            chatBody.scrollTop = chatBody.scrollHeight;

            // 2. Simula a digitação da Aya e cria o balão de resposta
            setTimeout(() => {
                let respostaAya = "Entendi! Como posso ajudar você com o Flow Agendas hoje?";
                
                // Respostas mais inteligentes baseadas no que o usuário digitar
                if (msg.toLowerCase().includes("evento") || msg.toLowerCase().includes("agenda")) {
                    respostaAya = "Para adicionar um evento, vá até a aba 'Minha Agenda' e clique no botão '+ adicionar evento' no topo da tela.";
                } else if (msg.toLowerCase().includes("sono")) {
                    respostaAya = "Você pode registrar suas horas de sono na aba 'Bem-estar', no card roxo com o desenho da lua!";
                } else if (msg.toLowerCase().includes("gráfico") || msg.toLowerCase().includes("dados")) {
                    respostaAya = "Os gráficos e dados ficam na aba 'Dashboard'. Se eles não carregarem, verifique se o servidor Python está ligado!";
                } else if (msg.toLowerCase().includes("ajuda")) {
                    respostaAya = "Eu sou a Aya! Posso te ajudar a navegar pelo Flow Agendas. O que você precisa saber?";
                }

                chatBody.innerHTML += `
                    <div style="background:#F2F2F7; color:#1A1A1A; padding:12px 16px; border-radius:15px 15px 15px 0; margin:10px 0; align-self:flex-start; max-width:80%; font-size:14px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                        ${respostaAya}
                    </div>`;
                
                chatBody.scrollTop = chatBody.scrollHeight;
            }, 600); // Meio segundo de delay para parecer real
        };

        sendBtn.addEventListener('click', () => enviarMensagem());
        
        chatInput.addEventListener('keypress', (e) => { 
            if (e.key === 'Enter') enviarMensagem(); 
        });
        
        document.querySelectorAll('.chat-chip').forEach(chip => {
            chip.addEventListener('click', () => enviarMensagem(chip.textContent));
        });
    }
});