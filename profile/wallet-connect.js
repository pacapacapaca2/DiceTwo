// Интеграция с TON Connect для Telegram Mini App
class TelegramWalletConnector {
  constructor() {
    this.isInitialized = false;
    // Используем относительный путь к манифесту
    this.tonConnectManifestUrl = './tonconnect-manifest.json';
    this.connector = null;
    this.dAppName = 'DiceTwo';
    
    // Режим отладки выключен - никаких логов на экране
    this.debugMode = false;
    
    // Информация о версии
    this.version = '1.0.1';
    
    console.log(`TelegramWalletConnector v${this.version} инициализирован`);
    console.log(`URL манифеста: ${new URL(this.tonConnectManifestUrl, window.location.href).href}`);
  }
  
  // Логирование только в консоль
  log(message, type = 'info') {
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
      return true;
    }

    try {
      console.log("Начинаем инициализацию TON Connect...");
      
      // Сначала пробуем использовать tonconnect из window
      if (window.tonconnect) {
        try {
          console.log("Обнаружен tonconnect в window, пробуем использовать его");
          const fullManifestUrl = new URL(this.tonConnectManifestUrl, window.location.href).href;
          this.connector = window.tonconnect.createConnector({
            manifestUrl: fullManifestUrl
          });
          this.setupConnectorHandlers();
          this.isInitialized = true;
          return true;
        } catch (err) {
          console.warn('Error creating connector via tonconnect:', err);
        }
      }
      
      // Пробуем через глобальный TonConnect или window.TonConnect
      const TonConnectConstructor = typeof TonConnect !== 'undefined' 
                                  ? TonConnect 
                                  : (window.TonConnect || window.TonConnect_SDK);
      
      if (TonConnectConstructor) {
        try {
          console.log("Обнаружен TonConnect в глобальном объекте, пробуем использовать его");
          const fullManifestUrl = new URL(this.tonConnectManifestUrl, window.location.href).href;
          this.connector = new TonConnectConstructor({
            manifestUrl: fullManifestUrl
          });
          this.setupConnectorHandlers();
          this.isInitialized = true;
          return true;
        } catch (err) {
          console.warn('Error creating connector via TonConnect constructor:', err);
        }
      }
      
      // Если ни один из методов не сработал, загружаем SDK динамически
      console.log("Не удалось найти TON Connect в глобальном окружении, загружаем скрипт динамически");
      await this.loadTonConnectScript();
      
      // Даем время на инициализацию скрипта
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Пробуем еще раз после загрузки скрипта
      return await this.retryInitialization();
    } catch (error) {
      console.error('Initialization error:', error);
      return false;
    }
  }
  
  // Повторная попытка инициализации после загрузки скрипта
  async retryInitialization() {
    try {
      console.log("Повторная попытка инициализации после загрузки скрипта");
      // Проверяем наличие tonconnect
      if (window.tonconnect) {
        const fullManifestUrl = new URL(this.tonConnectManifestUrl, window.location.href).href;
        this.connector = window.tonconnect.createConnector({
          manifestUrl: fullManifestUrl
        });
        this.setupConnectorHandlers();
        this.isInitialized = true;
        return true;
      }
      
      // Или через глобальный TonConnect
      const TonConnectConstructor = typeof TonConnect !== 'undefined' 
                                  ? TonConnect 
                                  : (window.TonConnect || window.TonConnect_SDK);
      
      if (TonConnectConstructor) {
        const fullManifestUrl = new URL(this.tonConnectManifestUrl, window.location.href).href;
        this.connector = new TonConnectConstructor({
          manifestUrl: fullManifestUrl
        });
        this.setupConnectorHandlers();
        this.isInitialized = true;
        return true;
      }
      
      console.error("TON Connect SDK не был успешно загружен");
      return false;
    } catch (error) {
      console.error('Retry initialization error:', error);
      return false;
    }
  }
  
  // Настройка обработчиков для коннектора
  setupConnectorHandlers() {
    if (!this.connector) return;
    
    // Подписываемся на изменения статуса подключения
    this.connector.onStatusChange((walletInfo) => {
      // Вызываем событие изменения статуса кошелька
      const event = new CustomEvent('walletStatusChange', { 
        detail: { connected: !!walletInfo, wallet: walletInfo } 
      });
      document.dispatchEvent(event);
      
      // Сохраняем состояние в localStorage
      localStorage.setItem("walletConnected", walletInfo ? "true" : "false");
    });
    
    // Восстанавливаем соединение, если оно было ранее
    this.connector.restoreConnection().catch(error => {
      console.warn('Error restoring connection:', error);
    });
  }
  
  // Загрузка скрипта TON Connect динамически
  loadTonConnectScript() {
    return new Promise((resolve) => {
      // Проверяем, есть ли уже загруженный SDK
      if (window.tonconnect || typeof TonConnect !== 'undefined' || window.TonConnect) {
        console.log("TON Connect SDK уже загружен, пропускаем загрузку");
        resolve();
        return;
      }
      
      // Проверяем, существует ли уже скрипт в DOM
      if (document.querySelector('script[src*="tonconnect"]')) {
        console.log("Скрипт TON Connect уже добавлен в DOM, ожидаем загрузку");
        setTimeout(resolve, 1000);
        return;
      }
      
      console.log("Начинаем загрузку TON Connect SDK...");
      
      // Массив источников скриптов в порядке приоритета
      const scriptSources = [
        // Локальная копия (самый надежный вариант)
        './ton-connect-sdk.min.js',
        // CDN источники
        'https://unpkg.com/@tonconnect/sdk@2.1.3/dist/tonconnect-sdk.min.js',
        'https://cdn.jsdelivr.net/npm/@tonconnect/sdk@2.1.3/dist/tonconnect-sdk.min.js'
      ];
      
      // Счетчик попыток загрузки
      let attemptIndex = 0;
      
      // Функция для загрузки скрипта
      const loadScript = (src) => {
        console.log(`Пробуем загрузить TON Connect SDK из источника: ${src}`);
        
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        
        script.onload = () => {
          console.log(`TON Connect SDK успешно загружен из ${src}`);
          // Проверяем, что SDK действительно загрузился
          setTimeout(() => {
            if (window.tonconnect || typeof TonConnect !== 'undefined' || window.TonConnect) {
              console.log("TON Connect SDK доступен после загрузки");
              resolve();
            } else {
              console.warn("TON Connect SDK загружен, но не доступен в глобальном объекте");
              tryNextSource();
            }
          }, 500);
        };
        
        script.onerror = () => {
          console.warn(`Ошибка загрузки TON Connect SDK из ${src}`);
          tryNextSource();
        };
        
        document.head.appendChild(script);
      };
      
      // Функция для попытки загрузки из следующего источника
      const tryNextSource = () => {
        attemptIndex++;
        if (attemptIndex < scriptSources.length) {
          loadScript(scriptSources[attemptIndex]);
        } else {
          console.error("Не удалось загрузить TON Connect SDK из всех источников");
          // Показываем сообщение пользователю
          showTonConnectError();
          resolve(); // Завершаем промис, чтобы не блокировать выполнение
        }
      };
      
      // Показываем ошибку пользователю
      const showTonConnectError = () => {
        if (document.getElementById('ton-connect-error')) return; // Предотвращаем дублирование
        
        const errorDiv = document.createElement('div');
        errorDiv.id = 'ton-connect-error';
        errorDiv.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgba(235, 87, 87, 0.9);
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 9999;
          text-align: center;
          max-width: 90%;
        `;
        
        errorDiv.innerHTML = `
          <p style="margin-bottom: 16px; font-weight: 500;">Не удалось загрузить TON Connect SDK</p>
          <button id="retry-ton-connect" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            cursor: pointer;
          ">Попробовать снова</button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Обработчик для кнопки повтора
        document.getElementById('retry-ton-connect').onclick = () => {
          document.body.removeChild(errorDiv);
          location.reload(); // Перезагружаем страницу
        };
      };
      
      // Начинаем с первого источника
      loadScript(scriptSources[0]);
    });
  }

  async connectWallet() {
    if (!this.isInitialized) {
      console.log("Инициализируем перед подключением кошелька");
      const initialized = await this.initialize();
      if (!initialized) {
        console.error("Не удалось инициализировать TON Connect");
        return false;
      }
    }

    try {
      if (this.connector.connected) {
        console.log("Кошелек уже подключен");
        return true;
      }

      // Получаем список доступных кошельков
      let wallets;
      try {
        console.log("Запрашиваем список доступных кошельков");
        wallets = await this.connector.getWallets();
        console.log("Доступные кошельки:", wallets);
      } catch (walletsError) {
        console.error('Error getting wallet list:', walletsError);
        return false;
      }
      
      if (!wallets || wallets.length === 0) {
        console.error("Нет доступных кошельков");
        return false;
      }
      
      // Находим кошелек Telegram (TonKeeper) для подключения
      let tonkeeperWallet = wallets.find(wallet => 
        wallet.name === 'Tonkeeper' || 
        wallet.name.toLowerCase().includes('ton') ||
        wallet.name.toLowerCase().includes('keeper')
      );
      
      if (!tonkeeperWallet) {
        // Используем первый доступный кошелек
        console.log("Кошелек Tonkeeper не найден, используем первый доступный кошелек");
        tonkeeperWallet = wallets[0];
      } else {
        console.log("Найден кошелек:", tonkeeperWallet.name);
      }
      
      // Формируем ссылку для подключения и открываем её
      try {
        console.log("Формируем универсальную ссылку для подключения");
        
        // Настройки связи с кошельком
        const connectionOptions = {
          universalLink: tonkeeperWallet.universalLink,
          bridgeUrl: tonkeeperWallet.bridgeUrl
        };
        
        console.log("Параметры подключения:", connectionOptions);
        
        // Создаем универсальную ссылку
        const universalLink = this.connector.connect(connectionOptions);
        
        console.log("Сгенерирована ссылка для подключения:", universalLink);
        
        // Открываем ссылку для подключения
        window.location.href = universalLink;
        return true;
      } catch (connectError) {
        console.error('Error generating connection link:', connectError);
        return false;
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      return false;
    }
  }

  // Проверяет, подключен ли кошелек
  async isWalletConnected() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.connector ? this.connector.connected : false;
  }

  // Отключает кошелек
  async disconnectWallet() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      if (this.connector) {
        await this.connector.disconnect();
      }
      
      localStorage.removeItem("walletConnected");
      return true;
    } catch (error) {
      console.error('Wallet disconnection error:', error);
      return false;
    }
  }
  
  // Получает адрес кошелька
  getWalletAddress() {
    if (!this.connector || !this.connector.connected) {
      return null;
    }
    
    try {
      return this.connector.wallet?.account?.address || null;
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return null;
    }
  }
}

// Создаем глобальный экземпляр connector
const telegramWalletConnector = new TelegramWalletConnector();

// Инициализируем коннектор при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Добавляем задержку перед инициализацией, чтобы скрипты успели загрузиться
  setTimeout(() => telegramWalletConnector.initialize(), 2000);
}); 