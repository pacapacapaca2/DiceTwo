// Интеграция с TON Connect для Telegram Mini App
class TelegramWalletConnector {
  constructor() {
    this.isInitialized = false;
    // Используем локальный манифест вместо примера с GitHub
    this.tonConnectManifestUrl = './tonconnect-manifest.json';
    this.connector = null;
    this.dAppName = 'DiceTwo';
    
    // Создаем элемент для отображения логов на экране
    this.createLogElement();
  }
  
  // Метод для создания элемента логов на экране
  createLogElement() {
    if (document.getElementById('wallet-debug-log')) {
      return;
    }
    
    const logContainer = document.createElement('div');
    logContainer.id = 'wallet-debug-log';
    logContainer.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      right: 10px;
      max-height: 150px;
      overflow-y: auto;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
    `;
    document.body.appendChild(logContainer);
    
    // Добавляем кнопку для очистки логов
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Очистить логи';
    clearButton.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      padding: 2px 5px;
      font-size: 10px;
      background: #555;
      color: white;
      border: none;
      border-radius: 3px;
    `;
    clearButton.onclick = () => {
      logContainer.innerHTML = '';
      logContainer.appendChild(clearButton);
      this.logToScreen('Логи очищены', 'info');
    };
    logContainer.appendChild(clearButton);
  }
  
  // Метод для логирования на экран
  logToScreen(message, type = 'info') {
    const logContainer = document.getElementById('wallet-debug-log');
    if (!logContainer) {
      this.createLogElement();
    }
    
    const logEntry = document.createElement('div');
    logEntry.style.cssText = `margin: 2px 0; padding: 2px 0; border-bottom: 1px solid #444;`;
    
    let color = '#aaaaaa';
    if (type === 'error') color = '#ff6b6b';
    if (type === 'success') color = '#6bff6b';
    if (type === 'warning') color = '#ffbb6b';
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.innerHTML = `<span style="color: #888;">[${timestamp}]</span> <span style="color: ${color};">${message}</span>`;
    
    // Сохраняем ссылку на кнопку очистки
    const clearButton = logContainer.querySelector('button');
    
    // Добавляем новую запись в начало логов (до кнопки очистки)
    logContainer.insertBefore(logEntry, clearButton.nextSibling);
    
    // Также выводим в консоль
    if (type === 'error') {
      console.error(message);
    } else if (type === 'warning') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }

  async initialize() {
    if (this.isInitialized) {
      this.logToScreen('Коннектор уже инициализирован', 'info');
      return true;
    }

    try {
      this.logToScreen('Начинаем инициализацию TON Connect...', 'info');
      
      // Проверяем, загружен ли скрипт TonConnect
      if (!window.TonConnect) {
        const errorMsg = 'TON Connect SDK не доступен в window.TonConnect';
        this.logToScreen(errorMsg, 'error');
        
        // Попробуем загрузить скрипт динамически
        this.logToScreen('Пробуем загрузить TON Connect SDK динамически...', 'info');
        try {
          await this.loadTonConnectScript();
        } catch (loadError) {
          this.logToScreen(`Не удалось загрузить скрипт TON Connect: ${loadError.message}`, 'error');
          return false;
        }
      }
      
      // Повторно проверяем доступность после попытки загрузки
      if (!window.TonConnect) {
        this.logToScreen('TON Connect SDK всё ещё недоступен после попытки загрузки', 'error');
        return false;
      }

      this.logToScreen('TON Connect SDK доступен, создаем экземпляр коннектора', 'success');
      
      // Полный URL для манифеста
      const fullManifestUrl = new URL(this.tonConnectManifestUrl, window.location.href).href;
      this.logToScreen(`Полный URL манифеста: ${fullManifestUrl}`, 'info');
      
      // Создаем экземпляр коннектора TON Connect
      try {
        this.connector = new window.TonConnect({
          manifestUrl: fullManifestUrl
        });
        this.logToScreen('Экземпляр TON Connect создан успешно', 'success');
      } catch (connectorError) {
        this.logToScreen(`Ошибка при создании экземпляра TON Connect: ${connectorError.message}`, 'error');
        return false;
      }

      // Подписываемся на изменения статуса подключения
      this.connector.onStatusChange((walletInfo) => {
        this.logToScreen(`Статус подключения TON Connect изменился: ${walletInfo ? 'Подключен' : 'Отключен'}`, 'info');
        
        // Вызываем событие изменения статуса кошелька
        const event = new CustomEvent('walletStatusChange', { 
          detail: { connected: !!walletInfo, wallet: walletInfo } 
        });
        document.dispatchEvent(event);
        
        // Сохраняем состояние в localStorage
        localStorage.setItem("walletConnected", walletInfo ? "true" : "false");
      });
      
      // Восстанавливаем соединение, если оно было ранее
      this.logToScreen('Пытаемся восстановить предыдущее соединение...', 'info');
      try {
        await this.connector.restoreConnection();
        if (this.connector.connected) {
          this.logToScreen('Соединение восстановлено успешно!', 'success');
        } else {
          this.logToScreen('Предыдущее соединение не найдено', 'info');
        }
      } catch (restoreError) {
        this.logToScreen(`Ошибка при восстановлении соединения: ${restoreError.message}`, 'error');
      }
      
      this.isInitialized = true;
      this.logToScreen('TelegramWalletConnector инициализирован успешно', 'success');
      return true;
    } catch (error) {
      this.logToScreen(`Общая ошибка при инициализации: ${error.message}`, 'error');
      return false;
    }
  }
  
  // Загрузка скрипта TON Connect динамически
  loadTonConnectScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@tonconnect/sdk@latest/dist/tonconnect-sdk.min.js';
      script.async = true;
      
      script.onload = () => {
        this.logToScreen('TON Connect SDK загружен динамически', 'success');
        resolve();
      };
      
      script.onerror = (err) => {
        reject(new Error('Не удалось загрузить скрипт TON Connect SDK'));
      };
      
      document.head.appendChild(script);
    });
  }

  async connectWallet() {
    this.logToScreen('Запуск процесса подключения кошелька...', 'info');
    
    if (!this.isInitialized) {
      this.logToScreen('Коннектор не инициализирован, запускаем инициализацию...', 'warning');
      const initialized = await this.initialize();
      if (!initialized) {
        this.logToScreen('Не удалось инициализировать TelegramWalletConnector', 'error');
        return false;
      }
    }

    try {
      if (this.connector.connected) {
        this.logToScreen('Кошелек уже подключен', 'info');
        return true;
      }

      // Получаем список доступных кошельков
      this.logToScreen('Запрашиваем список доступных кошельков...', 'info');
      let wallets;
      try {
        wallets = await this.connector.getWallets();
        this.logToScreen(`Получен список кошельков: ${wallets.length} шт.`, 'success');
        wallets.forEach((w, i) => {
          this.logToScreen(`Кошелек ${i+1}: ${w.name} (${w.appName || 'без appName'})`, 'info');
        });
      } catch (walletsError) {
        this.logToScreen(`Ошибка при получении списка кошельков: ${walletsError.message}`, 'error');
        return false;
      }
      
      if (!wallets || wallets.length === 0) {
        this.logToScreen('Не найдено доступных кошельков', 'error');
        return false;
      }
      
      // Находим кошелек Telegram (TonKeeper) для подключения
      const tonkeeperWallet = wallets.find(wallet => 
        wallet.name === 'Tonkeeper' || 
        wallet.name.toLowerCase().includes('ton') ||
        wallet.name.toLowerCase().includes('keeper')
      );
      
      if (!tonkeeperWallet) {
        this.logToScreen('Не найден подходящий TON кошелек в списке', 'error');
        // Используем первый доступный кошелек
        this.logToScreen('Пробуем использовать первый доступный кошелек из списка', 'warning');
        tonkeeperWallet = wallets[0];
      }
      
      this.logToScreen(`Выбран кошелек: ${tonkeeperWallet.name}`, 'info');
      
      // Формируем ссылку для подключения и открываем её
      try {
        const universalLink = this.connector.connect({
          universalLink: tonkeeperWallet.universalLink,
          bridgeUrl: tonkeeperWallet.bridgeUrl
        });
        
        this.logToScreen(`Открываем ссылку для подключения: ${universalLink}`, 'info');
        window.location.href = universalLink;
        
        return true;
      } catch (connectError) {
        this.logToScreen(`Ошибка при генерации ссылки для подключения: ${connectError.message}`, 'error');
        return false;
      }
    } catch (error) {
      this.logToScreen(`Общая ошибка при подключении кошелька: ${error.message}`, 'error');
      return false;
    }
  }

  // Проверяет, подключен ли кошелек
  async isWalletConnected() {
    if (!this.isInitialized) {
      this.logToScreen('Проверка подключения: инициализация...', 'info');
      await this.initialize();
    }
    
    const connected = this.connector ? this.connector.connected : false;
    this.logToScreen(`Кошелек ${connected ? 'подключен' : 'не подключен'}`, 'info');
    return connected;
  }

  // Отключает кошелек
  async disconnectWallet() {
    this.logToScreen('Запрос на отключение кошелька...', 'info');
    
    if (!this.isInitialized) {
      this.logToScreen('Коннектор не инициализирован при попытке отключения', 'warning');
      await this.initialize();
    }
    
    try {
      if (this.connector) {
        await this.connector.disconnect();
        this.logToScreen('Кошелек успешно отключен', 'success');
      }
      
      localStorage.removeItem("walletConnected");
      return true;
    } catch (error) {
      this.logToScreen(`Ошибка при отключении кошелька: ${error.message}`, 'error');
      return false;
    }
  }
  
  // Получает адрес кошелька
  getWalletAddress() {
    if (!this.connector || !this.connector.connected) {
      this.logToScreen('Невозможно получить адрес: кошелек не подключен', 'warning');
      return null;
    }
    
    try {
      const address = this.connector.wallet?.account?.address || null;
      this.logToScreen(`Получен адрес кошелька: ${address ? address : 'адрес не доступен'}`, 
          address ? 'success' : 'warning');
      return address;
    } catch (error) {
      this.logToScreen(`Ошибка при получении адреса кошелька: ${error.message}`, 'error');
      return null;
    }
  }
}

// Создаем глобальный экземпляр connector
const telegramWalletConnector = new TelegramWalletConnector();

// Инициализируем коннектор при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  telegramWalletConnector.logToScreen('DOMContentLoaded: Начинаем инициализацию коннектора', 'info');
  telegramWalletConnector.initialize();
}); 