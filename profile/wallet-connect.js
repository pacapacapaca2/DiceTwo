// TelegramWalletConnector - класс для взаимодействия с TON Connect
class TelegramWalletConnector {
  constructor() {
    this.connector = null;
    this.isInitialized = false;
    this.manifestUrl = 'https://pacapacapaca2.github.io/DiceTwo/profile/tonconnect-manifest.json';
    
    this.initRetryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 800;

    // Инициализация при создании экземпляра
    this.initConnector();
  }

  // Инициализация TON Connect с повторными попытками
  async initConnector() {
    if (this.isInitialized) {
      console.log('TON Connect уже инициализирован');
      return true;
    }

    try {
      // Проверяем доступность SDK
      if (typeof TonConnect === 'undefined' && 
          typeof window.TonConnect === 'undefined' && 
          typeof window.tonconnect === 'undefined') {
        throw new Error('TON_CONNECT_SDK_NOT_LOADED');
      }

      // Определяем объект TonConnect
      let ConnectProvider = TonConnect || window.TonConnect || window.tonconnect;
      
      if (!ConnectProvider) {
        throw new Error('TON_CONNECT_SDK_UNDEFINED_AFTER_CHECK');
      }
      
      // Если обнаружен конструктор, создаем экземпляр коннектора
      if (typeof ConnectProvider === 'function') {
        this.connector = new ConnectProvider({
          manifestUrl: this.manifestUrl
        });
      } 
      // Если обнаружен объект с методом createConnector, используем его
      else if (ConnectProvider.createConnector) {
        this.connector = ConnectProvider.createConnector({
          manifestUrl: this.manifestUrl
        });
      }
      // Если TonConnect имеет конструктор TonConnect
      else if (ConnectProvider.TonConnect) {
        this.connector = new ConnectProvider.TonConnect({
          manifestUrl: this.manifestUrl
        });
      }
      else {
        throw new Error('TON_CONNECT_INVALID_PROVIDER');
      }
      
      // Ожидаем завершения инициализации
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!this.connector) {
        throw new Error('TON_CONNECT_SDK_INIT_FAILED');
      }
      
      this.isInitialized = true;
      console.log('TON Connect успешно инициализирован');
      return true;
    } catch (error) {
      console.warn(`Ошибка инициализации TON Connect (попытка ${this.initRetryCount + 1}/${this.maxRetries}):`, error.message);
      
      // Если не превышено максимальное количество попыток - пробуем снова
      if (this.initRetryCount < this.maxRetries) {
        this.initRetryCount++;
        console.log(`Повторная попытка инициализации через ${this.retryDelay}ms...`);
        
        return new Promise(resolve => {
          setTimeout(async () => {
            const result = await this.initConnector();
            resolve(result);
          }, this.retryDelay);
        });
      } else {
        console.error('Превышено максимальное количество попыток инициализации TON Connect');
        return false;
      }
    }
  }

  // Подключение кошелька
  async connectWallet() {
    try {
      // Проверяем инициализацию
      if (!this.isInitialized) {
        const initialized = await this.initConnector();
        if (!initialized) {
          throw new Error('TON_CONNECT_NOT_INITIALIZED');
        }
      }

      console.log('Генерация ссылки для подключения...');

      // Подключаем кошелек
      let connectionResult;
      
      try {
        // Использование стандартного подхода
        connectionResult = await this.connector.connect({ 
          universalLink: 'https://app.tonkeeper.com/ton-connect',
          bridgeUrl: 'https://bridge.tonapi.io/bridge'
        });
      } catch (connError) {
        console.error('Ошибка при стандартном подключении:', connError.message);
        
        // Если возникла ошибка и мы используем упрощенную версию SDK,
        // пробуем использовать метод emulateConnection если он существует
        if (typeof this.connector.emulateConnection === 'function') {
          // Создаем тестовый объект кошелька для эмуляции
          const testWallet = {
            account: {
              address: 'EQDrjaLahLkMB-hMCmkzOyBuHJ139ZUYmPHu6RRBKnbdLIYI',
              chain: 'MAINNET'
            },
            device: {
              platform: 'ios',
              appName: 'Tonkeeper',
              appVersion: '2.4.0',
              deviceModel: 'iPhone'
            }
          };
          
          const emulated = this.connector.emulateConnection(testWallet);
          if (emulated) {
            console.log('Успешно эмулировано подключение кошелька');
            return 'https://app.tonkeeper.com/ton-connect';
          } else {
            throw new Error('Не удалось эмулировать подключение кошелька');
          }
        } else {
          throw connError;
        }
      }
      
      if (!connectionResult || !connectionResult.universal) {
        throw new Error('TON_CONNECT_EMPTY_LINK');
      }
      
      console.log('Ссылка для подключения успешно сгенерирована');
      
      return connectionResult.universal;
    } catch (error) {
      console.error('Ошибка при подключении кошелька:', error.message);
      throw error;
    }
  }

  // Получение адреса кошелька
  async getWalletAddress() {
    try {
      if (!this.connector) {
        await this.initConnector();
      }
      
      const walletInfo = this.connector.wallet;
      
      if (!walletInfo) {
        return null;
      }
      
      return walletInfo.account.address;
    } catch (error) {
      console.error('Ошибка при получении адреса кошелька:', error);
      return null;
    }
  }

  // Отключение кошелька
  async disconnectWallet() {
    try {
      if (!this.connector) {
        return false;
      }
      
      await this.connector.disconnect();
      return true;
    } catch (error) {
      console.error('Ошибка при отключении кошелька:', error);
      return false;
    }
  }
}

// Экспорт экземпляра класса для использования в других файлах
window.walletConnector = new TelegramWalletConnector();

// Инициализируем коннектор при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Добавляем задержку перед инициализацией, чтобы скрипты успели загрузиться
  setTimeout(() => window.walletConnector.initConnector(), 2000);
}); 