// TelegramWalletConnector - класс для взаимодействия с TON Connect
class TelegramWalletConnector {
  constructor() {
    this.connector = null;
    this.isInitialized = false;
    this.retryCount = 0;
    this.manifestUrl = 'https://example.com/tonconnect-manifest.json';
    this.preferredWalletName = 'Telegram Wallet';
    this.storageKey = 'ton-connect-wallet-data';
    this.purchaseHistoryKey = 'ton-connect-purchase-history';
    this.initConnector();
  }

  // Метод инициализации коннектора с повторными попытками
  async initConnector() {
    try {
      console.log('Инициализация Telegram Wallet Connector...');
      
      // Проверка существования SDK
      if (typeof window.tonconnect === 'undefined') {
        throw new Error('TON Connect SDK не загружен');
      }

      // Создание экземпляра коннектора
      this.connector = window.tonconnect.createConnector({
        manifestUrl: this.manifestUrl
      });

      if (this.connector) {
        console.log('TON Connect SDK успешно инициализирован');
        this.isInitialized = true;

        // Попытка восстановить предыдущее подключение
        this.tryRestoreConnection();
        this.restorePreferredWallet();
        
        return true;
      } else {
        throw new Error('Не удалось создать экземпляр коннектора');
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
      const restored = await this.connector.restoreConnection();
      
      if (restored) {
        console.log('Подключение кошелька успешно восстановлено');
        this.connector.onStatusChange((wallet) => {
          if (wallet) {
            // Сохраняем информацию о подключенном кошельке
            this.saveWalletData(wallet);
            
            // Отправляем событие о смене статуса подключения
            const event = new CustomEvent('walletStatusChanged', {
              detail: { connected: true, wallet }
            });
            document.dispatchEvent(event);
          } else {
            // Отправляем событие об отключении кошелька
            const event = new CustomEvent('walletStatusChanged', {
              detail: { connected: false }
            });
            document.dispatchEvent(event);
          }
        });
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

  // Получение списка доступных кошельков
  async getWallets() {
    try {
      if (!this.isInitialized || !this.connector) {
        console.log('Коннектор не инициализирован, невозможно получить список кошельков');
        return [];
      }
      
      // Проверяем, есть ли метод getWallets в коннекторе
      if (typeof this.connector.getWallets === 'function') {
        const wallets = await this.connector.getWallets();
        console.log('Получен список доступных кошельков:', wallets);
        return wallets;
      } else {
        // Возвращаем стандартный список, если метод отсутствует
        console.log('Метод getWallets не найден в коннекторе, используем стандартный список');
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
    } catch (error) {
      console.error('Ошибка при получении списка кошельков:', error);
      return [];
    }
  }

  // Подключение к кошельку
  async connectWallet(walletName = null) {
    try {
      if (!this.isInitialized || !this.connector) {
        throw new Error('Коннектор не инициализирован');
      }

      // Получаем список доступных кошельков
      const walletsList = await this.getWallets();
      console.log('Доступные кошельки:', walletsList);
      
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
      
      // Регистрируем обработчик события изменения статуса
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
          // Отправляем событие об отключении кошелька
          const event = new CustomEvent('walletDisconnected');
          document.dispatchEvent(event);
        }
      });
      
      // Подключаемся к выбранному кошельку
      const connectOptions = {
        universalLink: selectedWallet.universalLink
      };
      
      const { universal } = await this.connector.connect(connectOptions);
      console.log('Получена универсальная ссылка для подключения:', universal);

      // Эмитируем событие для родительского окна
      window.parent.postMessage(
        {
          type: 'ton-connect',
          universal,
          method: 'connect',
          wallet: selectedWallet.name
        }, 
        '*'
      );

      // Перенаправляем пользователя для подключения кошелька
      window.open(universal, '_blank');
      
      return {
        success: true,
        walletName: selectedWallet.name,
        universal
      };
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
      if (!this.isInitialized || !this.connector) {
        return null;
      }
      
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
      
      // Проверяем, есть ли метод sendTransaction в коннекторе
      if (typeof this.connector.sendTransaction === 'function') {
        console.log('Отправка транзакции через коннектор:', transaction);
        return await this.connector.sendTransaction(transaction);
      } else {
        throw new Error('Метод sendTransaction не поддерживается');
      }
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
      
      // Проверяем, есть ли метод purchaseItem в коннекторе
      if (typeof this.connector.purchaseItem === 'function') {
        console.log('Покупка товара через коннектор:', purchase);
        const result = await this.connector.purchaseItem(purchase);
        
        // Если покупка успешна, отправляем событие
        if (result.success) {
          const event = new CustomEvent('purchaseCompleted', {
            detail: {
              ...purchase,
              timestamp: Date.now(),
              wallet: this.getWalletInfo()
            }
          });
          document.dispatchEvent(event);
        }
        
        return result;
      } else {
        // Если метод не поддерживается, пытаемся выполнить транзакцию напрямую
        console.log('Метод purchaseItem не поддерживается, используем sendTransaction');
        
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
      }
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
}

// Создаем глобальный объект telegramWalletConnector
window.telegramWalletConnector = window.telegramWalletConnector || new TelegramWalletConnector();
window.walletConnector = window.telegramWalletConnector;

// Инициализируем коннектор при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Добавляем задержку перед инициализацией, чтобы скрипты успели загрузиться
  setTimeout(() => window.walletConnector.initConnector(), 2000);
}); 