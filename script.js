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