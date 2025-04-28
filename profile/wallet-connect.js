// Интеграция с Telegram Wallet через TON Connect
class TelegramWalletConnector {
  constructor() {
    this.isInitialized = false;
    this.tonConnectManifestUrl = window.location.origin + '/tonconnect-manifest.json';
    this.connectionState = null;
    this.dAppName = 'DiceTwo';
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Проверяем, доступен ли объект window.Telegram
      if (!window.Telegram || !window.Telegram.WebApp) {
        console.error('Telegram WebApp API не доступен');
        return false;
      }

      // Проверяем, поддерживает ли устройство TON Connect
      const hasTonConnect = window.Telegram.WebApp.initDataUnsafe && 
                          window.Telegram.WebApp.initDataUnsafe.user && 
                          !!window.TonConnect;
      
      if (!hasTonConnect) {
        console.warn('TON Connect не поддерживается или не инициализирован');
      }

      this.isInitialized = true;
      console.log('TelegramWalletConnector инициализирован');
      return true;
    } catch (error) {
      console.error('Ошибка при инициализации TelegramWalletConnector:', error);
      return false;
    }
  }

  async connectWallet() {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        console.error('Не удалось инициализировать TelegramWalletConnector');
        return false;
      }
    }

    try {
      // Проверяем, доступен ли встроенный кошелек
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTonWallet) {
        console.log('Открываем встроенный TON Wallet');
        
        // Открываем встроенный кошелек 
        window.Telegram.WebApp.openTonWallet({
          callback_url: window.location.origin + window.location.pathname,
        });
        
        return true;
      } else {
        console.log('Встроенный TON Wallet не доступен, пробуем использовать TON Connect');
        
        // Если доступен TON Connect, используем его
        if (window.TonConnect) {
          // Создаем запрос на подключение через TON Connect
          const connector = new window.TonConnect({
            manifestUrl: this.tonConnectManifestUrl
          });
          
          // Получаем список доступных кошельков
          const wallets = await connector.getWallets();
          
          // Находим кошелек Telegram
          const telegramWallet = wallets.find(wallet => 
            wallet.name.toLowerCase() === 'telegram wallet' || 
            wallet.appName.toLowerCase() === 'telegram-wallet'
          );
          
          if (telegramWallet) {
            // Формируем ссылку для подключения
            const universalLink = connector.connect({
              universalLink: telegramWallet.universalLink,
              bridgeUrl: telegramWallet.bridgeUrl
            });
            
            console.log('Ссылка для подключения TON Connect:', universalLink);
            
            // Подписываемся на изменения статуса подключения
            connector.onStatusChange(walletInfo => {
              this.connectionState = walletInfo;
              console.log('Статус подключения:', walletInfo);
              
              // Вызываем событие изменения статуса кошелька
              const event = new CustomEvent('walletStatusChange', { detail: walletInfo });
              document.dispatchEvent(event);
            });
            
            // Восстанавливаем соединение, если оно было ранее
            connector.restoreConnection();
            
            // Если кошелек уже подключен, возвращаем true
            if (connector.connected) {
              console.log('Кошелек уже подключен:', connector.wallet);
              return true;
            }
            
            // Иначе открываем ссылку для подключения
            window.location.href = universalLink;
            return true;
          } else {
            console.warn('Кошелек Telegram не найден в списке доступных кошельков');
          }
        } else {
          console.error('TON Connect не доступен');
        }
      }
    } catch (error) {
      console.error('Ошибка при подключении кошелька:', error);
    }
    
    return false;
  }

  // Проверяет, подключен ли кошелек
  async isWalletConnected() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Проверяем наличие данных о подключении в localStorage
      const savedWalletStatus = localStorage.getItem("walletConnected");
      if (savedWalletStatus === "true") {
        return true;
      }
      
      // Если используется TON Connect, проверяем состояние подключения
      if (window.TonConnect) {
        const connector = new window.TonConnect({
          manifestUrl: this.tonConnectManifestUrl
        });
        
        await connector.restoreConnection();
        return connector.connected;
      }
      
      return false;
    } catch (error) {
      console.error('Ошибка при проверке подключения кошелька:', error);
      return false;
    }
  }

  // Отключает кошелек
  async disconnectWallet() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Удаляем данные о подключении из localStorage
      localStorage.removeItem("walletConnected");
      
      // Если используется TON Connect, отключаем соединение
      if (window.TonConnect) {
        const connector = new window.TonConnect({
          manifestUrl: this.tonConnectManifestUrl
        });
        
        await connector.disconnect();
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при отключении кошелька:', error);
      return false;
    }
  }
}

// Создаем глобальный экземпляр connector
const telegramWalletConnector = new TelegramWalletConnector();

// Инициализируем коннектор при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  telegramWalletConnector.initialize();
}); 