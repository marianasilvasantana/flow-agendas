// ==========================================
// INTEGRAÇÃO COM A API (RESUMO E DASHBOARD)
// ==========================================
const API_URL = "http://127.0.0.1:8000";
let chartCategoriasInstance = null;
let chartTarefasInstance = null;
let chartConcluidasInstance = null;

async function carregarDadosResumo() {
    const statusApi = document.getElementById('atualizacao');
    try {
        if (statusApi) statusApi.innerText = "Consultando a API...";
        
        // Carrega cards
        const resCards = await fetch(`${API_URL}/dashboard/cards`);
        if (resCards.ok) {
            const cards = await resCards.json();
            document.getElementById('total-compras').innerText = cards.total_tarefas;
            document.getElementById('total-clientes').innerText = cards.usuarios_cadastrados;
            document.getElementById('total-produtos').innerText = cards.total_categorias;
        }

        // Carrega tabela categoria
        const resCat = await fetch(`${API_URL}/dashboard/analise-por-categoria`);
        if (resCat.ok) {
            const dadosCat = await resCat.json();
            const tbodyCat = document.getElementById('lista-pagamentos');
            if (tbodyCat) {
                tbodyCat.innerHTML = '';
                dadosCat.forEach(item => {
                    tbodyCat.innerHTML += `<tr><td style="padding: 12px;">${item.categoria}</td><td style="padding: 12px; text-align: right;">${item.total}</td></tr>`;
                });
            }
        }

        if (statusApi) statusApi.innerText = "Dados atualizados com sucesso.";
        carregarDashboard();

    } catch (erro) {
        console.error("Erro na API:", erro);
        if (statusApi) statusApi.innerText = "Erro ao carregar API.";
    }
}

async function carregarDashboard() {
    try {
        // Cards do dashboard
        const resCards = await fetch(`${API_URL}/dashboard/cards`);
        if (resCards.ok) {
            const cards = await resCards.json();
            document.getElementById('dash-total-tarefas').innerText = cards.total_tarefas;
            document.getElementById('dash-total-usuarios').innerText = cards.usuarios_cadastrados;
        }
        
        const resConcluidasDia = await fetch(`${API_URL}/dashboard/concluidas-por-dia`);
        if(resConcluidasDia.ok) {
            const dados = await resConcluidasDia.json();
            let totalConc = 0;
            dados.forEach(d => totalConc += d.tarefas_concluidas);
            document.getElementById('dash-total-concluidas').innerText = totalConc;
        }

        document.getElementById('aviso-graficos').hidden = true;
        document.getElementById('graficos').hidden = false;

        // --- GRÁFICO 1: BARRAS HORIZONTAIS ---
        const resCat = await fetch(`${API_URL}/dashboard/analise-por-categoria`);
        const dadosCat = await resCat.json();
        const ctxCat = document.getElementById('grafico-categorias');
        if (ctxCat) {
            if (chartCategoriasInstance) chartCategoriasInstance.destroy();
            chartCategoriasInstance = new Chart(ctxCat, {
                type: 'bar',
                data: {
                    labels: dadosCat.map(d => d.categoria),
                    datasets: [{ label: 'Tarefas', data: dadosCat.map(d => d.total), backgroundColor: '#E25C84', borderRadius: 6 }]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }

        // --- GRÁFICO 2: LINHA VERDE (POR MÊS) ---
        // Usando a rota mensal para ficar limpo
        const resMes = await fetch(`${API_URL}/dashboard/tarefas-por-mes`);
        const dadosMes = await resMes.json();
        const ctxDia = document.getElementById('grafico-tarefas');
        
        if (ctxDia) {
            if (chartTarefasInstance) chartTarefasInstance.destroy();
            chartTarefasInstance = new Chart(ctxDia, {
                type: 'line',
                data: {
                    labels: dadosMes.map(d => d.mes), // Eixo X: Apenas os meses
                    datasets: [{
                        label: 'Total de Tarefas',
                        data: dadosMes.map(d => d.total_tarefas),
                        borderColor: '#4CD964',
                        backgroundColor: '#4CD964',
                        tension: 0, // 0 = Linhas retas como na sua imagem
                        fill: false,
                        pointRadius: 4, // Pontos visíveis
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true, grid: { color: '#F0EADD' } }
                    }
                }
            });
        }

        // --- GRÁFICO 3: LINHA AMARELA (POR MÊS) ---
        const resConcMes = await fetch(`${API_URL}/dashboard/concluidas-por-mes`);
        const dadosConcMes = await resConcMes.json();
        const ctxConc = document.getElementById('grafico-concluidas');
        
        if (ctxConc) {
            if (chartConcluidasInstance) chartConcluidasInstance.destroy();
            chartConcluidasInstance = new Chart(ctxConc, {
                type: 'line',
                data: {
                    labels: dadosConcMes.map(d => d.mes), // Eixo X: Apenas os meses
                    datasets: [{
                        label: 'Concluídas',
                        data: dadosConcMes.map(d => d.tarefas_concluidas),
                        borderColor: '#FFCC00',
                        backgroundColor: '#FFCC00',
                        tension: 0, // 0 = Linhas retas
                        fill: false,
                        pointRadius: 4,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true, grid: { color: '#F0EADD' } }
                    }
                }
            });
        }

    } catch (erro) {
        console.error("Erro ao carregar dashboard:", erro);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('botao-atualizar')?.addEventListener('click', carregarDadosResumo);
    document.getElementById('dash-botao-atualizar')?.addEventListener('click', carregarDashboard);
    carregarDadosResumo();
});