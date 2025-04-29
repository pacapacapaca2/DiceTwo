// TelegramWalletConnector - класс для взаимодействия с TON Connect с использованием официального SDK
class TelegramWalletConnector {
  constructor() {
    this.connector = null;
    this.isInitialized = false;
    this.retryCount = 0;
    this.manifestUrl = 'https://pacapacapaca2.github.io/DiceTwo/profile/tonconnect-manifest.json';
    this.preferredWalletName = 'Telegram Wallet';
    this.storageKey = 'ton-connect-wallet-data';
    this.purchaseHistoryKey = 'ton-connect-purchase-history';
    
    // Пробуем инициализировать при создании экземпляра
    this.initConnector();
  }

  // Метод инициализации коннектора с повторными попытками
  async initConnector() {
    try {
      console.log('Инициализация TON Connect...');
      
      // Проверка существования официального SDK 
      if (typeof window.TonConnectSDK !== 'undefined') {
        console.log('Найден глобальный объект TonConnectSDK');
        
        // Создание экземпляра коннектора
        this.connector = new window.TonConnectSDK.TonConnect({
          manifestUrl: this.manifestUrl
        });

        if (!this.connector) {
          throw new Error('Не удалось создать экземпляр TON Connect');
        }
      
        console.log('TON Connect успешно инициализирован');
        this.isInitialized = true;

        // После успешной инициализации пробуем восстановить соединение
        this.tryRestoreConnection();
      
        return true;
      } else {
        console.log('Глобальный объект TonConnectSDK не найден');
        throw new Error('TON Connect SDK не загружен');
      }
    } catch (error) {
      console.error('Ошибка при инициализации TON Connect:', error);

      this.retryCount++;
      if (this.retryCount < 3) {
        console.log(`Повторная попытка инициализации (${this.retryCount}/3)...`);
        setTimeout(() => this.initConnector(), 1000);
      } else {
        console.error('Превышено максимальное количество попыток инициализации');
      }

      return false;
    }
  }
  
  /**
   * Восстановление предпочитаемого кошелька из localStorage
   */
  restorePreferredWallet() {
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        const data = JSON.parse(savedData);
        if (data.wallet && data.wallet.device && data.wallet.device.appName) {
          this.preferredWalletName = data.wallet.device.appName;
          console.log(`Восстановлен предпочитаемый кошелек: ${this.preferredWalletName}`);
        }
      }
    } catch (error) {
      console.error('Ошибка при восстановлении предпочитаемого кошелька:', error);
    }
  }
  
  /**
   * Сохранение данных о кошельке в localStorage
   * @param {Object} walletInfo - Информация о кошельке
   */
  saveWalletData(walletInfo) {
    try {
      if (walletInfo) {
        // Сохраняем предпочитаемый кошелек
        if (walletInfo.device && walletInfo.device.appName) {
          this.preferredWalletName = walletInfo.device.appName;
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify({
          wallet: walletInfo,
          connectedAt: new Date().toISOString()
        }));
        console.log('Данные кошелька сохранены в localStorage');
      } else {
        localStorage.removeItem(this.storageKey);
        console.log('Данные кошелька удалены из localStorage');
      }
    } catch (error) {
      console.error('Ошибка при сохранении данных кошелька:', error);
    }
  }

  // Попытка восстановить предыдущее подключение
  async tryRestoreConnection() {
    try {
      if (!this.isInitialized || !this.connector) {
        console.log('Коннектор не инициализирован, невозможно восстановить подключение');
        return false;
      }

      console.log('Попытка восстановить предыдущее подключение кошелька...');
      
      // Восстанавливаем предпочитаемый кошелек
      this.restorePreferredWallet();
      
      // Пытаемся восстановить соединение с кошельком
      const restored = await this.connector.restoreConnection();
      
      if (restored) {
        console.log('Подключение кошелька успешно восстановлено');
        
        // Устанавливаем обработчик изменения статуса подключения
        this.setupWalletStatusChangeListener();
        
        return true;
      } else {
        console.log('Не удалось восстановить предыдущее подключение');
        return false;
      }
    } catch (error) {
      console.error('Ошибка при восстановлении подключения:', error);
      return false;
    }
  }
  
  // Настройка слушателя событий изменения статуса кошелька
  setupWalletStatusChangeListener() {
    if (!this.connector) return;
    
    this.connector.onStatusChange((wallet) => {
      if (wallet) {
        console.log('Кошелек подключен:', wallet);
        // Сохраняем информацию о подключенном кошельке
        this.saveWalletData(wallet);
        
        // Отправляем событие о подключении кошелька
        const event = new CustomEvent('walletConnected', {
          detail: { wallet }
        });
        document.dispatchEvent(event);
      } else {
        console.log('Кошелек отключен');
        // Удаляем сохраненные данные
        this.saveWalletData(null);
        
        // Отправляем событие об отключении кошелька
        const event = new CustomEvent('walletDisconnected');
        document.dispatchEvent(event);
      }
    });
    
    // Добавляем слушатель события сообщения от iframe или других окон
    window.addEventListener('message', (event) => {
      try {
        const data = event.data;
        
        // Проверяем, что это сообщение от TON Connect
        if (data && data.type === 'ton-connect-callback') {
          console.log('Получено сообщение от кошелька:', data);
          
          // Обрабатываем успешное подключение
          if (data.event === 'connect' && data.payload) {
            // Имитируем подключение кошелька
            this.saveWalletData({
              account: {
                address: data.payload.address || data.payload.ton_addr,
                chain: data.payload.network || 'mainnet',
                publicKey: data.payload.publicKey
              },
              device: {
                appName: data.walletName || this.preferredWalletName,
                appVersion: data.version || '1.0'
              }
            });
            
            // Отправляем событие о подключении кошелька
            const event = new CustomEvent('walletConnected', {
              detail: { wallet: this.getWalletInfo() }
            });
            document.dispatchEvent(event);
          }
        }
      } catch (error) {
        console.error('Ошибка при обработке сообщения от кошелька:', error);
      }
    });
  }

  // Получение списка доступных кошельков
  async getWallets() {
    try {
      if (!this.isInitialized || !this.connector) {
        console.log('Коннектор не инициализирован, невозможно получить список кошельков');
        const initialized = await this.initConnector();
        if (!initialized) return [];
      }
      
      // Получаем список кошельков из экземпляра TonConnect
      const wallets = await this.connector.getWallets();
      console.log('Получен список доступных кошельков:', wallets);
      return wallets;
    } catch (error) {
      console.error('Ошибка при получении списка кошельков:', error);
      
      // В случае ошибки возвращаем стандартный список
      return [
        {
          name: 'Telegram Wallet',
          universalLink: 'https://t.me/wallet',
          bridgeUrl: 'https://bridge.tonapi.io/bridge',
          aboutUrl: 'https://t.me/wallet',
          imageUrl: 'https://wallet.tg/images/logo_filled.svg'
        },
        {
          name: 'Tonkeeper',
          universalLink: 'https://app.tonkeeper.com/ton-connect',
          bridgeUrl: 'https://bridge.tonapi.io/bridge',
          aboutUrl: 'https://tonkeeper.com',
          imageUrl: 'https://tonkeeper.com/assets/tonconnect-icon.png'
        }
      ];
    }
  }

  // Подключение к кошельку
  async connectWallet(walletName = null) {
    try {
      if (!this.isInitialized || !this.connector) {
        const initialized = await this.initConnector();
        if (!initialized) {
          throw new Error('Не удалось инициализировать TON Connect');
        }
      }

      // Получаем список доступных кошельков
      const walletsList = await this.getWallets();
      console.log('Доступные кошельки для подключения:', walletsList);
      
      // Определяем кошелек для подключения
      let selectedWallet = null;
      
      if (walletName) {
        // Ищем кошелек по имени, если указано
        selectedWallet = walletsList.find(w => 
          w.name.toLowerCase() === walletName.toLowerCase() ||
          w.name.toLowerCase().includes(walletName.toLowerCase()) ||
          walletName.toLowerCase().includes(w.name.toLowerCase())
        );
      }
      
      // Если кошелек не найден по имени или имя не указано,
      // используем предпочитаемый кошелек
      if (!selectedWallet && this.preferredWalletName) {
        selectedWallet = walletsList.find(w => 
          w.name.toLowerCase() === this.preferredWalletName.toLowerCase() ||
          w.name.toLowerCase().includes(this.preferredWalletName.toLowerCase())
        );
      }
      
      // Если всё еще не найден, используем первый доступный кошелек
      if (!selectedWallet && walletsList.length > 0) {
        selectedWallet = walletsList[0];
      }
      
      if (!selectedWallet) {
        throw new Error('Не удалось найти подходящий кошелек для подключения');
      }
      
      console.log(`Выбран кошелек для подключения: ${selectedWallet.name}`);
      
      // Настраиваем обработчик изменения статуса
      this.setupWalletStatusChangeListener();
      
      // Подключаемся к выбранному кошельку
      try {
        // Создаем объект с опциями для подключения
        const connectRequest = {
          items: [{ name: 'ton_addr' }]
        };
        
        // Получаем ссылку для подключения
        const universalLink = selectedWallet.universalLink || selectedWallet.bridgeUrl;
        
        if (!universalLink) {
          throw new Error('У выбранного кошелька отсутствует universalLink или bridgeUrl');
        }

        // Создаем URL для перехода к кошельку (используем Telegram если это Telegram Wallet)
        let connectUrl;
        
        // Проверяем, является ли это Telegram кошельком
        if (selectedWallet.name.toLowerCase().includes('telegram') || 
            universalLink.toLowerCase().includes('t.me') || 
            universalLink.toLowerCase().includes('telegram')) {
          
          // Формат для Telegram Wallet
          const telegramAppName = 'tonconnect';
          const telegramStartParams = `v=2&id=${this.connector.sessionCrypto?.sessionId || Math.random().toString(36).substring(2)}&r=${encodeURIComponent(JSON.stringify(connectRequest))}`;
          
          // Создаем ссылку для Telegram Wallet
          connectUrl = `${universalLink}/start?startapp=${telegramAppName}-${telegramStartParams.replaceAll('=', '__').replaceAll('&', '-')}`;
        } else {
          // Формат для других кошельков
          connectUrl = `${universalLink}?v=2&id=${this.connector.sessionCrypto?.sessionId || Math.random().toString(36).substring(2)}&r=${encodeURIComponent(JSON.stringify(connectRequest))}`;
        }
        
        console.log('Получена универсальная ссылка для подключения:', connectUrl);
        
        // Перенаправляем пользователя для подключения кошелька
        if (window.parent && window.parent !== window) {
          // Если страница загружена в iframe, отправляем сообщение родителю
          window.parent.postMessage(
            {
              type: 'ton-connect',
              universal: connectUrl,
              method: 'connect',
              wallet: selectedWallet.name
            }, 
            '*'
          );
        } else {
          // Иначе открываем ссылку в новом окне/вкладке
          window.open(connectUrl, '_blank');
        }
        
        return {
          success: true,
          walletName: selectedWallet.name,
          universal: connectUrl
        };
      } catch (error) {
        console.error('Ошибка при создании ссылки для подключения:', error);
        throw new Error('Не удалось создать ссылку для подключения кошелька');
      }
    } catch (error) {
      console.error('Ошибка при подключении кошелька:', error);
      
      return {
        success: false,
        error: error.message || 'Не удалось подключить кошелек'
      };
    }
  }

  // Отключение кошелька
  async disconnectWallet() {
    try {
      if (!this.isInitialized || !this.connector) {
        throw new Error('Коннектор не инициализирован');
      }

      await this.connector.disconnect();
      
      // Удаляем сохраненные данные о подключении
      this.saveWalletData(null);
      
      console.log('Кошелек успешно отключен');
      return true;
    } catch (error) {
      console.error('Ошибка при отключении кошелька:', error);
      return false;
    }
  }
  
  /**
   * Получение информации о подключенном кошельке
   * @returns {Object|null} - Информация о кошельке или null, если кошелек не подключен
   */
  getWalletInfo() {
    try {
      if (!this.isInitialized) return null;
      
      // Проверяем информацию о кошельке из коннектора
      if (this.connector && this.connector.wallet) {
        return this.connector.wallet;
      }
      
      // Если в коннекторе нет информации, проверяем localStorage
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        const data = JSON.parse(savedData);
        if (data.wallet) {
          return data.wallet;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при получении информации о кошельке:', error);
      return null;
    }
  }
  
  /**
   * Проверка, подключен ли кошелек
   * @returns {boolean} - True, если кошелек подключен
   */
  isWalletConnected() {
    // Для совместимости с интерфейсом возвращаем булево значение
    const walletInfo = this.getWalletInfo();
    return !!walletInfo;
  }
  
  /**
   * Отправка транзакции через подключенный кошелек
   * @param {Object} transaction - Данные транзакции
   * @returns {Promise<Object>} - Результат отправки транзакции
   */
  async sendTransaction(transaction) {
    try {
      if (!this.isInitialized || !this.connector) {
        throw new Error('Коннектор не инициализирован');
      }
      
      if (!this.isWalletConnected()) {
        throw new Error('Кошелек не подключен');
      }
      
      console.log('Отправка транзакции через TON Connect:', transaction);
      
      // Проверяем, что транзакция имеет правильный формат для TON Connect
      if (!transaction.validUntil) {
        // Устанавливаем срок действия транзакции по умолчанию (5 минут)
        transaction.validUntil = Math.floor(Date.now() / 1000) + 300;
      }
      
      // Отправляем транзакцию через коннектор
      const result = await this.connector.sendTransaction(transaction);
      console.log('Результат отправки транзакции:', result);
      
      return {
        success: true,
        transaction: result
      };
    } catch (error) {
      console.error('Ошибка при отправке транзакции:', error);
      return {
        success: false,
        error: error.message || 'Не удалось отправить транзакцию'
      };
    }
  }
  
  /**
   * Покупка внутриигрового товара
   * @param {Object} purchase - Данные о покупке (itemId, itemName, price)
   * @returns {Promise<Object>} - Результат покупки
   */
  async purchaseItem(purchase) {
    try {
      if (!this.isInitialized || !this.connector) {
        throw new Error('Коннектор не инициализирован');
      }
      
      if (!this.isWalletConnected()) {
        throw new Error('Кошелек не подключен');
      }
      
      if (!purchase.itemId || !purchase.price) {
        throw new Error('Не указаны обязательные поля покупки: itemId, price');
      }
      
      console.log('Запрос на покупку товара:', purchase);
      
      // Преобразуем цену из TON в наноТОН
      const priceNano = String(parseFloat(purchase.price) * 1000000000);
      
      // Формируем транзакцию для покупки товара
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
        messages: [{
          address: purchase.receiptAddress || 'EQDrjaLahLkMB-hMCmkzOyBuHJ139ZUYmPHu6RRBKnbdLIYI',
          amount: priceNano,
          payload: JSON.stringify({
            type: 'purchase',
            item_id: purchase.itemId,
            item_name: purchase.itemName || 'Unknown Item',
            timestamp: Date.now()
          })
        }]
      };
      
      // Отправляем транзакцию через коннектор
      const result = await this.sendTransaction(transaction);
      
      // Если транзакция успешна, сохраняем информацию о покупке и отправляем событие
      if (result.success) {
        const purchaseData = {
          itemId: purchase.itemId,
          itemName: purchase.itemName || 'Unknown Item',
          price: purchase.price,
          timestamp: Date.now(),
          transactionHash: result.transaction?.boc || 'unknown',
          wallet: this.getWalletInfo()
        };
        
        this.savePurchaseHistory(purchaseData);
        
        const event = new CustomEvent('purchaseCompleted', {
          detail: purchaseData
        });
        document.dispatchEvent(event);
      }
      
      return {
        ...result,
        purchase: {
          itemId: purchase.itemId,
          itemName: purchase.itemName,
          price: purchase.price
        }
      };
    } catch (error) {
      console.error('Ошибка при покупке товара:', error);
      return {
        success: false,
        error: error.message || 'Не удалось выполнить покупку'
      };
    }
  }
  
  /**
   * Сохранение истории покупок
   * @param {Object} purchase - Данные о покупке
   */
  savePurchaseHistory(purchase) {
    try {
      // Получаем текущую историю покупок из localStorage
      let purchaseHistory = [];
      const savedHistory = localStorage.getItem(this.purchaseHistoryKey);
      
      if (savedHistory) {
        purchaseHistory = JSON.parse(savedHistory);
      }
      
      // Добавляем новую покупку
      purchaseHistory.push(purchase);
      
      // Ограничиваем историю 100 последними покупками
      if (purchaseHistory.length > 100) {
        purchaseHistory = purchaseHistory.slice(-100);
      }
      
      // Сохраняем обновленную историю
      localStorage.setItem(this.purchaseHistoryKey, JSON.stringify(purchaseHistory));
      
      console.log('История покупок обновлена:', purchase);
    } catch (error) {
      console.error('Ошибка при сохранении истории покупок:', error);
    }
  }
  
  /**
   * Получение истории покупок
   * @returns {Array} - История покупок
   */
  getPurchaseHistory() {
    try {
      const savedHistory = localStorage.getItem(this.purchaseHistoryKey);
      
      if (savedHistory) {
        return JSON.parse(savedHistory);
      }
      
      return [];
    } catch (error) {
      console.error('Ошибка при получении истории покупок:', error);
      return [];
    }
  }
  
  /**
   * Форматирование суммы в TON
   * @param {string|number} nanotons - Сумма в наноТОН
   * @returns {string} - Форматированная строка в TON
   */
  formatTON(nanotons) {
    try {
      const amount = BigInt(nanotons);
      return (Number(amount) / 1000000000).toFixed(4);
    } catch (error) {
      return '0';
    }
  }
  
  /**
   * Сокращение адреса кошелька
   * @param {string} address - Полный адрес кошелька
   * @returns {string} - Сокращенный адрес
   */
  shortenAddress(address) {
    if (!address || typeof address !== 'string') {
      return '';
    }
    
    if (address.length <= 12) {
      return address;
    }
    
    return address.slice(0, 6) + '...' + address.slice(-6);
  }

  /**
   * Установка предпочитаемого кошелька
   * @param {string} walletName - Название кошелька
   */
  setPreferredWallet(walletName) {
    if (walletName && typeof walletName === 'string') {
      this.preferredWalletName = walletName;
      console.log(`Установлен предпочитаемый кошелек: ${walletName}`);
      
      try {
        // Сохраняем предпочитаемый кошелек в localStorage
        const savedData = localStorage.getItem(this.storageKey);
        const data = savedData ? JSON.parse(savedData) : { wallet: null };
        
        localStorage.setItem(this.storageKey, JSON.stringify({
          ...data,
          preferredWalletName: walletName,
          updatedAt: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Ошибка при сохранении предпочитаемого кошелька:', error);
      }
    }
  }
}

// Создаем глобальный объект telegramWalletConnector
window.telegramWalletConnector = window.telegramWalletConnector || new TelegramWalletConnector();
window.walletConnector = window.telegramWalletConnector;

// Инициализируем коннектор при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Добавляем задержку перед инициализацией, чтобы скрипты успели загрузиться
  setTimeout(() => window.walletConnector.initConnector(), 500);
}); 