// Интеграция с TON Connect для Telegram Mini App
class TelegramWalletConnector {
  constructor() {
    this.isInitialized = false;
    // Используем локальный манифест вместо примера с GitHub
    this.tonConnectManifestUrl = './tonconnect-manifest.json';
    this.connector = null;
    this.dAppName = 'DiceTwo';
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Проверяем, доступен ли TonConnect
      if (!window.TonConnect) {
        console.error('TON Connect SDK не доступен');
        return false;
      }

      // Создаем экземпляр коннектора TON Connect
      this.connector = new window.TonConnect({
        manifestUrl: this.tonConnectManifestUrl
      });

      // Выводим URL манифеста для отладки
      console.log('Используется URL манифеста:', this.tonConnectManifestUrl);

      // Подписываемся на изменения статуса подключения
      this.connector.onStatusChange((walletInfo) => {
        console.log('Статус подключения TON Connect:', walletInfo);
        
        // Вызываем событие изменения статуса кошелька
        const event = new CustomEvent('walletStatusChange', { 
          detail: { connected: !!walletInfo, wallet: walletInfo } 
        });
        document.dispatchEvent(event);
        
        // Сохраняем состояние в localStorage
        localStorage.setItem("walletConnected", walletInfo ? "true" : "false");
      });
      
      // Восстанавливаем соединение, если оно было ранее
      await this.connector.restoreConnection();
      
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
      if (this.connector.connected) {
        console.log('Кошелек уже подключен');
        return true;
      }

      // Получаем список доступных кошельков
      const wallets = await this.connector.getWallets();
      console.log('Доступные кошельки:', wallets);
      
      // Находим кошелек Telegram (TonKeeper) для подключения
      const tonkeeperWallet = wallets.find(wallet => 
        wallet.name === 'Tonkeeper' || 
        wallet.name.toLowerCase().includes('ton') ||
        wallet.name.toLowerCase().includes('keeper')
      );
      
      if (!tonkeeperWallet) {
        console.error('Не найден подходящий TON кошелек');
        return false;
      }
      
      console.log('Выбран кошелек:', tonkeeperWallet);
      
      // Формируем ссылку для подключения и открываем её
      // Не используем openTonWallet, вместо этого используем стандартный метод TON Connect
      const universalLink = this.connector.connect({
        universalLink: tonkeeperWallet.universalLink,
        bridgeUrl: tonkeeperWallet.bridgeUrl
      });
      
      console.log('Открываем ссылку для подключения:', universalLink);
      window.location.href = universalLink;
      
      return true;
    } catch (error) {
      console.error('Ошибка при подключении кошелька:', error);
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
      console.error('Ошибка при отключении кошелька:', error);
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
      console.error('Ошибка при получении адреса кошелька:', error);
      return null;
    }
  }
}

// Создаем глобальный экземпляр connector
const telegramWalletConnector = new TelegramWalletConnector();

// Инициализируем коннектор при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  telegramWalletConnector.initialize();
}); 