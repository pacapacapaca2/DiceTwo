document.addEventListener("DOMContentLoaded", () => {
  const profilePhoto = document.getElementById("profile-photo");
  const profileName = document.getElementById("profile-name");
  const profileUsername = document.getElementById("profile-username");
  const totalRolls = document.getElementById("total-rolls");
  const bestScore = document.getElementById("best-score");
  const rank = document.getElementById("rank");
  
  // Скрываем loader
  const loader = document.querySelector('.loader');
  if (loader) {
    loader.style.display = 'none';
  }

  console.log("Initializing profile page...");

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
}); 