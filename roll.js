document.addEventListener("DOMContentLoaded", () => {
  const rollButton = document.getElementById("roll-button");
  const resultDiv = document.getElementById("result");
  const diceContainer = document.getElementById("dice-container");
  const dice1 = document.getElementById("dice1");
  const dice2 = document.getElementById("dice2");
  const yourTrack = document.getElementById("your-track");
  const opponent1Track = document.getElementById("opponent1-track");
  const opponent2Track = document.getElementById("opponent2-track");
  const taskCard = document.getElementById("task-card");
  const taskButton = document.getElementById("task-button");
  const loader = document.querySelector('.loader');

  // Скрываем лоадер при загрузке страницы
  if (loader) {
    loader.style.display = 'none';
  }

  // Проверка наличия всех необходимых элементов
  if (!rollButton || !resultDiv || !diceContainer || !dice1 || !dice2 || 
      !yourTrack || !opponent1Track || !opponent2Track || !taskCard || !taskButton) {
    console.error("One or more DOM elements not found.");
    return;
  }

  // Инициализация игрового состояния
  const gameState = {
    playerPosition: 0,
    opponent1Position: 5, // Оппонент А уже находится на позиции 5
    opponent2Position: 3, // Оппонент М уже находится на позиции 3
    maxPosition: 25,
    tasksCompleted: 0,
    bonusRolls: 0,
    playerName: "Вы"
  };

  // Получаем ссылки на игроков на игровом поле
  const playerYou = yourTrack.querySelector('.player-you');
  const playerOpponent1 = opponent1Track.querySelector('.player-opponent1');
  const playerOpponent2 = opponent2Track.querySelector('.player-opponent2');

  // Функция для рендеринга положения игроков
  function renderPlayerPositions() {
    const trackWidth = yourTrack.clientWidth - 40; // Вычитаем ширину игрока
    const percentPerStep = 100 / gameState.maxPosition;
    
    // Устанавливаем положения игроков
    playerYou.style.left = `${gameState.playerPosition * percentPerStep}%`;
    playerOpponent1.style.left = `${gameState.opponent1Position * percentPerStep}%`;
    playerOpponent2.style.left = `${gameState.opponent2Position * percentPerStep}%`;
    
    // Обновляем отображение очков в таблице лидеров
    const leaderboardItems = document.querySelectorAll('.leaderboard-item span:last-child');
    if (leaderboardItems && leaderboardItems.length >= 3) {
      leaderboardItems[0].textContent = gameState.playerPosition;
      leaderboardItems[1].textContent = gameState.opponent1Position;
      leaderboardItems[2].textContent = gameState.opponent2Position;
    }
    
    // Проверяем, нужно ли показать задание
    if (Math.random() > 0.65 && taskCard.style.display === 'none') {
      taskCard.style.display = 'block';
    }
  }

  // Инициализация начальных позиций
  renderPlayerPositions();

  // Хранит текущие анимации
  let currentAnimations = []; 

  // Функция для проверки завершения игры
  function checkGameEnd() {
    if (gameState.playerPosition >= gameState.maxPosition) {
      resultDiv.textContent = `Поздравляем! Вы победили с результатом ${gameState.playerPosition}!`;
      resultDiv.style.display = "block";
      rollButton.disabled = true;
      return true;
    } else if (gameState.opponent1Position >= gameState.maxPosition) {
      resultDiv.textContent = `Игрок Алексей победил с результатом ${gameState.opponent1Position}!`;
      resultDiv.style.display = "block";
      rollButton.disabled = true;
      return true;
    } else if (gameState.opponent2Position >= gameState.maxPosition) {
      resultDiv.textContent = `Игрок Мария победила с результатом ${gameState.opponent2Position}!`;
      resultDiv.style.display = "block";
      rollButton.disabled = true;
      return true;
    }
    return false;
  }

  // Обработчик кнопки для задания
  taskButton.addEventListener("click", () => {
    // В реальной игре здесь будет логика проверки выполнения задания
    // Симулируем выполнение задания
    gameState.bonusRolls += 2;
    taskCard.style.display = 'none';
    resultDiv.textContent = `Вы получили +2 дополнительных броска!`;
    resultDiv.style.display = "block";
    
    // Перенаправляем на страницу с приглашениями
    if (window.Telegram && window.Telegram.WebApp) {
      // Здесь можно добавить навигацию внутри телеграм-приложения
      console.log("Переход на страницу с приглашениями");
    } else {
      window.location.href = "/DiceTwo/deposit";
    }
  });

  // Обработчик нажатия на кнопку броска
  rollButton.addEventListener("click", () => {
    // Проверяем, не завершена ли игра
    if (checkGameEnd()) return;

    // Скрываем результат и кнопку
    rollButton.style.display = "none";
    resultDiv.style.display = "none";
    
    // Показываем контейнер для кубиков
    diceContainer.style.display = "flex";

    // Генерируем случайные числа для обоих кубиков
    const randomRoll1 = Math.floor(Math.random() * 6) + 1;
    const randomRoll2 = Math.floor(Math.random() * 6) + 1;

    // Удаляем предыдущие анимации
    currentAnimations.forEach(animation => animation.destroy());
    currentAnimations = [];

    // Создаём анимации для кубиков
    const animation1 = lottie.loadAnimation({
      container: dice1,
      renderer: "svg",
      loop: false,
      autoplay: true,
      path: `dice${randomRoll1}.json`
    });

    const animation2 = lottie.loadAnimation({
      container: dice2,
      renderer: "svg",
      loop: false,
      autoplay: true,
      path: `dice${randomRoll2}.json`
    });

    currentAnimations.push(animation1, animation2);

    // Обработка завершения анимаций
    let completedAnimations = 0;
    const onComplete = () => {
      completedAnimations++;
      if (completedAnimations === 2) {
        const totalResult = randomRoll1 + randomRoll2;
        
        // Обновляем позицию игрока
        gameState.playerPosition += totalResult;
        
        // Обновляем позиции оппонентов (с некоторой случайностью)
        if (Math.random() > 0.5) {
          gameState.opponent1Position += Math.floor(Math.random() * 4) + 1;
        }
        if (Math.random() > 0.6) {
          gameState.opponent2Position += Math.floor(Math.random() * 3) + 1;
        }
        
        // Рендерим позиции игроков
        renderPlayerPositions();
        
        // Показываем результат
        resultDiv.textContent = `Вы выбросили: ${totalResult} и продвинулись на ${totalResult} шагов`;
        resultDiv.style.display = "block";
        
        // Проверяем завершение игры
        if (!checkGameEnd()) {
          // Если игра не завершена, показываем кнопку для следующего броска
          setTimeout(() => {
            diceContainer.style.display = "none";
            rollButton.style.display = "block";
            rollButton.textContent = gameState.bonusRolls > 0 
              ? `Бросить кубики (бонусные броски: ${gameState.bonusRolls})` 
              : "Бросить кубики";
          }, 1500);
        }
      }
    };

    animation1.addEventListener("complete", onComplete);
    animation2.addEventListener("complete", onComplete);
  });
});
