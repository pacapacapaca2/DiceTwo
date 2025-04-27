// telegram.js - Интеграция с Telegram Mini Apps API
// Предоставляет функции для взаимодействия с Telegram

// Проверяем, запущено ли приложение в Telegram
const isTelegramApp = () => {
  return window.Telegram && window.Telegram.WebApp;
};

// Получаем данные пользователя из Telegram
function getTelegramUser() {
  if (!isTelegramApp()) {
    console.warn('Приложение не запущено в Telegram WebApp');
    return null;
  }
  
  const webApp = window.Telegram.WebApp;
  return webApp.initDataUnsafe && webApp.initDataUnsafe.user 
    ? webApp.initDataUnsafe.user 
    : null;
}

// Настройка темы и цветов в соответствии с темой Telegram
function setupTelegramTheme() {
  if (!isTelegramApp()) {
    return;
  }
  
  const webApp = window.Telegram.WebApp;
  
  // Устанавливаем цвета из темы Telegram
  document.documentElement.style.setProperty('--primary-color', webApp.themeParams.button_color);
  document.documentElement.style.setProperty('--secondary-color', webApp.themeParams.link_color);
  document.documentElement.style.setProperty('--text-color', webApp.themeParams.text_color);
  document.documentElement.style.setProperty('--bg-color', webApp.themeParams.bg_color);
  document.documentElement.style.setProperty('--secondary-bg-color', webApp.themeParams.secondary_bg_color);
  document.documentElement.style.setProperty('--hint-color', webApp.themeParams.hint_color);
}

// Отправка уведомления через нативный интерфейс Telegram
function showTelegramAlert(message) {
  if (!isTelegramApp()) {
    alert(message);
    return;
  }
  
  window.Telegram.WebApp.showAlert(message);
}

// Отправка подтверждения через нативный интерфейс Telegram
function showTelegramConfirm(message, callback) {
  if (!isTelegramApp()) {
    const result = confirm(message);
    callback(result);
    return;
  }
  
  window.Telegram.WebApp.showConfirm(message, callback);
}

// Отправка сообщения "Поделиться" в Telegram
function shareWithFriends(message) {
  if (!isTelegramApp()) {
    console.warn('Функция доступна только в Telegram');
    return;
  }
  
  window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(message)}`);
}

// Записываем результат в облачное хранилище Telegram (если поддерживается)
function saveToTelegramCloud(key, value) {
  if (!isTelegramApp() || !window.Telegram.WebApp.CloudStorage) {
    // Если облачное хранилище недоступно, используем localStorage
    localStorage.setItem(key, value);
    return Promise.resolve();
  }
  
  return window.Telegram.WebApp.CloudStorage.setItem(key, value);
}

// Получаем значение из облачного хранилища Telegram (если поддерживается)
function getFromTelegramCloud(key) {
  if (!isTelegramApp() || !window.Telegram.WebApp.CloudStorage) {
    // Если облачное хранилище недоступно, используем localStorage
    return Promise.resolve(localStorage.getItem(key));
  }
  
  return window.Telegram.WebApp.CloudStorage.getItem(key);
}

// Настройка кнопки главного меню Telegram
function setupMainButton(text, callback) {
  if (!isTelegramApp()) {
    return;
  }
  
  const mainButton = window.Telegram.WebApp.MainButton;
  
  mainButton.text = text;
  mainButton.onClick(callback);
  mainButton.show();
}

// Настройка кнопок меню обратной связи Telegram
function setupBackButton(callback) {
  if (!isTelegramApp()) {
    return;
  }
  
  const backButton = window.Telegram.WebApp.BackButton;
  
  backButton.onClick(callback);
  backButton.show();
}

// Отправка данных в бота Telegram
function sendDataToBot(data) {
  if (!isTelegramApp()) {
    console.warn('Функция доступна только в Telegram');
    return;
  }
  
  window.Telegram.WebApp.sendData(JSON.stringify(data));
}

// Инициализация закрытия приложения с сообщением
function closeWebApp(message = "") {
  if (!isTelegramApp()) {
    console.warn('Функция доступна только в Telegram');
    return;
  }
  
  window.Telegram.WebApp.close();
}

// Запустить вибрацию устройства (хаптическая обратная связь)
function hapticFeedback(type) {
  if (!isTelegramApp() || !window.Telegram.WebApp.HapticFeedback) {
    return;
  }
  
  const feedback = window.Telegram.WebApp.HapticFeedback;
  
  switch (type) {
    case 'light':
      feedback.impactOccurred('light');
      break;
    case 'medium':
      feedback.impactOccurred('medium');
      break;
    case 'heavy':
      feedback.impactOccurred('heavy');
      break;
    case 'success':
      feedback.notificationOccurred('success');
      break;
    case 'warning':
      feedback.notificationOccurred('warning');
      break;
    case 'error':
      feedback.notificationOccurred('error');
      break;
    case 'selection':
      feedback.selectionChanged();
      break;
  }
}

// Инициализация Telegram WebApp
function initTelegramApp() {
  if (!isTelegramApp()) {
    console.warn('Приложение не запущено в Telegram WebApp');
    return;
  }
  
  const webApp = window.Telegram.WebApp;
  
  // Расширяем веб-приложение на всю высоту
  webApp.expand();
  
  // Настраиваем тему
  setupTelegramTheme();
  
  // Устанавливаем цвет верхней панели
  webApp.setHeaderColor('secondary_bg_color');
  
  // Показываем приложение после инициализации
  webApp.ready();
  
  console.log('Telegram WebApp успешно инициализирован');
  
  return webApp;
}

// Экспортируем функции для использования в других модулях
export {
  isTelegramApp,
  getTelegramUser,
  setupTelegramTheme,
  showTelegramAlert,
  showTelegramConfirm,
  shareWithFriends,
  saveToTelegramCloud,
  getFromTelegramCloud,
  setupMainButton,
  setupBackButton,
  sendDataToBot,
  closeWebApp,
  hapticFeedback,
  initTelegramApp
}; 