// Импортируем необходимые модули
import { generateDailyChallenge, checkChallengeCompletion, calculateStreakBonus } from './challenges.js';
import { getUserProfile, updateLoginStreak, addLuckPoints, getShopItems } from './currency.js';
import { createChallengeElement, createProfilePanel, createShopPanel, showNotification, showRewardModal } from './ui.js';

document.addEventListener("DOMContentLoaded", () => {
  const rollButton = document.getElementById("roll-button");
  const resultDiv = document.getElementById("result");
  const diceContainer = document.getElementById("dice-container");
  const dice1 = document.getElementById("dice1");
  const dice2 = document.getElementById("dice2");
  const gameContainer = document.getElementById("app");

  // Добавляем контейнер для игрового интерфейса
  const gameInterface = document.createElement('div');
  gameInterface.id = 'game-interface';
  gameInterface.className = 'game-interface';
  gameContainer.prepend(gameInterface);

  if (!rollButton || !resultDiv || !diceContainer || !dice1 || !dice2 || !gameContainer) {
    console.error("One or more DOM elements not found.");
    return;
  }

  // Добавляем стили
  const styleSheet = document.createElement('link');
  styleSheet.rel = 'stylesheet';
  styleSheet.href = 'styles/game.css';
  document.head.appendChild(styleSheet);

  let currentAnimations = []; // Хранит текущие анимации
  let currentDiceValues = [0, 0]; // Текущие значения кубиков

  // Инициализация игры
  initGame();

  // Функция инициализации игры
  function initGame() {
    // Обновляем счетчик ежедневных входов
    const streakDays = updateLoginStreak();
    
    // Получаем профиль пользователя
    const userProfile = getUserProfile();
    
    // Генерируем или получаем текущее испытание
    let todaysChallenge = getTodaysChallenge();
    
    // Рендерим интерфейс игры
    renderGameInterface(userProfile, todaysChallenge, streakDays);
    
    // Добавляем кнопки навигации
    addNavigationButtons();
    
    // Показываем уведомление о серии входов
    if (streakDays > 1) {
      showNotification(`Вы заходите ${streakDays} ${getDayForm(streakDays)} подряд! Продолжайте в том же духе!`, 'info');
    }
  }

  // Получаем испытание на сегодня
  function getTodaysChallenge() {
    const today = new Date().toISOString().split('T')[0];
    let challenge;
    
    try {
      // Пытаемся получить сохраненное испытание
      const savedChallenge = localStorage.getItem(`challenge-${today}`);
      if (savedChallenge) {
        challenge = JSON.parse(savedChallenge);
      } else {
        // Генерируем новое испытание
        challenge = generateDailyChallenge();
        // Сохраняем испытание
        localStorage.setItem(`challenge-${today}`, JSON.stringify(challenge));
      }
    } catch (error) {
      console.error('Ошибка при получении испытания:', error);
      challenge = generateDailyChallenge();
    }
    
    return challenge;
  }

  // Рендерим игровой интерфейс
  function renderGameInterface(profile, challenge, streakDays) {
    gameInterface.innerHTML = '';
    
    // Добавляем панель профиля
    const profilePanel = createProfilePanel(profile);
    gameInterface.appendChild(profilePanel);
    
    // Добавляем панель испытания
    const challengeElement = createChallengeElement(challenge, streakDays);
    gameInterface.appendChild(challengeElement);
    
    // Добавляем кнопку для магазина
    const shopButton = document.createElement('button');
    shopButton.className = 'secondary-button shop-button';
    shopButton.textContent = '🛒 Магазин';
    shopButton.addEventListener('click', showShop);
    gameInterface.appendChild(shopButton);
  }

  // Показываем магазин
  function showShop() {
    // Получаем список предметов для магазина
    const shopItems = getShopItems();
    
    // Создаем модальное окно магазина
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content shop-modal';
    
    // Заголовок магазина
    const shopHeader = document.createElement('div');
    shopHeader.innerHTML = '<h2>Магазин</h2>';
    modalContent.appendChild(shopHeader);
    
    // Создаем панель магазина
    const shopPanel = createShopPanel(shopItems);
    modalContent.appendChild(shopPanel);
    
    // Кнопка закрытия
    const closeButton = document.createElement('button');
    closeButton.className = 'close-modal-button';
    closeButton.textContent = 'Закрыть';
    closeButton.addEventListener('click', () => {
      modalOverlay.classList.remove('show');
      setTimeout(() => {
        modalOverlay.remove();
      }, 300);
    });
    modalContent.appendChild(closeButton);
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    setTimeout(() => {
      modalOverlay.classList.add('show');
    }, 10);
    
    // Обработчики покупки
    setupShopEventListeners(modalContent);
  }

  // Настраиваем обработчики событий для магазина
  function setupShopEventListeners(shopElement) {
    const buyButtons = shopElement.querySelectorAll('.buy-button');
    
    buyButtons.forEach(button => {
      button.addEventListener('click', () => {
        const itemId = button.dataset.id;
        if (itemId) {
          // Импортируем функцию покупки асинхронно
          import('./currency.js').then(module => {
            const result = module.purchaseItem(itemId);
            
            if (result.success) {
              showNotification(result.message, 'success');
              // Перерисовываем магазин
              showShop();
              // Обновляем интерфейс игры с новым балансом
              const userProfile = getUserProfile();
              const todaysChallenge = getTodaysChallenge();
              const streakDays = userProfile.streakDays;
              renderGameInterface(userProfile, todaysChallenge, streakDays);
            } else {
              showNotification(result.message, 'error');
            }
          });
        }
      });
    });
  }

  // Добавляем кнопки навигации
  function addNavigationButtons() {
    // Можно добавить дополнительные кнопки для навигации по игре
  }

  // Вспомогательная функция для получения правильной формы слова "день"
  function getDayForm(days) {
    if (days % 10 === 1 && days % 100 !== 11) {
      return 'день';
    } else if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
      return 'дня';
    } else {
      return 'дней';
    }
  }

  // Обработчик для кнопки броска
  rollButton.addEventListener("click", () => {
    // Скрываем кнопку Roll
    rollButton.style.display = "none";

    // Показываем контейнеры для кубиков
    diceContainer.style.display = "flex"; // Отображение контейнера
    resultDiv.style.display = "none";    // Прячем результат до завершения анимации

    // Генерируем случайные числа для обоих кубиков
    const randomRoll1 = Math.floor(Math.random() * 6) + 1;
    const randomRoll2 = Math.floor(Math.random() * 6) + 1;
    
    // Сохраняем значения кубиков
    currentDiceValues = [randomRoll1, randomRoll2];

    // Удаляем предыдущие анимации, если они есть
    currentAnimations.forEach(animation => animation.destroy());
    currentAnimations = [];

    // Выбираем стиль кубиков (можно добавить проверку разблокированных стилей)
    const profile = getUserProfile();
    let diceStylePath = '';
    
    // Проверяем, имеет ли пользователь разблокированные стили кубиков
    if (profile.unlockedItems.includes('dice_style_gold')) {
      diceStylePath = 'gold_';
    } else if (profile.unlockedItems.includes('dice_style_neon')) {
      diceStylePath = 'neon_';
    } else if (profile.unlockedItems.includes('dice_style_crystal')) {
      diceStylePath = 'crystal_';
    }
    
    // Если нет разблокированных стилей, используем стандартный путь
    const dicePath1 = diceStylePath ? `styles/${diceStylePath}dice${randomRoll1}.json` : `dice${randomRoll1}.json`;
    const dicePath2 = diceStylePath ? `styles/${diceStylePath}dice${randomRoll2}.json` : `dice${randomRoll2}.json`;

    // Создаём анимации для кубиков
    const animation1 = lottie.loadAnimation({
      container: dice1,
      renderer: "svg",
      loop: false,
      autoplay: true,
      path: dicePath1
    });

    const animation2 = lottie.loadAnimation({
      container: dice2,
      renderer: "svg",
      loop: false,
      autoplay: true,
      path: dicePath2
    });

    currentAnimations.push(animation1, animation2);

    // Показываем результат после завершения обеих анимаций
    let completedAnimations = 0;
    const onComplete = () => {
      completedAnimations++;
      if (completedAnimations === 2) {
        const totalResult = randomRoll1 + randomRoll2;
        resultDiv.textContent = `Результат: ${totalResult}`;
        resultDiv.style.display = "block"; // Отображаем результат
        
        // Обновляем статистику пользователя
        updateUserStats(randomRoll1, randomRoll2);
        
        // Проверяем выполнение испытания
        checkChallengeCompletion();
        
        // Показываем кнопку Roll снова
        setTimeout(() => {
          rollButton.style.display = "block";
        }, 1500);
      }
    };

    animation1.addEventListener("complete", onComplete);
    animation2.addEventListener("complete", onComplete);
  });

  // Обновляем статистику пользователя
  function updateUserStats(dice1Value, dice2Value) {
    const profile = getUserProfile();
    
    // Увеличиваем счетчик бросков
    profile.totalRolls++;
    
    // Сохраняем профиль
    localStorage.setItem('diceGameUserProfile', JSON.stringify(profile));
    
    // Обновляем отображение профиля
    const userProfile = getUserProfile();
    const todaysChallenge = getTodaysChallenge();
    const streakDays = userProfile.streakDays;
    renderGameInterface(userProfile, todaysChallenge, streakDays);
  }

  // Проверяем, выполнил ли пользователь испытание
  function checkChallengeCompletion() {
    const challenge = getTodaysChallenge();
    
    // Если испытание уже выполнено, ничего не делаем
    if (challenge.completed) {
      return;
    }
    
    const [dice1Value, dice2Value] = currentDiceValues;
    
    // Проверяем, выполнено ли условие испытания
    const isCompleted = checkChallengeCompletion(challenge, dice1Value, dice2Value);
    
    if (isCompleted) {
      // Обновляем статус испытания
      challenge.completed = true;
      localStorage.setItem(`challenge-${new Date().toISOString().split('T')[0]}`, JSON.stringify(challenge));
      
      // Получаем профиль пользователя
      const profile = getUserProfile();
      
      // Добавляем испытание в список выполненных
      profile.challengesCompleted.push(challenge.id);
      
      // Рассчитываем награду
      const baseReward = challenge.baseReward;
      const bonusReward = calculateStreakBonus(profile.streakDays, baseReward);
      const totalReward = baseReward + bonusReward;
      
      // Добавляем очки удачи
      addLuckPoints(totalReward);
      
      // Сохраняем профиль
      localStorage.setItem('diceGameUserProfile', JSON.stringify(profile));
      
      // Показываем модальное окно с наградой
      showRewardModal(totalReward, () => {
        // Обновляем интерфейс игры
        const userProfile = getUserProfile();
        const todaysChallenge = getTodaysChallenge();
        const streakDays = userProfile.streakDays;
        renderGameInterface(userProfile, todaysChallenge, streakDays);
      });
    }
  }
});
