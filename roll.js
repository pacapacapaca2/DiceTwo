document.addEventListener("DOMContentLoaded", () => {
  // Получаем элементы DOM
  const rollButton = document.getElementById("roll-button");
  const resultDiv = document.getElementById("result");
  const diceContainer = document.getElementById("dice-container");
  const dice1 = document.getElementById("dice1");
  const dice2 = document.getElementById("dice2");
  const animationContainer = document.getElementById("animation-container");
  const loader = document.querySelector('.loader');
  const progressFill = document.querySelector('.progress-fill');
  const progressValue = document.querySelector('.progress-value');
  const statValues = document.querySelectorAll('.stat-value');

  // Скрываем лоадер при загрузке страницы
  if (loader) {
    loader.style.display = 'none';
  }

  // Проверка наличия всех необходимых элементов
  if (!rollButton || !resultDiv || !diceContainer || !dice1 || !dice2) {
    console.error("One or more DOM elements not found.");
    return;
  }

  // Состояние игры
  const gameState = {
    rollCount: 24,
    bestScore: 12,
    stars: 32,
    level: 3,
    xp: 60, // процент до следующего уровня
    bonusRolls: 0, // бонусные броски
    todayRolls: 0, // сколько бросков сделано сегодня
    maxDailyRolls: 999, // максимальное количество бросков (убираем ограничение)
    history: [] // история бросков
  };

  // Функция для создания анимации очков
  function createPointsAnimation(points) {
    const pointsEl = document.createElement("div");
    pointsEl.className = "points-animation";
    pointsEl.textContent = points > 0 ? `+${points}` : points;
    
    // Случайная позиция в пределах контейнера
    const x = Math.random() * 80 + 10; // от 10% до 90% ширины
    const y = Math.random() * 30 + 35; // от 35% до 65% высоты
    
    pointsEl.style.left = `${x}%`;
    pointsEl.style.top = `${y}%`;
    
    animationContainer.appendChild(pointsEl);
    
    // Удаляем элемент после завершения анимации
    setTimeout(() => {
      pointsEl.remove();
    }, 1500);
  }

  // Функция для обновления пользовательского интерфейса
  function updateUI() {
    // Обновляем уровень и прогресс
    if (progressValue) progressValue.textContent = gameState.level;
    if (progressFill) progressFill.style.width = `${gameState.xp}%`;
    
    // Обновляем статистику
    if (statValues && statValues.length >= 3) {
      statValues[0].textContent = gameState.rollCount;
      statValues[1].textContent = gameState.bestScore;
      statValues[2].textContent = `★ ${gameState.stars}`;
    }
    
    // Обновляем текст кнопки броска без отображения ограничений
    rollButton.textContent = "Бросить кубики";
    rollButton.disabled = false;
  }

  // Функция для проверки броска и начисления очков
  function evaluateRoll(roll1, roll2) {
    const total = roll1 + roll2;
    let points = total;
    let message = `Выпало: ${total}`;
    
    // Двойные числа дают бонус
    if (roll1 === roll2) {
      points = total * 2;
      message += ` (дубль! x2)`;
      createPointsAnimation(points);
    } else {
      createPointsAnimation(points);
    }
    
    // Особые комбинации
    if (total === 7) {
      points += 3;
      message += " (+3 за счастливое число)";
    } else if (total === 11) {
      points += 5;
      message += " (+5 за мощный бросок)";
    } else if (total === 12) {
      points += 7;
      message += " (+7 за максимум)";
    }
    
    // Обновляем статистику
    gameState.todayRolls++;
    gameState.rollCount++;
    gameState.stars += points;
    
    if (total > gameState.bestScore) {
      gameState.bestScore = total;
    }
    
    // Обновляем XP
    gameState.xp += points * 2;
    if (gameState.xp >= 100) {
      gameState.level++;
      gameState.xp = gameState.xp - 100;
      message += " (новый уровень!)";
    }
    
    // Сохраняем в историю
    gameState.history.push({
      roll1: roll1,
      roll2: roll2,
      total: total,
      points: points,
      timestamp: new Date()
    });
    
    return { points, message };
  }

  // Хранит текущие анимации
  let currentAnimations = []; 

  // Обработчик нажатия на кнопку броска
  rollButton.addEventListener("click", () => {
    // Блокируем кнопку на время анимации
    rollButton.disabled = true;
    
    // Скрываем результат и показываем кубики
    resultDiv.style.display = "none";
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
        // Оцениваем бросок и получаем результаты
        const { points, message } = evaluateRoll(randomRoll1, randomRoll2);
        
        // Обновляем интерфейс
        updateUI();
        
        // Показываем результат
        resultDiv.textContent = message;
        resultDiv.style.display = "block";
        
        // Через некоторое время скрываем кубики и разблокируем кнопку для следующего броска
        setTimeout(() => {
          diceContainer.style.display = "none";
          rollButton.disabled = false;
        }, 2000);
      }
    };

    animation1.addEventListener("complete", onComplete);
    animation2.addEventListener("complete", onComplete);
  });

  // Инициализация интерфейса при загрузке
  updateUI();
});
