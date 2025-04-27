document.addEventListener("DOMContentLoaded", () => {
  // Получаем элементы DOM
  const rollButton = document.getElementById("roll-button");
  const superRollButton = document.getElementById("super-roll-button");
  const resultDiv = document.getElementById("result");
  const diceContainer = document.getElementById("dice-container");
  const dice1 = document.getElementById("dice1");
  const dice2 = document.getElementById("dice2");
  const dailyBonus = document.getElementById("daily-bonus");
  const animationContainer = document.getElementById("animation-container");
  const streakDots = document.querySelectorAll(".streak-dot");
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
    streak: 2, // текущая серия бросков (дней подряд)
    streakMax: 5, // максимальная серия
    bonusRolls: 0, // бонусные броски
    todayRolls: 0, // сколько бросков сделано сегодня
    maxDailyRolls: 3, // максимальное количество бросков в день
    canSuperRoll: true, // можно ли сделать супер бросок
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
    
    // Обновляем индикатор серии
    streakDots.forEach((dot, index) => {
      dot.classList.toggle('active', index < gameState.streak);
    });
    
    // Обновляем доступность супер броска
    if (superRollButton) {
      superRollButton.disabled = !gameState.canSuperRoll || gameState.stars < 5;
      if (gameState.stars < 5) {
        superRollButton.querySelector('.super-roll-stars').style.color = '#ff6666';
      } else {
        superRollButton.querySelector('.super-roll-stars').style.color = 'white';
      }
    }
    
    // Обновляем текст кнопки броска в зависимости от оставшихся бросков
    const remainingRolls = gameState.maxDailyRolls - gameState.todayRolls + gameState.bonusRolls;
    
    if (remainingRolls <= 0) {
      rollButton.textContent = "Все броски использованы";
      rollButton.disabled = true;
    } else if (gameState.bonusRolls > 0) {
      rollButton.textContent = `Бросить кубики (${remainingRolls})`;
    } else {
      rollButton.textContent = `Бросить кубики (${remainingRolls})`;
    }
  }

  // Функция для проверки броска и начисления очков
  function evaluateRoll(roll1, roll2, isSuper = false) {
    const total = roll1 + roll2;
    let points = total;
    let message = `Выпало: ${total}`;
    
    // Множитель для супер броска
    const multiplier = isSuper ? 2 : 1;
    
    // Двойные числа дают бонус
    if (roll1 === roll2) {
      points = total * 2 * multiplier;
      message += ` (дубль! x${2 * multiplier})`;
    } else {
      points = total * multiplier;
      if (isSuper) message += ` (супер бросок x${multiplier})`;
    }
    
    createPointsAnimation(points);
    
    // Особые комбинации
    if (total === 7) {
      points += 3 * multiplier;
      message += ` (+${3 * multiplier} за счастливое число)`;
    } else if (total === 11) {
      points += 5 * multiplier;
      message += ` (+${5 * multiplier} за мощный бросок)`;
    } else if (total === 12) {
      points += 7 * multiplier;
      message += ` (+${7 * multiplier} за максимум)`;
    }
    
    // Обновляем статистику
    gameState.todayRolls++;
    gameState.rollCount++;
    gameState.stars += points;
    
    if (total > gameState.bestScore) {
      gameState.bestScore = total;
    }
    
    // Обновляем XP
    gameState.xp += points * 1.5;
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
      isSuper: isSuper,
      timestamp: new Date()
    });
    
    return { points, message };
  }

  // Хранит текущие анимации
  let currentAnimations = []; 

  // Функция для выполнения броска (обычного или супер)
  function performRoll(isSuper = false) {
    // Проверяем доступные броски для обычного броска
    if (!isSuper && gameState.todayRolls >= gameState.maxDailyRolls && gameState.bonusRolls <= 0) {
      resultDiv.textContent = "Вы использовали все броски на сегодня";
      resultDiv.style.display = "block";
      return;
    }
    
    // Проверяем возможность супер броска
    if (isSuper) {
      if (!gameState.canSuperRoll) {
        resultDiv.textContent = "Супер бросок уже использован";
        resultDiv.style.display = "block";
        return;
      }
      
      if (gameState.stars < 5) {
        resultDiv.textContent = "Недостаточно звезд для супер броска";
        resultDiv.style.display = "block";
        return;
      }
      
      // Используем звезды на супер бросок
      gameState.stars -= 5;
      gameState.canSuperRoll = false;
    } else if (gameState.todayRolls >= gameState.maxDailyRolls) {
      // Если есть бонусные броски, используем их
      gameState.bonusRolls--;
    }

    // Скрываем результат и кнопки, показываем кубики
    rollButton.style.display = "none";
    superRollButton.style.display = "none";
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

    // Для супер броска добавляем некоторые визуальные эффекты
    if (isSuper) {
      dice1.style.boxShadow = "0 0 15px #e67e22";
      dice2.style.boxShadow = "0 0 15px #e67e22";
    } else {
      dice1.style.boxShadow = "";
      dice2.style.boxShadow = "";
    }

    currentAnimations.push(animation1, animation2);

    // Обработка завершения анимаций
    let completedAnimations = 0;
    const onComplete = () => {
      completedAnimations++;
      if (completedAnimations === 2) {
        // Оцениваем бросок и получаем результаты
        const { points, message } = evaluateRoll(randomRoll1, randomRoll2, isSuper);
        
        // Обновляем интерфейс
        updateUI();
        
        // Показываем результат
        resultDiv.textContent = message;
        resultDiv.style.display = "block";
        
        // Через некоторое время скрываем кубики и показываем кнопки для следующего броска
        setTimeout(() => {
          diceContainer.style.display = "none";
          rollButton.style.display = "block";
          superRollButton.style.display = "block";
          
          // Сбрасываем стили кубиков
          dice1.style.boxShadow = "";
          dice2.style.boxShadow = "";
          
          // Если все броски использованы, обновляем состояние кнопки
          if (gameState.todayRolls >= gameState.maxDailyRolls && gameState.bonusRolls <= 0) {
            rollButton.disabled = true;
            rollButton.textContent = "Все броски использованы";
          }
        }, 2000);
      }
    };

    animation1.addEventListener("complete", onComplete);
    animation2.addEventListener("complete", onComplete);
  }

  // Обработчик нажатия на кнопку обычного броска
  rollButton.addEventListener("click", () => {
    performRoll(false);
  });

  // Обработчик нажатия на кнопку супер броска
  if (superRollButton) {
    superRollButton.addEventListener("click", () => {
      performRoll(true);
    });
  }

  // Инициализация интерфейса при загрузке
  updateUI();
});
