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
    
    // Ключ для хранения данных кошелька в localStorage
    this.storageKey = 'ton-connect-wallet-data';
    
    // Восстанавливаем данные подключения из localStorage
    this.restoreWalletData();
    
    // Инициализация при создании
    this.init();
  }
  
  /**
   * Восстанавливаем данные подключения из localStorage
   */
  restoreWalletData() {
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        const data = JSON.parse(savedData);
        if (data.wallet) {
          this.wallet = data.wallet;
          this.connected = true;
          console.log('Данные кошелька восстановлены из localStorage');
        }
      }
    } catch (error) {
      console.error('Ошибка при восстановлении данных кошелька:', error);
    }
  }
  
  /**
   * Сохраняем данные подключения в localStorage
   */
  saveWalletData() {
    try {
      if (this.wallet) {
        localStorage.setItem(this.storageKey, JSON.stringify({
          wallet: this.wallet,
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
  
  /**
   * Инициализация коннектора
   */
  init() {
    this.isInitialized = true;
    console.log('TonConnector инициализирован');
    
    // Уведомляем подписчиков о текущем состоянии
    if (this.connected && this.wallet) {
      setTimeout(() => {
        this.connectCallbacks.forEach(callback => {
          try {
            callback(this.wallet);
          } catch (e) {
            console.error('Ошибка в обработчике подключения:', e);
          }
        });
      }, 100);
    }
    
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
    const savedWalletData = localStorage.getItem(this.storageKey);
    
    if (savedWalletData) {
      try {
        const walletData = JSON.parse(savedWalletData);
        if (walletData && walletData.wallet) {
          // Эмулируем подключение с сохраненными данными
          const emulated = this.emulateConnection(walletData.wallet);
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
      localStorage.removeItem(this.storageKey);
      
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
    this.saveWalletData();
    
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
  
  /**
   * Отправка транзакции через подключенный кошелек
   * @param {Object} transaction - Данные транзакции
   * @returns {Promise<Object>} - Результат отправки транзакции
   */
  async sendTransaction(transaction) {
    try {
      if (!this.connected || !this.wallet) {
        throw new Error('Кошелек не подключен');
      }
      
      console.log('Запрос на отправку транзакции:', transaction);
      
      // Эмулируем отправку транзакции - в данной упрощенной версии просто имитируем успех
      // В реальном SDK здесь был бы запрос к кошельку
      
      // Создаем имитацию результата транзакции
      const result = {
        boc: `te6ccgECbwEAFxIAAkWIAMj2J1i${Math.random().toString(36).substr(2, 9)}`,
        transaction: {
          from: this.wallet.account.address,
          to: transaction.to || transaction.messages?.[0]?.address,
          amount: transaction.value || transaction.messages?.[0]?.amount || '10000000',
          timestamp: Math.floor(Date.now() / 1000)
        }
      };
      
      // Запрашиваем подтверждение у пользователя
      const confirmMessage = `Подтвердите транзакцию:\n\nОтправитель: ${this.shortenAddress(this.wallet.account.address)}\nПолучатель: ${this.shortenAddress(result.transaction.to)}\nСумма: ${this.formatTON(result.transaction.amount)} TON`;
      
      if (confirm(confirmMessage)) {
        console.log('Транзакция подтверждена пользователем');
        return {
          success: true,
          transaction: result
        };
      } else {
        console.log('Транзакция отклонена пользователем');
        return {
          success: false,
          error: 'Транзакция отклонена пользователем'
        };
      }
    } catch (error) {
      console.error('Ошибка при отправке транзакции:', error);
      return {
        success: false,
        error: error.message || 'Неизвестная ошибка при отправке транзакции'
      };
    }
  }
  
  /**
   * Покупка внутриигрового товара
   * @param {Object} purchase - Данные о покупке
   * @returns {Promise<Object>} - Результат покупки
   */
  async purchaseItem(purchase) {
    try {
      if (!this.connected || !this.wallet) {
        throw new Error('Кошелек не подключен');
      }
      
      if (!purchase.itemId || !purchase.price) {
        throw new Error('Не указаны обязательные поля покупки: itemId, price');
      }
      
      console.log('Запрос на покупку товара:', purchase);
      
      // Преобразуем цену из TON в наноТОН
      const priceNano = String(parseFloat(purchase.price) * 1000000000);
      
      // Формируем транзакцию
      const transaction = {
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
      
      // Запрашиваем подтверждение у пользователя
      const confirmMessage = `Подтвердите покупку:\n\nТовар: ${purchase.itemName || purchase.itemId}\nЦена: ${purchase.price} TON\nКошелек: ${this.shortenAddress(this.wallet.account.address)}`;
      
      if (confirm(confirmMessage)) {
        // Отправляем транзакцию
        const result = await this.sendTransaction(transaction);
        
        // Если транзакция успешна, сохраняем информацию о покупке
        if (result.success) {
          this.savePurchaseHistory({
            itemId: purchase.itemId,
            itemName: purchase.itemName || 'Unknown Item',
            price: purchase.price,
            timestamp: Date.now(),
            transactionHash: result.transaction?.boc || 'unknown'
          });
        }
        
        return {
          ...result,
          purchase: {
            itemId: purchase.itemId,
            itemName: purchase.itemName,
            price: purchase.price
          }
        };
      } else {
        return {
          success: false,
          canceled: true,
          error: 'Покупка отменена пользователем'
        };
      }
    } catch (error) {
      console.error('Ошибка при покупке товара:', error);
      return {
        success: false,
        error: error.message || 'Неизвестная ошибка при покупке товара'
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
      const savedHistory = localStorage.getItem('ton-connect-purchase-history');
      
      if (savedHistory) {
        purchaseHistory = JSON.parse(savedHistory);
      }
      
      // Добавляем новую покупку
      purchaseHistory.push({
        ...purchase,
        walletAddress: this.wallet?.account?.address
      });
      
      // Ограничиваем историю 100 последними покупками
      if (purchaseHistory.length > 100) {
        purchaseHistory = purchaseHistory.slice(-100);
      }
      
      // Сохраняем обновленную историю
      localStorage.setItem('ton-connect-purchase-history', JSON.stringify(purchaseHistory));
      
      console.log('История покупок обновлена:', purchase);
      
      // Отправляем событие о покупке
      this.dispatchPurchaseEvent(purchase);
    } catch (error) {
      console.error('Ошибка при сохранении истории покупок:', error);
    }
  }
  
  /**
   * Отправка события о покупке
   * @param {Object} purchase - Данные о покупке
   */
  dispatchPurchaseEvent(purchase) {
    try {
      const event = new CustomEvent('purchaseCompleted', {
        detail: {
          ...purchase,
          walletAddress: this.wallet?.account?.address,
          walletName: this.wallet?.device?.appName
        }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Ошибка при отправке события о покупке:', error);
    }
  }
  
  /**
   * Получение истории покупок
   * @returns {Array} - История покупок
   */
  getPurchaseHistory() {
    try {
      const savedHistory = localStorage.getItem('ton-connect-purchase-history');
      
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

console.log('TON Connect SDK загружен (упрощенная версия с поддержкой нескольких кошельков и покупок)'); 