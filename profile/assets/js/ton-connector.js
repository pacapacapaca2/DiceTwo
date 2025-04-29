/**
 * Упрощенная реализация TON Connect для Telegram Mini App
 * Эта версия не зависит от официального SDK
 */
class TonConnector {
  constructor(options = {}) {
    this.manifestUrl = options.manifestUrl || null;
    this.connectCallbacks = [];
    this.wallet = null;
    this.connected = false;
    this.isInitialized = false;
    
    // Списки доступных кошельков
    this.walletsList = [
      {
        name: 'Telegram Wallet',
        universalLink: 'https://t.me/wallet',
        bridgeUrl: 'https://bridge.tonapi.io/bridge',
        aboutUrl: 'https://t.me/wallet',
        imageUrl: 'https://wallet.tg/images/logo_filled.svg',
        platforms: ['ios', 'android', 'web']
      },
      {
        name: 'Tonkeeper',
        universalLink: 'https://app.tonkeeper.com/ton-connect',
        bridgeUrl: 'https://bridge.tonapi.io/bridge',
        aboutUrl: 'https://tonkeeper.com',
        imageUrl: 'https://tonkeeper.com/assets/tonconnect-icon.png',
        platforms: ['ios', 'android', 'web']
      },
      {
        name: 'Tonhub',
        universalLink: 'https://tonhub.com/ton-connect',
        bridgeUrl: 'https://connect.tonhubapi.com/bridge',
        aboutUrl: 'https://tonhub.com',
        imageUrl: 'https://tonhub.com/tonconnect_logo.png',
        platforms: ['ios', 'android']
      },
      {
        name: 'OpenMask',
        universalLink: 'https://www.openmask.app/ton-connect',
        bridgeUrl: 'https://bridge.tonapi.io/bridge',
        aboutUrl: 'https://www.openmask.app/',
        imageUrl: 'https://openmask.app/logo_om.png',
        platforms: ['chrome', 'firefox']
      }
    ];
    
    // Инициализация при создании
    this.init();
  }
  
  /**
   * Инициализация коннектора
   */
  init() {
    this.isInitialized = true;
    console.log('TonConnector инициализирован');
    return true;
  }
  
  /**
   * Получение списка доступных кошельков
   * @returns {Promise<Array>} - Список доступных кошельков
   */
  getWallets() {
    return Promise.resolve(this.walletsList);
  }
  
  /**
   * Подписка на изменения статуса подключения
   * @param {Function} callback - Функция, вызываемая при изменении статуса
   */
  onStatusChange(callback) {
    if (typeof callback === 'function') {
      this.connectCallbacks.push(callback);
      
      // Сразу вызываем колбэк с текущим состоянием
      if (this.connected && this.wallet) {
        callback(this.wallet);
      } else {
        callback(null);
      }
    }
    
    return () => {
      this.connectCallbacks = this.connectCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Генерация ссылки для подключения кошелька
   * @param {Object} options - Опции подключения
   * @returns {Promise<Object>} - Объект с ссылкой для подключения
   */
  connect(options = {}) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.manifestUrl) {
          reject(new Error('Не указан URL манифеста'));
          return;
        }
        
        // Определяем кошелек для подключения
        let walletConfig;
        
        // Если указан universalLink - используем его для поиска кошелька
        if (options.universalLink) {
          // Ищем кошелек по universalLink
          walletConfig = this.walletsList.find(wallet => 
            wallet.universalLink === options.universalLink ||
            wallet.universalLink.includes(options.universalLink) ||
            options.universalLink.includes(wallet.name.toLowerCase())
          );
        }
        
        // Если не найден - ищем Telegram Wallet
        if (!walletConfig) {
          walletConfig = this.walletsList.find(wallet => 
            wallet.name === 'Telegram Wallet'
          );
        }
        
        // Если всё еще не найден - используем первый доступный
        if (!walletConfig) {
          walletConfig = this.walletsList[0];
        }
        
        console.log(`Выбран кошелек для подключения: ${walletConfig.name}`);
        
        // Возвращаем универсальную ссылку выбранного кошелька
        resolve({ universal: walletConfig.universalLink });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Восстановление соединения с кошельком
   * @returns {Promise<boolean>} - Результат восстановления соединения
   */
  restoreConnection() {
    // Проверяем, есть ли сохраненные данные о подключении в localStorage
    const savedWalletData = localStorage.getItem('tonconnect-wallet');
    
    if (savedWalletData) {
      try {
        const walletData = JSON.parse(savedWalletData);
        if (walletData && walletData.account) {
          // Эмулируем подключение с сохраненными данными
          const emulated = this.emulateConnection(walletData);
          return Promise.resolve(emulated);
        }
      } catch (e) {
        console.error('Ошибка при восстановлении подключения:', e);
      }
    }
    
    return Promise.resolve(false);
  }
  
  /**
   * Отключение кошелька
   * @returns {Promise<boolean>} - Результат отключения
   */
  disconnect() {
    if (this.connected) {
      this.wallet = null;
      this.connected = false;
      
      // Удаляем сохраненные данные о подключении
      localStorage.removeItem('tonconnect-wallet');
      
      // Уведомляем подписчиков
      this.connectCallbacks.forEach(callback => {
        try {
          callback(null);
        } catch (e) {
          console.error('Ошибка в обработчике отключения:', e);
        }
      });
      
      return Promise.resolve(true);
    }
    
    return Promise.resolve(false);
  }
  
  /**
   * Эмуляция успешного подключения кошелька (для тестирования)
   * @param {Object} walletInfo - Информация о кошельке
   */
  emulateConnection(walletInfo) {
    if (!walletInfo || !walletInfo.account || !walletInfo.account.address) {
      console.error('Недопустимая информация о кошельке');
      return false;
    }
    
    this.wallet = walletInfo;
    this.connected = true;
    
    // Сохраняем данные о подключении
    try {
      localStorage.setItem('tonconnect-wallet', JSON.stringify(walletInfo));
    } catch (e) {
      console.error('Ошибка при сохранении данных о кошельке:', e);
    }
    
    // Уведомляем подписчиков
    this.connectCallbacks.forEach(callback => {
      try {
        callback(this.wallet);
      } catch (e) {
        console.error('Ошибка в обработчике подключения:', e);
      }
    });
    
    return true;
  }
  
  /**
   * Создает кошелек с тестовыми данными
   * @param {string} walletName - Название кошелька
   * @returns {Object} - Объект с данными кошелька
   */
  createTestWallet(walletName = 'Telegram Wallet') {
    const walletConfig = this.walletsList.find(w => w.name === walletName) || this.walletsList[0];
    
    return {
      account: {
        address: 'EQDrjaLahLkMB-hMCmkzOyBuHJ139ZUYmPHu6RRBKnbdLIYI',
        chain: 'MAINNET',
        walletType: 'ton_connect'
      },
      device: {
        platform: 'web',
        appName: walletConfig.name,
        appVersion: '1.0.0',
        deviceModel: 'web'
      },
      provider: walletConfig
    };
  }
}

// Создаем глобальный объект TonConnect для совместимости
window.TonConnect = TonConnector;

// Для обратной совместимости создаем также интерфейс tonconnect
window.tonconnect = {
  // Метод создания коннектора (для совместимости с API TON Connect)
  createConnector: function(options) {
    return new TonConnector(options);
  }
};

console.log('TON Connect SDK загружен (упрощенная версия с поддержкой нескольких кошельков)'); 