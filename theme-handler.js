// theme-handler.js

// Инициализация Telegram Web App API
const tg = window.Telegram.WebApp;

// Функция для применения темы
function applyTheme() {
    const themeParams = tg.themeParams;
    const html = document.documentElement;

    // Применение параметров темы
    html.style.setProperty('--tg-color-scheme', tg.colorScheme);
    html.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
    html.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#40a7e3');
    html.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
    html.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');

    // Динамическая настройка --hint-color для светлой и тёмной тем
    if (tg.colorScheme === 'dark') {
        html.style.setProperty('--hint-color', '#708499'); // Цвет для тёмной темы
    } else {
        html.style.setProperty('--hint-color', '#999999'); // Цвет для светлой темы
    }
}

// Применяем тему при загрузке
applyTheme();

// Слушаем событие themeChanged
tg.onEvent('themeChanged', applyTheme);
