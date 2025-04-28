document.addEventListener("DOMContentLoaded", () => {
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
  
  // Проверка статуса кошелька
  let walletConnected = false;
  
  // Функция обновления статуса кошелька
  function updateWalletStatus(isConnected) {
    walletConnected = isConnected;
    if (isConnected) {
      walletBadge.textContent = "Кошелёк подключен";
      walletBadge.parentElement.style.backgroundColor = "rgba(39, 174, 96, 0.3)";
      connectWalletBtn.textContent = "Кошелёк подключен";
      connectWalletBtn.disabled = true;
      connectWalletBtn.style.opacity = "0.7";
    } else {
      walletBadge.textContent = "Кошелёк не подключен";
      walletBadge.parentElement.style.backgroundColor = "rgba(82, 136, 193, 0.3)";
      connectWalletBtn.innerHTML = `
        <svg class="wallet-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V10C22 8.89543 21.1046 8 20 8H18V6C18 4.89543 17.1046 4 16 4H4ZM16 10H20V18H4V6H16V10ZM18 12C18.5523 12 19 12.4477 19 13C19 13.5523 18.5523 14 18 14C17.4477 14 17 13.5523 17 13C17 12.4477 17.4477 12 18 12Z"/>
        </svg>
        Подключить кошелёк Telegram
      `;
      connectWalletBtn.disabled = false;
    }
  }
  
  // Обработчик нажатия на кнопку подключения кошелька
  connectWalletBtn.addEventListener("click", async () => {
    if (walletConnected) return;
    
    try {
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Показываем сообщение о загрузке
        connectWalletBtn.innerHTML = `
          <div class="spinner" style="width: 20px; height: 20px; border: 2px solid; border-radius: 50%; border-color: white transparent white transparent; animation: spin 1s linear infinite;"></div>
          Подключение...
        `;
        
        // Анимация вращения для индикатора загрузки
        const style = document.createElement('style');
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
        
        // Ожидаем небольшую задержку для имитации процесса подключения
        setTimeout(() => {
          // Вызываем API Telegram для открытия встроенного кошелька (если API недоступно, просто имитируем)
          if (tg.showPopup) {
            tg.showPopup({
              title: "Подключение кошелька",
              message: "Для подключения кошелька необходимо подтвердить действие",
              buttons: [{type: "ok", text: "Подключить"}, {type: "cancel", text: "Отмена"}]
            }, (buttonId) => {
              if (buttonId === "ok") {
                updateWalletStatus(true);
              } else {
                connectWalletBtn.innerHTML = `
                  <svg class="wallet-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V10C22 8.89543 21.1046 8 20 8H18V6C18 4.89543 17.1046 4 16 4H4ZM16 10H20V18H4V6H16V10ZM18 12C18.5523 12 19 12.4477 19 13C19 13.5523 18.5523 14 18 14C17.4477 14 17 13.5523 17 13C17 12.4477 17.4477 12 18 12Z"/>
                  </svg>
                  Подключить кошелёк Telegram
                `;
              }
            });
          } else {
            // Имитация успешного подключения, если API недоступно
            updateWalletStatus(true);
          }
        }, 1500);
      } else {
        // Имитация подключения в режиме тестирования
        setTimeout(() => {
          updateWalletStatus(true);
        }, 1500);
      }
    } catch (error) {
      console.error("Ошибка при подключении кошелька:", error);
      connectWalletBtn.innerHTML = `
        <svg class="wallet-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V10C22 8.89543 21.1046 8 20 8H18V6C18 4.89543 17.1046 4 16 4H4ZM16 10H20V18H4V6H16V10ZM18 12C18.5523 12 19 12.4477 19 13C19 13.5523 18.5523 14 18 14C17.4477 14 17 13.5523 17 13C17 12.4477 17.4477 12 18 12Z"/>
        </svg>
        Подключить кошелёк Telegram
      `;
      
      // Показываем уведомление об ошибке
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.showAlert) {
        window.Telegram.WebApp.showAlert("Ошибка при подключении кошелька. Пожалуйста, попробуйте позже.");
      }
    }
  });

  // Проверяем, доступен ли Telegram API
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    console.log("Telegram WebApp API найден");
    
    // Расширяем окно на весь экран
    tg.expand();
    
    // Устанавливаем меню для кнопки назад
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
  
  // Проверка состояния подключения кошелька (например, из localStorage)
  const savedWalletStatus = localStorage.getItem("walletConnected");
  if (savedWalletStatus === "true") {
    updateWalletStatus(true);
  } else {
    updateWalletStatus(false);
  }
}); 