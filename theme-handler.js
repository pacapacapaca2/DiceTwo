// Инициализация Telegram Web App API
const tg = window.Telegram.WebApp;

// Функция для применения темы
function applyTheme() {
    const themeParams = tg.themeParams;
    const html = document.documentElement;

    // Динамическое обновление свойств темы
    html.style.setProperty('--tg-color-scheme', tg.colorScheme);
    html.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
    html.style.setProperty('--tg-theme-button-color', themeParams.button_color);
    html.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
    html.style.setProperty('--tg-theme-text-color', themeParams.text_color);

    // Обновление цвета подсказки
    if (tg.colorScheme === 'dark') {
        html.style.setProperty('--hint-color', '#708499');
    } else {
        html.style.setProperty('--hint-color', '#999999');
    }
}

// Применяем тему при загрузке
applyTheme();

// Обновление темы при изменении через Telegram
tg.onEvent('themeChanged', applyTheme);
