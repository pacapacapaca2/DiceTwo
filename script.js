// Находим все элементы навигации
const navButtons = document.querySelectorAll('.nav-item');
const panels = document.querySelectorAll('.panel');

// Показываем первую панель при загрузке
document.getElementById('panel-earn').style.display = 'block';

// Добавляем обработчики кликов
navButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const targetPanel = button.dataset.target;

        // Скрыть все панели
        panels.forEach((panel) => {
            panel.style.display = 'none';
        });

        // Показать выбранную панель
        document.getElementById(targetPanel).style.display = 'block';
    });
});
