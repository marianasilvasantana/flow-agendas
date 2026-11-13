document.addEventListener("DOMContentLoaded", () => {
    // DADOS SIMULADOS
    const dados = {
        total_tarefas: 1500,
        total_usuarios: 12,
        total_categorias: 4,
        categorias: [
            { categoria: "Estudo", total: 780 },
            { categoria: "Trabalho", total: 450 },
            { categoria: "Pessoal/Saúde", total: 180 },
            { categoria: "Empresa", total: 90 }
        ],
        datas: [
            { data: "2026-01-15", pendentes: 3, concluidas: 2, total: 5 },
            { data: "2026-02-10", pendentes: 4, concluidas: 1, total: 5 },
            { data: "2026-03-22", pendentes: 2, concluidas: 5, total: 7 },
            { data: "2026-04-05", pendentes: 0, concluidas: 8, total: 8 },
            { data: "2026-05-18", pendentes: 6, concluidas: 2, total: 8 },
            { data: "2026-06-30", pendentes: 3, concluidas: 4, total: 7 },
            { data: "2026-07-12", pendentes: 1, concluidas: 6, total: 7 }
        ],
        dias: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
        tarefasPorMes: [120, 135, 150, 110, 140, 160, 125, 130, 145, 155, 115, 115],
        concluidasPorMes: [100, 120, 130, 90, 115, 140, 110, 115, 125, 140, 100, 95]
    };

    // ============ RESUMO ============
    const btnResumo = document.querySelector("#botao-atualizar");
    if (btnResumo) {
        btnResumo.addEventListener("click", () => {
            btnResumo.disabled = true;
            btnResumo.innerHTML = "Carregando...";
            
            setTimeout(() => {
                document.querySelector("#total-compras").textContent = dados.total_tarefas;
                document.querySelector("#total-clientes").textContent = dados.total_usuarios;
                document.querySelector("#total-produtos").textContent = dados.total_categorias;
                
                const listaCat = document.querySelector("#lista-pagamentos");
                listaCat.innerHTML = "";
                dados.categorias.forEach(c => {
                    listaCat.innerHTML += `<tr><td style="padding:12px;">${c.categoria}</td><td style="padding:12px; text-align:right;">${c.total}</td></tr>`;
                });
                document.querySelector("#total-pagamentos").textContent = dados.total_tarefas;
                
                const listaDatas = document.querySelector("#lista-datas");
                listaDatas.innerHTML = "";
                dados.datas.forEach(d => {
                    const dataFormatada = d.data.split('-').reverse().join('/');
                    listaDatas.innerHTML += `<tr>
                        <td style="padding:12px;">${dataFormatada}</td>
                        <td style="padding:12px; text-align:right;">${d.pendentes}</td>
                        <td style="padding:12px; text-align:right;">${d.concluidas}</td>
                        <td style="padding:12px; text-align:right;">${d.total}</td>
                    </tr>`;
                });
                
                const msg = document.querySelector("#mensagem");
                msg.hidden = false;
                msg.textContent = "Dados carregados com sucesso!";
                msg.className = "mensagem";
                document.querySelector("#atualizacao").textContent = "Última consulta: " + new Date().toLocaleString();

                btnResumo.disabled = false;
                btnResumo.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Atualizar dados';
            }, 500);
        });
    }

    // ============ DASHBOARD E GRÁFICOS ============
    const btnDash = document.querySelector("#dash-botao-atualizar");
    if (btnDash) {
        btnDash.addEventListener("click", () => {
            btnDash.disabled = true;
            btnDash.textContent = "Carregando...";
            
            setTimeout(() => {
                document.querySelector("#dash-total-tarefas").textContent = dados.total_tarefas;
                document.querySelector("#dash-total-usuarios").textContent = dados.total_usuarios;
                document.querySelector("#dash-total-concluidas").textContent = dados.concluidasPorMes.reduce((a, b) => a + b, 0);
                
                document.querySelector("#graficos").hidden = false;

                if (window.meusGraficos) window.meusGraficos.forEach(g => g.destroy());
                window.meusGraficos = [];

                // 1. Gráfico de Categorias
                window.meusGraficos.push(new Chart(document.getElementById("grafico-categorias"), {
                    type: 'bar',
                    data: { labels: dados.categorias.map(c => c.categoria), datasets: [{ label: 'Tarefas', data: dados.categorias.map(c => c.total), backgroundColor: '#E25C84', borderRadius: 6 }] },
                    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
                }));

                // 2. Gráfico de Tarefas por Mês
                window.meusGraficos.push(new Chart(document.getElementById("grafico-tarefas"), {
                    type: 'bar',
                    data: { labels: dados.dias, datasets: [{ label: 'Tarefas', data: dados.tarefasPorMes, backgroundColor: '#4f46e5', borderRadius: 6 }] },
                    options: { responsive: true, maintainAspectRatio: false }
                }));

                // 3. Gráfico de Concluídas
                window.meusGraficos.push(new Chart(document.getElementById("grafico-concluidas"), {
                    type: 'line',
                    data: { labels: dados.dias, datasets: [{ label: 'Concluídas', data: dados.concluidasPorMes, borderColor: '#E25C84', backgroundColor: 'rgba(226,92,132,0.1)', tension: 0.4, fill: true }] },
                    options: { responsive: true, maintainAspectRatio: false }
                }));

                // ---- PREENCHER AS TABELAS DO DASHBOARD ----
                
                // Tabela de Categorias
                const dashListaCat = document.querySelector("#dash-lista-categorias");
                dashListaCat.innerHTML = "";
                dados.categorias.forEach(c => {
                    dashListaCat.innerHTML += `<tr><td style="padding:12px;">${c.categoria}</td><td style="padding:12px; text-align:right;">${c.total}</td></tr>`;
                });

                // Tabela de Dias
                const dashListaDias = document.querySelector("#dash-lista-dias");
                dashListaDias.innerHTML = "";
                dados.datas.forEach(d => {
                    const dataFormatada = d.data.split('-').reverse().join('/');
                    dashListaDias.innerHTML += `<tr>
                        <td style="padding:12px;">${dataFormatada}</td>
                        <td style="padding:12px; text-align:right;">${d.total}</td>
                        <td style="padding:12px; text-align:right;">${d.concluidas}</td>
                    </tr>`;
                });

                btnDash.disabled = false;
                btnDash.textContent = "Atualizar dados";
            }, 500);
        });
    }
});