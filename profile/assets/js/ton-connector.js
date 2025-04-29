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
        
        // Генерируем ссылку для Tonkeeper
        const universal = 'https://app.tonkeeper.com/ton-connect';
        
        if (universal) {
          resolve({ universal });
        } else {
          reject(new Error('Не удалось сгенерировать ссылку для подключения'));
        }
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

console.log('TON Connect SDK загружен (упрощенная версия)'); 