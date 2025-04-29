/**
 * Скрипт для работы с профилем и интеграцией TON Connect
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing profile page...');
    
    // Элементы интерфейса
    const connectWalletButton = document.getElementById('connect-wallet-button');
    const disconnectWalletButton = document.getElementById('disconnect-wallet-button');
    const walletNotConnected = document.getElementById('wallet-not-connected');
    const walletConnected = document.getElementById('wallet-connected');
    const walletName = document.getElementById('wallet-name');
    const walletAddress = document.getElementById('wallet-address');
    const walletIcon = document.getElementById('wallet-icon');
    const walletSelect = document.getElementById('wallet-select');
    const walletsList = document.getElementById('wallets-list');
    
    // Проверка загрузки TON Connect SDK
    if (window.TonConnectSDK) {
        console.log('TON Connect SDK доступен в глобальном объекте window');
        
        // Определяем версию SDK
        let sdkVersion = 'не указана';
        if (window.TonConnectSDK && window.TonConnectSDK.tonConnectSdkVersion) {
            sdkVersion = window.TonConnectSDK.tonConnectSdkVersion;
        }
        console.log('Версия SDK:', sdkVersion);
    } else {
        console.error('TON Connect SDK не найден в глобальном объекте window');
    }
    
    // Проверка наличия Telegram Web App API
    if (window.Telegram && window.Telegram.WebApp) {
        console.log('Telegram WebApp API найден');
        
        // Настройка Telegram WebApp
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        // Проверка доступа к данным пользователя
        const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe || {};
        const user = initDataUnsafe.user || null;
        
        console.log('InitDataUnsafe доступен:', !!initDataUnsafe);
        console.log('User доступен:', !!user);
        
        // Если есть данные пользователя, можно их использовать
        if (user) {
            // Профиль Telegram юзера
            // Можно использовать для персонализации
        }
    }
    
    // Функция для отображения списка доступных кошельков
    async function showWalletList() {
        try {
            // Очищаем список кошельков
            walletsList.innerHTML = '';
            
            // Проверяем доступность walletConnector
            if (!window.walletConnector) {
                console.error('Ошибка: walletConnector не инициализирован');
                return;
            }
            
            // Получаем список доступных кошельков
            const wallets = await window.walletConnector.getWallets();
            
            if (!wallets || wallets.length === 0) {
                walletsList.innerHTML = '<div class="no-wallets">Доступные кошельки не найдены</div>';
                return;
            }
            
            // Создаем элементы для каждого кошелька
            wallets.forEach(wallet => {
                const walletItem = document.createElement('div');
                walletItem.className = 'wallet-item';
                
                // Иконка кошелька (если есть)
                const walletImg = document.createElement('img');
                walletImg.src = wallet.imageUrl || 'assets/img/wallet-icon.svg';
                walletImg.alt = wallet.name;
                walletImg.className = 'wallet-icon';
                
                // Название кошелька
                const walletTitle = document.createElement('div');
                walletTitle.className = 'wallet-title';
                walletTitle.textContent = wallet.name;
                
                // Добавляем элементы в контейнер
                walletItem.appendChild(walletImg);
                walletItem.appendChild(walletTitle);
                
                // Добавляем обработчик клика
                walletItem.addEventListener('click', async () => {
                    try {
                        // Закрываем окно выбора кошелька
                        walletSelect.style.display = 'none';
                        
                        // Подключаем выбранный кошелек
                        await window.walletConnector.connectWallet(wallet.name);
                        
                        console.log(`Запрос на подключение ${wallet.name} отправлен`);
                    } catch (error) {
                        console.error('Ошибка при подключении кошелька:', error);
                        alert('Ошибка при подключении кошелька');
                    }
                });
                
                walletsList.appendChild(walletItem);
            });
            
            // Показываем список кошельков
            walletSelect.style.display = 'block';
        } catch (error) {
            console.error('Ошибка при получении списка кошельков:', error);
            alert('Не удалось загрузить список доступных кошельков');
        }
    }
    
    // Подключаем кошелек
    if (connectWalletButton) {
        connectWalletButton.addEventListener('click', async () => {
            await showWalletList();
        });
    }
    
    // Отключаем кошелек
    if (disconnectWalletButton) {
        disconnectWalletButton.addEventListener('click', async () => {
            try {
                await window.walletConnector.disconnectWallet();
                console.log('Кошелек успешно отключен');
                updateWalletUI(false);
            } catch (error) {
                console.error('Ошибка при отключении кошелька:', error);
            }
        });
    }
    
    // Обновление UI в зависимости от состояния подключения кошелька
    function updateWalletUI(isConnected, walletInfo) {
        if (isConnected && walletInfo) {
            // Обновляем UI для подключенного кошелька
            walletNotConnected.style.display = 'none';
            walletConnected.style.display = 'block';
            
            // Обновляем название кошелька
            if (walletInfo.device && walletInfo.device.appName) {
                walletName.textContent = walletInfo.device.appName;
            } else {
                walletName.textContent = 'TON Wallet';
            }
            
            // Обновляем адрес кошелька
            if (walletInfo.account && walletInfo.account.address) {
                const address = walletInfo.account.address;
                walletAddress.textContent = shortenAddress(address);
                walletAddress.title = address;
            }
            
            // Обновляем иконку кошелька, если доступна
            if (walletInfo.device && walletInfo.device.appName) {
                const appName = walletInfo.device.appName.toLowerCase();
                if (appName.includes('telegram')) {
                    walletIcon.src = 'assets/img/telegram-wallet-icon.svg';
                } else if (appName.includes('tonkeeper')) {
                    walletIcon.src = 'assets/img/tonkeeper-icon.svg';
                } else {
                    walletIcon.src = 'assets/img/wallet-icon.svg';
                }
            }
        } else {
            // Обновляем UI для отключенного кошелька
            walletNotConnected.style.display = 'block';
            walletConnected.style.display = 'none';
        }
    }
    
    // Слушаем события подключения/отключения кошелька
    document.addEventListener('walletConnected', function(event) {
        const wallet = event.detail.wallet;
        console.log('Кошелек подключен:', wallet);
        updateWalletUI(true, wallet);
    });
    
    document.addEventListener('walletDisconnected', function() {
        console.log('Кошелек отключен');
        updateWalletUI(false);
    });
    
    // Инициализация UI при загрузке страницы
    function initWalletState() {
        if (!window.walletConnector) {
            console.error('walletConnector не инициализирован');
            return;
        }
        
        // Проверяем состояние подключения кошелька
        const isConnected = window.walletConnector.isWalletConnected();
        const walletInfo = window.walletConnector.getWalletInfo();
        
        console.log('Состояние кошелька при загрузке:', isConnected ? 'Подключен' : 'Отключен');
        updateWalletUI(isConnected, walletInfo);
    }
    
    // Сокращение адреса кошелька для отображения
    function shortenAddress(address) {
        if (!address) return '';
        if (address.length <= 12) return address;
        return address.substring(0, 6) + '...' + address.substring(address.length - 6);
    }
    
    // Инициализация после полной загрузки страницы
    setTimeout(initWalletState, 1000);
}); 