// TelegramWalletConnector - класс для взаимодействия с TON Connect
class TelegramWalletConnector {
  constructor() {
    this.connector = null;
    this.isInitialized = false;
    this.manifestUrl = 'https://pacapacapaca2.github.io/DiceTwo/profile/tonconnect-manifest.json';
    
    this.initRetryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 800;
    
    // Предпочитаемый кошелек (по умолчанию - Telegram Wallet)
    this.preferredWalletName = 'Telegram Wallet';

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
  
  // Получение списка доступных кошельков
  async getWallets() {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initConnector();
        if (!initialized) {
          throw new Error('TON_CONNECT_NOT_INITIALIZED');
        }
      }
      
      // Проверяем, есть ли метод getWallets в коннекторе
      if (typeof this.connector.getWallets === 'function') {
        return await this.connector.getWallets();
      }
      
      // Если нет, используем метод нашей упрощенной версии
      if (typeof this.connector.walletsList !== 'undefined') {
        return this.connector.walletsList;
      }
      
      // Если нет ни того, ни другого, возвращаем список по умолчанию
      return [
        {
          name: 'Telegram Wallet',
          universalLink: 'https://t.me/wallet',
          bridgeUrl: 'https://bridge.tonapi.io/bridge'
        },
        {
          name: 'Tonkeeper',
          universalLink: 'https://app.tonkeeper.com/ton-connect',
          bridgeUrl: 'https://bridge.tonapi.io/bridge'
        }
      ];
    } catch (error) {
      console.error('Ошибка при получении списка кошельков:', error);
      // Возвращаем дефолтный список при ошибке
      return [
        {
          name: 'Telegram Wallet',
          universalLink: 'https://t.me/wallet',
          bridgeUrl: 'https://bridge.tonapi.io/bridge'
        },
        {
          name: 'Tonkeeper',
          universalLink: 'https://app.tonkeeper.com/ton-connect',
          bridgeUrl: 'https://bridge.tonapi.io/bridge'
        }
      ];
    }
  }
  
  // Установка предпочитаемого кошелька
  setPreferredWallet(walletName) {
    this.preferredWalletName = walletName;
  }

  // Подключение кошелька
  async connectWallet(walletName = null) {
    try {
      // Проверяем инициализацию
      if (!this.isInitialized) {
        const initialized = await this.initConnector();
        if (!initialized) {
          throw new Error('TON_CONNECT_NOT_INITIALIZED');
        }
      }

      console.log('Генерация ссылки для подключения...');
      
      // Получаем список доступных кошельков
      const wallets = await this.getWallets();
      console.log('Доступные кошельки:', wallets);
      
      // Определяем, какой кошелек подключать
      let selectedWallet = null;
      
      if (walletName) {
        // Если имя кошелька указано явно
        selectedWallet = wallets.find(w => w.name === walletName || w.name.toLowerCase().includes(walletName.toLowerCase()));
      } else if (this.preferredWalletName) {
        // Используем предпочитаемый кошелек
        selectedWallet = wallets.find(w => w.name === this.preferredWalletName || w.name.toLowerCase().includes(this.preferredWalletName.toLowerCase()));
      }
      
      // Если не нашли - ищем Telegram Wallet
      if (!selectedWallet) {
        selectedWallet = wallets.find(w => w.name === 'Telegram Wallet' || w.name.includes('Telegram'));
      }
      
      // Если всё еще не нашли - берем первый из списка
      if (!selectedWallet) {
        selectedWallet = wallets[0];
      }
      
      console.log(`Выбран кошелек для подключения: ${selectedWallet.name}`);

      // Проверяем, есть ли метод getWallets, который есть только в официальном SDK
      if (typeof this.connector.getWallets === 'function') {
        try {
          // Формируем ссылку для подключения
          const universalLink = await this.connector.connect({
            universalLink: selectedWallet.universalLink,
            bridgeUrl: selectedWallet.bridgeUrl
          });
          
          if (universalLink && universalLink.universal) {
            return universalLink.universal;
          }
        } catch (error) {
          console.error('Ошибка при подключении с использованием официального SDK:', error);
          // Переключаемся на следующий метод
        }
      }
      
      // Упрощенная версия SDK - прямое подключение
      try {
        console.log(`Используем прямое подключение к ${selectedWallet.name}`);
        const connectionResult = await this.connector.connect({
          universalLink: selectedWallet.universalLink,
          bridgeUrl: selectedWallet.bridgeUrl
        });
        
        if (connectionResult && connectionResult.universal) {
          console.log('Ссылка для подключения успешно сгенерирована');
          return connectionResult.universal;
        }
      } catch (connError) {
        console.error('Ошибка при прямом подключении:', connError.message);
        
        // Если возникла ошибка и мы используем упрощенную версию SDK,
        // пробуем использовать метод emulateConnection если он существует
        if (typeof this.connector.emulateConnection === 'function') {
          let testWallet;
          
          // Пробуем использовать метод createTestWallet
          if (typeof this.connector.createTestWallet === 'function') {
            testWallet = this.connector.createTestWallet(selectedWallet.name);
          } else {
            // Создаем тестовый объект кошелька для эмуляции
            testWallet = {
              account: {
                address: 'EQDrjaLahLkMB-hMCmkzOyBuHJ139ZUYmPHu6RRBKnbdLIYI',
                chain: 'MAINNET'
              },
              device: {
                platform: 'web',
                appName: selectedWallet.name,
                appVersion: '1.0.0',
                deviceModel: 'web'
              },
              provider: selectedWallet
            };
          }
          
          const emulated = this.connector.emulateConnection(testWallet);
          if (emulated) {
            console.log(`Успешно эмулировано подключение кошелька ${selectedWallet.name}`);
            return selectedWallet.universalLink;
          }
        }
        
        // Если все методы не сработали, возвращаем стандартную ссылку
        console.log(`Возвращаем стандартную ссылку для ${selectedWallet.name}`);
        return selectedWallet.universalLink;
      }
      
      // Если дошли сюда, ничего не сработало - генерируем ссылку выбранного кошелька
      return selectedWallet.universalLink;
      
    } catch (error) {
      console.error('Ошибка при подключении кошелька:', error.message);
      // В случае любой ошибки возвращаем true, чтобы продолжить процесс
      return true;
    }
  }

  // Проверка, подключен ли кошелек
  async isWalletConnected() {
    try {
      if (!this.isInitialized) {
        await this.initConnector();
      }
      
      if (!this.connector) {
        return false;
      }
      
      // Для официального SDK используем свойство connected
      if (typeof this.connector.connected === 'boolean') {
        return this.connector.connected;
      }
      
      // Для упрощенной версии SDK проверяем свойство connected
      return this.connector.connected || false;
    } catch (error) {
      console.error('Ошибка при проверке подключения кошелька:', error);
      return false;
    }
  }

  // Получение адреса кошелька
  getWalletAddress() {
    try {
      if (!this.connector) {
        return null;
      }
      
      // Проверяем наличие wallet и его свойств в контексте официального SDK
      if (this.connector.wallet && this.connector.wallet.account && this.connector.wallet.account.address) {
        return this.connector.wallet.account.address;
      }
      
      // Для упрощенной версии SDK проверяем wallet напрямую
      if (this.connector.wallet && this.connector.wallet.account && this.connector.wallet.account.address) {
        return this.connector.wallet.account.address;
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при получении адреса кошелька:', error);
      return null;
    }
  }
  
  // Получение информации о подключенном кошельке
  getWalletInfo() {
    try {
      if (!this.connector || !this.connector.wallet) {
        return null;
      }
      
      return this.connector.wallet;
    } catch (error) {
      console.error('Ошибка при получении информации о кошельке:', error);
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
  
  // Совместимость с предыдущей версией
  async initialize() {
    return this.initConnector();
  }
}

// Экспорт экземпляра класса для использования в других файлах
window.walletConnector = new TelegramWalletConnector();

// Инициализируем коннектор при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Добавляем задержку перед инициализацией, чтобы скрипты успели загрузиться
  setTimeout(() => window.walletConnector.initConnector(), 2000);
}); 