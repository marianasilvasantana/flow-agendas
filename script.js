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

//bem-estar //
let totalwaterML = 1200;
const goalwaterML = 2000;

function addWater(amount) {
    totalWaterMl += amount;
    let percentage = Math.min((totalWaterMl / goalWaterMl) * 100, 100);
    
    // Atualiza o texto do L / ml
    const waterText = document.getElementById('water-text');
    if (waterText) {
        waterText.innerText = (totalWaterMl / 1000).toFixed(1) + 'L';
    }

    // Atualiza a cor do círculo
    const waterCard = waterText.closest('.wellness-card');
    if (waterCard) {
        const circle = waterCard.querySelector('.progress-circle');
        circle.style.setProperty('--percent', percentage);
    }
}