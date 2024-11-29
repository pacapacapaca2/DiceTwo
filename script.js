// Получение цветовой схемы пользователя через Telegram WebApp
window.Telegram.WebApp.ready();

const setThemeColors = () => {
    const themeParams = Telegram.WebApp.themeParams;
    document.body.style.setProperty('--bg-color', themeParams.bg_color || '#f4f4f9');
    document.body.style.setProperty('--text-color', themeParams.text_color || '#000');
    document.body.style.setProperty('--card-bg-color', themeParams.card_bg_color || '#fff');
    document.body.style.setProperty('--button-bg-color', themeParams.button_color || '#007bff');
    document.body.style.setProperty('--button-text-color', themeParams.button_text_color || '#fff');
    document.body.style.setProperty('--button-active-bg-color', themeParams.button_pressed_color || '#0056b3');
    document.body.style.setProperty('--nav-bg-color', themeParams.nav_bg_color || '#1e1e2f');
    document.body.style.setProperty('--nav-text-color', themeParams.nav_text_color || '#ccc');
};

setThemeColors();

// Изменение цвета кнопки при нажатии
const button = document.getElementById('theme-button');
button.addEventListener('click', () => {
    button.style.backgroundColor = '#ff3d3d';
    button.style.color = '#fff';
});
