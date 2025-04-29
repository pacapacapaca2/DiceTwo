/**
 * Скрипт для работы с профилем и интеграцией TON Connect
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing profile page...');
    
    // Элементы интерфейса
    const profileContainer = document.querySelector('.profile-container');
    const connectWalletBtn = document.querySelector('.connect-wallet-btn');
    const disconnectWalletBtn = document.querySelector('.disconnect-wallet-btn');
    const walletAddressElement = document.querySelector('.wallet-address');
    const walletNameElement = document.querySelector('.wallet-name');
    const walletBalanceElement = document.querySelector('.wallet-balance');
    const walletImageElement = document.querySelector('.wallet-image');
    const gameStatsContainer = document.querySelector('.game-stats');
    
    // Статистические элементы
    const totalGames = document.getElementById('total-games');
    const wins = document.getElementById('wins');
    const winRate = document.getElementById('win-rate');
    const tonWon = document.getElementById('ton-won');
    
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
    
    // Функция для инициализации страницы профиля
    async function initProfilePage() {
        // Проверяем доступность SDK TON Connect
        if (typeof window.walletConnector === 'undefined') {
            console.error('Ошибка: SDK TON Connect не найден.');
            showError('Ошибка загрузки SDK TON Connect. Пожалуйста, обновите страницу.');
            return;
        }
        
        // Обработчик события подключения кошелька
        document.addEventListener('walletConnected', (event) => {
            const walletInfo = event.detail.wallet;
            updateUIWithWalletInfo(walletInfo);
            loadGameStats();
        });
        
        // Обработчик события отключения кошелька
        document.addEventListener('walletDisconnected', () => {
            resetWalletUI();
        });
        
        // Обработчик нажатия на кнопку подключения кошелька
        if (connectWalletBtn) {
            connectWalletBtn.addEventListener('click', async () => {
                try {
                    // Открываем список доступных кошельков или сразу подключаем предпочтительный
                    const preferredWallet = window.walletConnector.getPreferredWallet();
                    if (preferredWallet) {
                        await window.walletConnector.connectWallet(preferredWallet);
                    } else {
                        showWalletSelection();
                    }
                } catch (error) {
                    console.error('Ошибка при подключении кошелька:', error);
                    showError('Не удалось подключиться к кошельку. Попробуйте еще раз.');
                }
            });
        }
        
        // Обработчик нажатия на кнопку отключения кошелька
        if (disconnectWalletBtn) {
            disconnectWalletBtn.addEventListener('click', async () => {
                try {
                    await window.walletConnector.disconnectWallet();
                } catch (error) {
                    console.error('Ошибка при отключении кошелька:', error);
                    showError('Не удалось отключить кошелек. Попробуйте еще раз.');
                }
            });
        }
        
        // Проверяем состояние подключения кошелька при загрузке страницы
        if (window.walletConnector.isWalletConnected()) {
            const walletInfo = window.walletConnector.getWalletInfo();
            updateUIWithWalletInfo(walletInfo);
            loadGameStats();
        } else {
            resetWalletUI();
        }
    }
    
    // Функция для отображения выбора кошельков
    async function showWalletSelection() {
        try {
            // Получаем список доступных кошельков
            const wallets = await window.walletConnector.getWallets();
            
            // Создаем элемент с выбором кошельков
            const walletSelectionElement = document.createElement('div');
            walletSelectionElement.className = 'wallet-selection-popup';
            
            // Заголовок
            const heading = document.createElement('h3');
            heading.innerText = 'Выберите кошелек';
            walletSelectionElement.appendChild(heading);
            
            // Список кошельков
            const walletList = document.createElement('div');
            walletList.className = 'wallet-list';
            
            wallets.forEach(wallet => {
                const walletItem = document.createElement('div');
                walletItem.className = 'wallet-item';
                walletItem.setAttribute('data-wallet-name', wallet.name);
                
                // Изображение кошелька
                const walletImage = document.createElement('img');
                walletImage.src = wallet.imageUrl;
                walletImage.alt = wallet.name;
                walletImage.onerror = () => {
                    // Если изображение не загрузилось, используем запасное
                    walletImage.src = '../assets/images/wallets/default-wallet.png';
                };
                
                // Название кошелька
                const walletName = document.createElement('span');
                walletName.innerText = wallet.name;
                
                walletItem.appendChild(walletImage);
                walletItem.appendChild(walletName);
                
                // Обработчик клика по кошельку
                walletItem.addEventListener('click', async () => {
                    try {
                        await window.walletConnector.connectWallet(wallet.name);
                        walletSelectionElement.remove();
                    } catch (error) {
                        console.error('Ошибка при подключении к кошельку:', error);
                        showError('Не удалось подключиться к кошельку. Попробуйте еще раз.');
                    }
                });
                
                walletList.appendChild(walletItem);
            });
            
            walletSelectionElement.appendChild(walletList);
            
            // Кнопка закрытия
            const closeButton = document.createElement('button');
            closeButton.className = 'close-btn';
            closeButton.innerText = '✕';
            closeButton.addEventListener('click', () => {
                walletSelectionElement.remove();
            });
            
            walletSelectionElement.appendChild(closeButton);
            
            // Добавляем элемент на страницу
            document.body.appendChild(walletSelectionElement);
            
        } catch (error) {
            console.error('Ошибка при получении списка кошельков:', error);
            showError('Не удалось загрузить список кошельков. Попробуйте еще раз.');
        }
    }
    
    // Функция обновления UI с информацией о кошельке
    function updateUIWithWalletInfo(walletInfo) {
        if (!walletInfo) return;
        
        // Показываем информацию о кошельке
        if (profileContainer) {
            profileContainer.classList.add('wallet-connected');
        }
        
        // Отображаем адрес кошелька (в сокращенном виде)
        if (walletAddressElement && walletInfo.account) {
            const address = walletInfo.account.address;
            walletAddressElement.innerText = formatAddress(address);
            walletAddressElement.setAttribute('title', address);
        }
        
        // Отображаем название кошелька
        if (walletNameElement && walletInfo.device) {
            walletNameElement.innerText = walletInfo.device.appName || 'Неизвестный кошелек';
        }
        
        // Устанавливаем изображение кошелька
        if (walletImageElement && walletInfo.device) {
            const walletName = walletInfo.device.appName || '';
            
            // Выбираем изображение в зависимости от названия кошелька
            let walletImageSrc = '../assets/images/wallets/default-wallet.png';
            
            if (walletName.toLowerCase().includes('telegram')) {
                walletImageSrc = '../assets/images/wallets/telegram-wallet.png';
            } else if (walletName.toLowerCase().includes('tonkeeper')) {
                walletImageSrc = '../assets/images/wallets/tonkeeper-wallet.png';
            } else if (walletName.toLowerCase().includes('tonhub')) {
                walletImageSrc = '../assets/images/wallets/tonhub-wallet.png';
            }
            
            walletImageElement.src = walletImageSrc;
            walletImageElement.alt = walletName;
            
            // Обработчик ошибки загрузки изображения
            walletImageElement.onerror = () => {
                walletImageElement.src = '../assets/images/wallets/default-wallet.png';
            };
        }
        
        // Показываем/скрываем кнопки подключения/отключения
        if (connectWalletBtn) {
            connectWalletBtn.style.display = 'none';
        }
        
        if (disconnectWalletBtn) {
            disconnectWalletBtn.style.display = 'block';
        }
        
        // Запрашиваем баланс кошелька (если есть такая функция)
        fetchWalletBalance(walletInfo);
    }
    
    // Функция для сброса UI при отключении кошелька
    function resetWalletUI() {
        if (profileContainer) {
            profileContainer.classList.remove('wallet-connected');
        }
        
        // Очищаем информацию о кошельке
        if (walletAddressElement) {
            walletAddressElement.innerText = 'Не подключен';
            walletAddressElement.removeAttribute('title');
        }
        
        if (walletNameElement) {
            walletNameElement.innerText = 'Не подключен';
        }
        
        if (walletBalanceElement) {
            walletBalanceElement.innerText = '0 TON';
        }
        
        if (walletImageElement) {
            walletImageElement.src = '../assets/images/wallets/default-wallet.png';
            walletImageElement.alt = 'Wallet';
        }
        
        // Показываем/скрываем кнопки
        if (connectWalletBtn) {
            connectWalletBtn.style.display = 'block';
        }
        
        if (disconnectWalletBtn) {
            disconnectWalletBtn.style.display = 'none';
        }
        
        // Очищаем статистику игры
        if (gameStatsContainer) {
            gameStatsContainer.innerHTML = '';
        }
    }
    
    // Загрузка статистики игры
    function loadGameStats() {
        if (!gameStatsContainer) return;
        
        try {
            // Получаем данные из localStorage
            const gameStatsData = localStorage.getItem('game-stats');
            let stats = gameStatsData ? JSON.parse(gameStatsData) : {
                gamesPlayed: 0,
                gamesWon: 0,
                totalWinnings: 0,
                bestResult: 0
            };
            
            // Очищаем контейнер
            gameStatsContainer.innerHTML = '';
            
            // Создаем заголовок
            const header = document.createElement('h3');
            header.textContent = 'Статистика игр';
            gameStatsContainer.appendChild(header);
            
            // Отображаем статистические данные
            const statsItems = [
                { label: 'Игр сыграно', value: stats.gamesPlayed },
                { label: 'Побед', value: stats.gamesWon },
                { label: 'Выигрыш (TON)', value: stats.totalWinnings.toFixed(2) },
                { label: 'Лучший результат (TON)', value: stats.bestResult.toFixed(2) }
            ];
            
            statsItems.forEach(item => {
                const statElement = document.createElement('div');
                statElement.className = 'stat-item';
                
                const labelElement = document.createElement('span');
                labelElement.className = 'stat-label';
                labelElement.textContent = item.label;
                
                const valueElement = document.createElement('span');
                valueElement.className = 'stat-value';
                valueElement.textContent = item.value;
                
                statElement.appendChild(labelElement);
                statElement.appendChild(valueElement);
                gameStatsContainer.appendChild(statElement);
            });
            
        } catch (error) {
            console.error('Ошибка при загрузке статистики игры:', error);
        }
    }
    
    // Форматирование адреса кошелька (сокращение)
    function formatAddress(address) {
        if (!address || typeof address !== 'string') return 'Неизвестный адрес';
        if (address.length <= 12) return address;
        return address.slice(0, 6) + '...' + address.slice(-6);
    }
    
    // Запрос баланса кошелька
    async function fetchWalletBalance(walletInfo) {
        if (!walletInfo || !walletInfo.account || !walletBalanceElement) return;
        
        try {
            // Здесь должен быть запрос к API для получения баланса
            // Временно используем случайное значение
            const mockBalance = (Math.random() * 10).toFixed(2);
            walletBalanceElement.innerText = `${mockBalance} TON`;
        } catch (error) {
            console.error('Ошибка при получении баланса кошелька:', error);
            walletBalanceElement.innerText = 'Недоступно';
        }
    }
    
    // Функция отображения ошибки
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerText = message;
        
        // Добавляем сообщение на страницу
        document.body.appendChild(errorElement);
        
        // Удаляем через 5 секунд
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }
    
    // Инициализация страницы при загрузке
    initProfilePage();
}); 