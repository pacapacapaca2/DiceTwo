document.addEventListener("DOMContentLoaded", () => {
  // Подключаем коннектор из глобальной переменной
  const telegramWalletConnector = window.walletConnector;

  const profilePhoto = document.getElementById("profile-photo");
  const profileName = document.getElementById("profile-name");
  const profileUsername = document.getElementById("profile-username");
  const totalRolls = document.getElementById("total-rolls");
  const bestScore = document.getElementById("best-score");
  const rank = document.getElementById("rank");
  const connectWalletBtn = document.getElementById("connect-wallet");
  const walletBadge = document.getElementById("wallet-badge");
  
  // Скрываем loader
  const loader = document.querySelector('.loader');
  if (loader) {
    loader.style.display = 'none';
  }

  console.log("Initializing profile page...");
  
  // Функция для создания модального окна выбора кошелька
  async function showWalletSelectorModal() {
    // Создаем элементы модального окна
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'wallet-selector-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.2s ease-out;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'wallet-selector-content';
    modalContent.style.cssText = `
      background-color: var(--tg-theme-secondary-bg-color);
      border-radius: 12px;
      padding: 20px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      animation: scaleIn 0.2s ease-out;
    `;
    
    // Добавляем заголовок
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      margin-bottom: 16px;
      text-align: center;
      font-weight: bold;
      font-size: 18px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--tg-theme-section-separator-color);
    `;
    modalHeader.textContent = 'Выберите кошелек';
    
    // Добавляем анимацию
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes walletItemHover {
        from { transform: translateY(0); }
        to { transform: translateY(-2px); }
      }
      .wallet-option {
        padding: 12px;
        margin-bottom: 10px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        background-color: rgba(255, 255, 255, 0.05);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .wallet-option:hover {
        background-color: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }
      .wallet-option img {
        width: 32px;
        height: 32px;
        margin-right: 12px;
        border-radius: 6px;
      }
      .wallet-option-info {
        flex: 1;
      }
      .wallet-name {
        font-weight: 500;
        margin-bottom: 2px;
      }
      .wallet-description {
        font-size: 12px;
        color: var(--tg-theme-hint-color);
      }
    `;
    
    document.head.appendChild(style);
    
    // Получаем список кошельков
    const wallets = await telegramWalletConnector.getWallets();
    
    // Создаем список кошельков
    const walletsList = document.createElement('div');
    walletsList.className = 'wallets-list';
    
    // Добавляем элементы для каждого кошелька
    wallets.forEach(wallet => {
      const walletOption = document.createElement('div');
      walletOption.className = 'wallet-option';
      
      // Определяем изображение кошелька
      const walletImage = wallet.imageUrl || 
        (wallet.name.includes('Telegram') ? 
          'https://wallet.tg/images/logo_filled.svg' : 
          (wallet.name.includes('Keeper') ? 
            'https://tonkeeper.com/assets/tonconnect-icon.png' : 
            'https://ton.org/download/ton_symbol.png'));
      
      walletOption.innerHTML = `
        <img src="${walletImage}" alt="${wallet.name}" onerror="this.src='https://ton.org/download/ton_symbol.png'">
        <div class="wallet-option-info">
          <div class="wallet-name">${wallet.name}</div>
          <div class="wallet-description">${getWalletDescription(wallet)}</div>
        </div>
      `;
      
      // Добавляем обработчик клика для выбора кошелька
      walletOption.addEventListener('click', async () => {
        // Закрываем модальное окно
        document.body.removeChild(modalOverlay);
        
        // Устанавливаем выбранный кошелек как предпочитаемый
        telegramWalletConnector.setPreferredWallet(wallet.name);
        
        // Запускаем процесс подключения
        connectWalletBtn.disabled = true;
        connectWalletBtn.textContent = `Подключение ${wallet.name}...`;
        
        try {
          const result = await telegramWalletConnector.connectWallet(wallet.name);
          if (result && typeof result === 'string' && result.startsWith('http')) {
            window.location.href = result;
          }
        } catch (error) {
          console.error('Ошибка при подключении кошелька:', error);
          connectWalletBtn.disabled = false;
          connectWalletBtn.textContent = "Подключить кошелёк";
        }
      });
      
      walletsList.appendChild(walletOption);
    });
    
    // Добавляем кнопку закрытия
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Отмена';
    closeButton.style.cssText = `
      width: 100%;
      padding: 12px;
      margin-top: 16px;
      background-color: transparent;
      border: 1px solid var(--tg-theme-hint-color);
      color: var(--tg-theme-text-color);
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    closeButton.addEventListener('mouseover', () => {
      closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    });
    
    closeButton.addEventListener('mouseout', () => {
      closeButton.style.backgroundColor = 'transparent';
    });
    
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modalOverlay);
    });
    
    // Собираем модальное окно
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(walletsList);
    modalContent.appendChild(closeButton);
    modalOverlay.appendChild(modalContent);
    
    // Добавляем на страницу
    document.body.appendChild(modalOverlay);
    
    // Закрытие по клику на оверлей
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        document.body.removeChild(modalOverlay);
      }
    });
    
    // Вспомогательная функция для получения описания кошелька
    function getWalletDescription(wallet) {
      if (wallet.name.includes('Telegram')) {
        return 'Встроенный кошелек Telegram';
      } else if (wallet.name.includes('Keeper')) {
        return 'Популярный мобильный кошелек';
      } else if (wallet.name.includes('Tonhub')) {
        return 'Мобильный кошелек для TON';
      } else if (wallet.name.includes('OpenMask')) {
        return 'Расширение для браузера';
      }
      return 'TON кошелек';
    }
  }

  // Функция обновления статуса кошелька
  function updateWalletStatus(isConnected, address = null) {
    if (isConnected) {
      walletBadge.textContent = "Кошелёк подключен";
      walletBadge.parentElement.style.backgroundColor = "rgba(39, 174, 96, 0.3)";
      
      // Показываем адрес кошелька в сокращенном виде, если он доступен
      if (address) {
        const shortAddress = address.slice(0, 6) + '...' + address.slice(-6);
        connectWalletBtn.innerHTML = `
          <svg class="wallet-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V10C22 8.89543 21.1046 8 20 8H18V6C18 4.89543 17.1046 4 16 4H4ZM16 10H20V18H4V6H16V10ZM18 12C18.5523 12 19 12.4477 19 13C19 13.5523 18.5523 14 18 14C17.4477 14 17 13.5523 17 13C17 12.4477 17.4477 12 18 12Z"/>
          </svg>
          ${shortAddress}
        `;
      } else {
        connectWalletBtn.innerHTML = `
          <svg class="wallet-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V10C22 8.89543 21.1046 8 20 8H18V6C18 4.89543 17.1046 4 16 4H4ZM16 10H20V18H4V6H16V10ZM18 12C18.5523 12 19 12.4477 19 13C19 13.5523 18.5523 14 18 14C17.4477 14 17 13.5523 17 13C17 12.4477 17.4477 12 18 12Z"/>
          </svg>
          Кошелёк подключен
        `;
      }
      
      // Добавляем возможность отключить кошелек
      connectWalletBtn.onclick = async () => {
        if (confirm('Вы хотите отключить кошелёк?')) {
          await telegramWalletConnector.disconnectWallet();
          updateWalletStatus(false);
        }
      };
      
      localStorage.setItem("walletConnected", "true");
    } else {
      walletBadge.textContent = "Кошелёк не подключен";
      walletBadge.parentElement.style.backgroundColor = "rgba(82, 136, 193, 0.3)";
      
      connectWalletBtn.innerHTML = `
        <svg class="wallet-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V10C22 8.89543 21.1046 8 20 8H18V6C18 4.89543 17.1046 4 16 4H4ZM16 10H20V18H4V6H16V10ZM18 12C18.5523 12 19 12.4477 19 13C19 13.5523 18.5523 14 18 14C17.4477 14 17 13.5523 17 13C17 12.4477 17.4477 12 18 12Z"/>
        </svg>
        Подключить кошелёк Telegram
      `;
      
      // Восстанавливаем функцию подключения кошелька
      connectWalletBtn.onclick = connectWallet;
      
      localStorage.setItem("walletConnected", "false");
    }
  }
  
  // Функция для показа уведомления о подключении
  function showConnectionNotification(success = true) {
    const notification = document.createElement('div');
    notification.className = 'wallet-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    if (success) {
      notification.style.backgroundColor = 'rgba(39, 174, 96, 0.9)';
      notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM11.003 16L17.073 9.929L15.659 8.515L11.003 13.172L8.174 10.343L6.76 11.757L11.003 16Z" fill="white"/>
        </svg>
        Кошелёк успешно подключен
      `;
    } else {
      notification.style.backgroundColor = 'rgba(235, 87, 87, 0.9)';
      notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM12 13.414L14.828 16.243L16.243 14.828L13.414 12L16.243 9.172L14.828 7.757L12 10.586L9.172 7.757L7.757 9.172L10.586 12L7.757 14.828L9.172 16.243L12 13.414Z" fill="white"/>
        </svg>
        Не удалось подключить кошелёк
      `;
    }
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    // Исчезновение через 3 секунды
    setTimeout(() => {
      notification.style.opacity = '0';
      
      // Удаляем из DOM после анимации
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Функция для подключения кошелька
  async function connectWallet() {
    try {
      // Вместо прямого подключения показываем модальное окно выбора кошелька
      await showWalletSelectorModal();
      return;
    } catch (error) {
      console.error("Ошибка при выборе кошелька:", error);
      updateWalletStatus(false);
      showConnectionNotification(false);
      connectWalletBtn.disabled = false; // Разблокируем кнопку
      connectWalletBtn.textContent = "Подключить кошелёк Telegram";
    }
  }

  // Устанавливаем обработчик нажатия на кнопку подключения кошелька
  connectWalletBtn.addEventListener("click", connectWallet);

  // Подписываемся на событие изменения статуса кошелька
  document.addEventListener('walletStatusChange', (event) => {
    console.log('Получено событие изменения статуса кошелька:', event.detail);
    
    const { connected, wallet } = event.detail;
    if (connected) {
      // Получаем адрес кошелька, если доступен
      const address = telegramWalletConnector.getWalletAddress();
      console.log("Получен адрес кошелька после подключения:", address);
      // Обновляем статус на "подключен"
      updateWalletStatus(true, address);
      // Показываем уведомление об успешном подключении
      showConnectionNotification(true);
    } else {
      // Обновляем статус на "отключен"
      console.log("Событие walletStatusChange сообщило об отключении кошелька");
      updateWalletStatus(false);
    }
  });

  // Функция для проверки доступности SDK TON Connect
  function checkTonConnectAvailability() {
    if (window.TonConnect) {
      console.log("TON Connect SDK доступен в глобальном объекте window");
      console.log("Версия SDK:", window.TonConnect.version || "не указана");
      return true;
    } else {
      console.error("ОШИБКА: TON Connect SDK не доступен в глобальном объекте window");
      return false;
    }
  }

  // Проверяем при загрузке страницы
  checkTonConnectAvailability();

  // Проверяем, доступен ли Telegram API
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    console.log("Telegram WebApp API найден");
    
    // Расширяем окно на весь экран
    tg.expand();
    
    // Скрываем кнопку назад и главную кнопку, т.к. используем свою кнопку подключения
    tg.BackButton.hide();
    tg.MainButton.hide();
    
    console.log("InitDataUnsafe доступен:", !!tg.initDataUnsafe);
    console.log("User доступен:", !!(tg.initDataUnsafe && tg.initDataUnsafe.user));
    
    // Получаем данные пользователя из Telegram
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
      const user = tg.initDataUnsafe.user;
      console.log("Данные пользователя:", user);
      
      // Устанавливаем имя пользователя
      if (user.first_name) {
        let fullName = user.first_name;
        if (user.last_name) {
          fullName += " " + user.last_name;
        }
        profileName.textContent = fullName;
      }
      
      // Устанавливаем username
      if (user.username) {
        profileUsername.textContent = "@" + user.username;
      } else {
        profileUsername.textContent = ""; // Скрываем, если нет username
      }
      
      // Устанавливаем фото профиля, если доступно
      if (user.photo_url) {
        console.log("Фото профиля URL:", user.photo_url);
        profilePhoto.innerHTML = `<img src="${user.photo_url}" alt="Profile Photo" class="w-full h-full object-cover">`;
      } else {
        // Если фото нет, показываем первую букву имени
        const initials = user.first_name ? user.first_name.charAt(0).toUpperCase() : "U";
        profilePhoto.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-[#5288c1] text-white text-3xl">${initials}</div>`;
      }
    } else {
      // Альтернативный метод получения данных пользователя
      try {
        // В некоторых версиях WebApp API данные доступны через другие методы
        let userData = null;
        
        if (tg.initData) {
          console.log("Попытка использовать initData");
          try {
            const parsedData = JSON.parse(decodeURIComponent(tg.initData));
            if (parsedData && parsedData.user) {
              userData = parsedData.user;
            }
          } catch (e) {
            console.error("Ошибка при парсинге initData:", e);
          }
        }
        
        if (userData) {
          console.log("Данные пользователя получены альтернативным методом:", userData);
          
          if (userData.first_name) {
            let fullName = userData.first_name;
            if (userData.last_name) {
              fullName += " " + userData.last_name;
            }
            profileName.textContent = fullName;
          }
          
          if (userData.username) {
            profileUsername.textContent = "@" + userData.username;
          }
          
          if (userData.photo_url) {
            profilePhoto.innerHTML = `<img src="${userData.photo_url}" alt="Profile Photo" class="w-full h-full object-cover">`;
          } else {
            const initials = userData.first_name ? userData.first_name.charAt(0).toUpperCase() : "U";
            profilePhoto.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-[#5288c1] text-white text-3xl">${initials}</div>`;
          }
        } else {
          // Если данные пользователя недоступны
          profileName.textContent = "Пользователь Telegram";
          profileUsername.textContent = "";
          profilePhoto.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-[#5288c1] text-white text-3xl">T</div>`;
        }
      } catch (e) {
        console.error("Ошибка при получении данных пользователя:", e);
        profileName.textContent = "Пользователь Telegram";
        profileUsername.textContent = "";
        profilePhoto.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-[#5288c1] text-white text-3xl">T</div>`;
      }
    }
  } else {
    // Если Telegram API недоступен (для тестирования в браузере)
    console.log("Telegram WebApp API не найден. Используется тестовый режим.");
    profileName.textContent = "Тестовый пользователь";
    profileUsername.textContent = "@testuser";
    profilePhoto.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-[#5288c1] text-white text-3xl">T</div>`;
  }

  // Здесь можно добавить загрузку статистики пользователя с сервера
  // Пока используем тестовые данные
  totalRolls.textContent = "128";
  bestScore.textContent = "12";
  rank.textContent = "42";
  
  // Проверка состояния подключения кошелька и обновление интерфейса
  telegramWalletConnector.isWalletConnected().then(isConnected => {
    if (isConnected) {
      const address = telegramWalletConnector.getWalletAddress();
      updateWalletStatus(true, address);
    } else {
      updateWalletStatus(false);
    }
  });
}); 