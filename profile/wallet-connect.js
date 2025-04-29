// TelegramWalletConnector - класс для взаимодействия с TON Connect с использованием официального SDK
class TelegramWalletConnector {
  constructor() {
    this.connector = null;
    this.walletConnectionSource = null;
    this.wallet = null;
    this.walletInfo = null;
    this.isInitialized = false;
    this.retryCount = 0;
    this.manifestUrl = 'tonconnect-manifest.json';
    this.preferredWalletName = 'Telegram Wallet';
    this.storageKey = 'ton-connect-wallet-data';
    this.purchaseHistoryKey = 'ton-connect-purchase-history';
    
    // Пробуем инициализировать при создании экземпляра
    this.init();
  }

  /**
   * Инициализация TON Connect
   */
  init() {
    if (typeof TonConnectSDK !== 'undefined') {
      try {
        // Создаем новый экземпляр TonConnect
        this.connector = new TonConnectSDK.TonConnect({ 
          manifestUrl: this.manifestUrl 
        });
        
        // Обрабатываем статус подключения
        this.connector.onStatusChange((wallet) => {
          if (wallet) {
            this.wallet = wallet;
            this.walletInfo = wallet;
            this.walletConnectionSource = null;
            
            // Если пользователь подключен, сохраняем его предпочтительный кошелек
            if (wallet.device && wallet.device.appName) {
              this.setPreferredWallet(wallet.device.appName);
            }
            
            // Создаем и диспатчим событие подключения кошелька
            const connectedEvent = new CustomEvent('walletConnected', {
              detail: { wallet: wallet }
            });
            document.dispatchEvent(connectedEvent);
            
            console.log('Кошелек подключен:', wallet);
          } else {
            // Кошелек был отключен
            this.wallet = null;
            this.walletInfo = null;
            this.walletConnectionSource = null;
            
            // Создаем и диспатчим событие отключения кошелька
            const disconnectedEvent = new CustomEvent('walletDisconnected');
            document.dispatchEvent(disconnectedEvent);
            
            console.log('Кошелек отключен');
          }
        });
        
        // Восстанавливаем сессию, если пользователь уже был подключен
        this.connector.restoreConnection();
        
        console.log('TON Connect успешно инициализирован');
        this.isInitialized = true;
      } catch (error) {
        console.error('Ошибка при инициализации TON Connect:', error);
      }
    } else {
      console.error('TonConnectSDK не определен. Убедитесь, что скрипт загружен корректно.');
    }
  }

  /**
   * Получение списка доступных кошельков
   * @returns {Promise<Array>} Список доступных кошельков
   */
  async getWallets() {
    if (!this.connector) {
      console.error('Ошибка: connector не инициализирован');
      return [];
    }
    
    try {
      // Получаем список доступных кошельков
      const wallets = await this.connector.getWallets();
      console.log('Доступные кошельки:', wallets);
      
      // Добавляем предпочтительный кошелек в начало списка
      const preferredWallet = this.getPreferredWallet();
      if (preferredWallet) {
        // Перемещаем предпочтительный кошелек в начало списка
        const reorderedWallets = wallets.sort((a, b) => {
          if (a.name.toLowerCase().includes(preferredWallet.toLowerCase())) return -1;
          if (b.name.toLowerCase().includes(preferredWallet.toLowerCase())) return 1;
          return 0;
        });
        return reorderedWallets;
      }
      
      return wallets;
    } catch (error) {
      console.error('Ошибка при получении списка кошельков:', error);
      return [];
    }
  }

  /**
   * Подключение к кошельку
   * @param {string} walletName - Название кошелька для подключения
   * @returns {Promise<boolean>} Результат подключения
   */
  async connectWallet(walletName = null) {
    if (!this.connector) {
      console.error('Ошибка: connector не инициализирован');
      return false;
    }
    
    try {
      // Если кошелек уже подключен, возвращаем true
      if (this.isWalletConnected()) {
        console.log('Кошелек уже подключен');
        return true;
      }
      
      // Получаем список доступных кошельков
      const wallets = await this.connector.getWallets();
      
      if (!wallets || wallets.length === 0) {
        console.error('Нет доступных кошельков для подключения');
        return false;
      }
      
      // Если указано имя кошелька, находим его в списке
      let selectedWallet = null;
      if (walletName) {
        selectedWallet = wallets.find(w => 
          w.name.toLowerCase() === walletName.toLowerCase() || 
          w.name.toLowerCase().includes(walletName.toLowerCase())
        );
      }
      
      // Если кошелек не найден, используем первый в списке или предпочтительный
      if (!selectedWallet) {
        const preferredWallet = this.getPreferredWallet();
        if (preferredWallet) {
          selectedWallet = wallets.find(w => 
            w.name.toLowerCase().includes(preferredWallet.toLowerCase())
          );
        }
        
        // Если предпочтительный не найден, берем первый в списке
        if (!selectedWallet) {
          selectedWallet = wallets[0];
        }
      }
      
      // Получаем универсальную ссылку для подключения
      const universalLink = this.connector.connect({ bridgeUrl: selectedWallet.bridgeUrl });
      
      // Если мы находимся в мобильном устройстве, открываем univeralLink
      if (this.isMobile()) {
        // Сохраняем источник подключения для последующей проверки
        this.walletConnectionSource = selectedWallet.name;
        
        // Открываем ссылку в текущем окне для мобильных устройств
        window.location.href = universalLink;
      } else {
        // Для десктопа показываем QR-код
        // Здесь должна быть логика для отображения QR-кода
        console.log('Universal Link для подключения:', universalLink);
        
        // Пример: можно использовать библиотеку qrcode.js для генерации QR-кода
        // Или отображать ссылку для ручного копирования
        alert(`Пожалуйста, отсканируйте QR-код с помощью ${selectedWallet.name} или откройте эту ссылку на мобильном устройстве: ${universalLink}`);
      }
      
      // Сохраняем предпочтительный кошелек
      this.setPreferredWallet(selectedWallet.name);
      
      return true;
    } catch (error) {
      console.error('Ошибка при подключении кошелька:', error);
      return false;
    }
  }

  /**
   * Отключение от кошелька
   * @returns {Promise<boolean>} Результат отключения
   */
  async disconnectWallet() {
    if (!this.connector) {
      console.error('Ошибка: connector не инициализирован');
      return false;
    }
    
    try {
      await this.connector.disconnect();
      this.wallet = null;
      this.walletInfo = null;
      this.walletConnectionSource = null;
      return true;
    } catch (error) {
      console.error('Ошибка при отключении кошелька:', error);
      return false;
    }
  }

  /**
   * Проверка, подключен ли кошелек
   * @returns {boolean} Статус подключения
   */
  isWalletConnected() {
    return !!this.wallet;
  }

  /**
   * Получение информации о подключенном кошельке
   * @returns {Object|null} Информация о кошельке
   */
  getWalletInfo() {
    return this.walletInfo;
  }

  /**
   * Проверка, используется ли мобильное устройство
   * @returns {boolean} true, если используется мобильное устройство
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  /**
   * Сохранение предпочтительного кошелька
   * @param {string} walletName - Название кошелька
   */
  setPreferredWallet(walletName) {
    if (walletName) {
      localStorage.setItem('preferred-wallet', walletName);
    }
  }
  
  /**
   * Получение названия предпочтительного кошелька
   * @returns {string|null} Название предпочтительного кошелька
   */
  getPreferredWallet() {
    return localStorage.getItem('preferred-wallet');
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

  // Отправка транзакции через подключенный кошелек
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
}

// Создаем глобальный объект telegramWalletConnector
window.telegramWalletConnector = window.telegramWalletConnector || new TelegramWalletConnector();
window.walletConnector = window.telegramWalletConnector;

// Инициализируем коннектор при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Добавляем задержку перед инициализацией, чтобы скрипты успели загрузиться
  setTimeout(() => window.walletConnector.init(), 500);
}); 