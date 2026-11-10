document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://127.0.0.1:8000";

    // ============ BLOCO 1: RESUMO ============
    const btnResumo = document.querySelector("#botao-atualizar");
    if (btnResumo) {
        btnResumo.addEventListener("click", async () => {
            btnResumo.disabled = true;
            btnResumo.innerHTML = "Carregando...";
            try {
                const res = await fetch(API_URL + "/analise/resumo");
                const dados = await res.json();
                
                document.querySelector("#total-compras").textContent = dados.total_tarefas;
                document.querySelector("#total-clientes").textContent = dados.total_usuarios;
                document.querySelector("#total-produtos").textContent = dados.total_categorias;
                
                const listaCat = document.querySelector("#lista-pagamentos");
                listaCat.innerHTML = "";
                dados.por_categoria.forEach(c => {
                    listaCat.innerHTML += `<tr>
                        <td style="padding:12px;">${c.categoria}</td>
                        <td style="padding:12px; text-align:right;">${c.total_tarefas}</td>
                    </tr>`;
                });
                document.querySelector("#total-pagamentos").textContent = dados.total_tarefas;
                
                document.querySelector("#mensagem").hidden = false;
                document.querySelector("#mensagem").textContent = "Dados atualizados!";
                document.querySelector("#mensagem").className = "mensagem";
                document.querySelector("#atualizacao").textContent = "Última consulta: " + new Date().toLocaleString();

            } catch (e) {
                document.querySelector("#mensagem").hidden = false;
                document.querySelector("#mensagem").textContent = "Erro ao carregar API.";
                document.querySelector("#mensagem").className = "mensagem erro";
            } finally {
                btnResumo.disabled = false;
                btnResumo.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Atualizar dados';
            }
        });
    }

    // ============ BLOCO 2: DASHBOARD (GRÁFICOS) ============
    const btnDash = document.querySelector("#dash-botao-atualizar");
    if (btnDash) {
        btnDash.addEventListener("click", async () => {
            btnDash.disabled = true;
            btnDash.textContent = "Carregando...";
            try {
                const [cats, tarefasDias, concluidasDias] = await Promise.all([
                    fetch(API_URL + "/analise/categorias").then(r => r.json()),
                    fetch(API_URL + "/dashboard/tarefas-por-dia").then(r => r.json()),
                    fetch(API_URL + "/dashboard/concluidas-por-dia").then(r => r.json())
                ]);

                document.querySelector("#graficos").hidden = false;

                if (window.meusGraficos) window.meusGraficos.forEach(g => g.destroy());
                window.meusGraficos = [];

                // Gráfico 1: Categorias
                window.meusGraficos.push(new Chart(document.getElementById("grafico-categorias"), {
                    type: 'bar',
                    data: { labels: cats.map(c => c.categoria), datasets: [{ label: 'Tarefas', data: cats.map(c => c.total_tarefas), backgroundColor: '#E25C84' }] },
                    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
                }));

                // Gráfico 2: Tarefas por Mês
                window.meusGraficos.push(new Chart(document.getElementById("grafico-tarefas"), {
                    type: 'bar',
                    data: { labels: tarefasDias.map(t => t.periodo), datasets: [{ label: 'Tarefas', data: tarefasDias.map(t => t.total_tarefas), backgroundColor: '#4f46e5' }] },
                    options: { responsive: true, maintainAspectRatio: false }
                }));

                // Gráfico 3: Concluídas
                window.meusGraficos.push(new Chart(document.getElementById("grafico-concluidas"), {
                    type: 'line',
                    data: { labels: concluidasDias.map(t => t.periodo), datasets: [{ label: 'Concluídas', data: concluidasDias.map(t => t.tarefas_concluidas), borderColor: '#E25C84', tension: 0.3 }] },
                    options: { responsive: true, maintainAspectRatio: false }
                }));

            } catch (e) {
                alert("Erro ao carregar gráficos. O backend está ligado?");
            } finally {
                btnDash.disabled = false;
                btnDash.textContent = "Atualizar dados";
            }
        });
    }
});