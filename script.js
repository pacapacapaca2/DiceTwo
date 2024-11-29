// Найти все кнопки навигации и панели
const navButtons = document.querySelectorAll('.nav-item');
const panels = document.querySelectorAll('.panel');

// Показать первую панель при загрузке
document.getElementById('panel-earn').style.display = 'flex';
navButtons[0].classList.add('active');

// Добавить обработчики на кнопки
navButtons.forEach((button) => {
    button.addEventListener('click', () => {
        // Скрыть все панели
        panels.forEach((panel) => (panel.style.display = 'none'));

        // Показать выбранную панель
        const targetPanel = button.dataset.target;
        document.getElementById(targetPanel).style.display = 'flex';

        // Удалить класс active со всех кнопок
        navButtons.forEach((btn) => btn.classList.remove('active'));

        // Добавить класс active к текущей кнопке
        button.classList.add('active');
    });
});
