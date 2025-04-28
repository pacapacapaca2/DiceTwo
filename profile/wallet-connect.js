// Интеграция с TON Connect для Telegram Mini App
class TelegramWalletConnector {
  constructor() {
    this.isInitialized = false;
    this.tonConnectManifestUrl = './tonconnect-manifest.json';
    this.connector = null;
    this.dAppName = 'DiceTwo';
    
    // Режим отладки выключен - никаких логов на экране
    this.debugMode = false;
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
      // Сначала пробуем использовать tonconnect из window
      if (window.tonconnect) {
        try {
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
        resolve();
        return;
      }
      
      // Проверяем, существует ли уже скрипт в DOM
      if (document.querySelector('script[src*="tonconnect"]')) {
        setTimeout(resolve, 1000);
        return;
      }
      
      // Загружаем основной скрипт
      const script = document.createElement('script');
      script.src = 'https://tonconnect.github.io/sdk/tonconnect-web.js';
      script.async = true;
      
      // Функция завершения загрузки
      const finishLoading = () => {
        setTimeout(resolve, 1000);
      };
      
      script.onload = finishLoading;
      
      script.onerror = () => {
        // При ошибке пробуем альтернативный источник
        const alternativeScript = document.createElement('script');
        alternativeScript.src = 'https://unpkg.com/@tonconnect/sdk@latest/dist/tonconnect-sdk.min.js';
        alternativeScript.async = true;
        
        alternativeScript.onload = finishLoading;
        alternativeScript.onerror = finishLoading; // Даже при ошибке продолжаем (мб один из скриптов все же загрузился)
        
        document.head.appendChild(alternativeScript);
      };
      
      document.head.appendChild(script);
    });
  }

  async connectWallet() {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }
    }

    try {
      if (this.connector.connected) {
        return true;
      }

      // Получаем список доступных кошельков
      let wallets;
      try {
        wallets = await this.connector.getWallets();
      } catch (walletsError) {
        console.error('Error getting wallet list:', walletsError);
        return false;
      }
      
      if (!wallets || wallets.length === 0) {
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
        tonkeeperWallet = wallets[0];
      }
      
      // Формируем ссылку для подключения и открываем её
      try {
        const universalLink = this.connector.connect({
          universalLink: tonkeeperWallet.universalLink,
          bridgeUrl: tonkeeperWallet.bridgeUrl
        });
        
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