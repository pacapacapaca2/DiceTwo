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
    history: [], // история бросков
    
    // Новые данные для режима истории
    currentLocation: "Туманные равнины",
    currentNode: 2, // 0-индексированный номер текущего узла на карте
    storyProgress: {
      "Туманные равнины": [
        { completed: true, name: "Деревня", type: "normal" },
        { completed: true, name: "Лес", type: "normal" },
        { completed: false, name: "Пещера", type: "normal" },
        { completed: false, name: "Руины", type: "normal" },
        { completed: false, name: "Древний дракон", type: "boss" }
      ]
    },
    currentMission: {
      title: "Загадка пещеры",
      description: "Исследуй темную пещеру и найди древний артефакт. Бросай кубики, чтобы преодолеть препятствия!",
      difficulty: 2, // от 1 до 3
      targetRolls: 3, // количество успешных бросков для победы
      successfulRolls: 0, // текущий прогресс
      requiredValue: 7, // минимальное требуемое значение для успешного броска
      rewards: {
        xp: 25,
        stars: 15,
        crystals: 3,
        artifact: "Амулет силы"
      }
    },
    artifacts: [
      { id: "sword", name: "Древний меч", icon: "🗡️", collected: true },
      { id: "shield", name: "Щит героя", icon: "🛡️", collected: true },
      { id: "scroll", name: "Свиток мудрости", icon: "📜", collected: true },
      { id: "amulet", name: "Амулет силы", icon: "🔮", collected: false },
      { id: "potion", name: "Зелье исцеления", icon: "🧪", collected: false },
      { id: "key", name: "Ключ от сокровищницы", icon: "🔑", collected: false },
      { id: "crown", name: "Корона власти", icon: "👑", collected: false },
      { id: "gem", name: "Камень душ", icon: "💎", collected: false },
      { id: "book", name: "Книга заклинаний", icon: "📕", collected: false },
      { id: "staff", name: "Посох мага", icon: "🪄", collected: false },
      { id: "ring", name: "Кольцо невидимости", icon: "💍", collected: false },
      { id: "orb", name: "Сфера элементов", icon: "🔴", collected: false }
    ]
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
    
    // Обновляем текст кнопки броска
    if (gameState.currentMission.successfulRolls < gameState.currentMission.targetRolls) {
      const remainingRolls = gameState.currentMission.targetRolls - gameState.currentMission.successfulRolls;
      rollButton.textContent = `Бросить кубики (${remainingRolls})`;
    } else {
      rollButton.textContent = "Завершить миссию";
    }
    
    rollButton.disabled = false;
  }

  // Функция для проверки броска и начисления очков
  function evaluateRoll(roll1, roll2) {
    const total = roll1 + roll2;
    let points = total;
    let message = `Выпало: ${total}`;
    let missionSuccess = false;
    
    // Проверяем успех миссии
    if (total >= gameState.currentMission.requiredValue) {
      missionSuccess = true;
      gameState.currentMission.successfulRolls++;
      message += ` (успех! ✅)`;
    } else {
      message += ` (неудача ❌)`;
    }
    
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
      timestamp: new Date(),
      missionSuccess: missionSuccess
    });
    
    // Проверяем завершение миссии
    if (gameState.currentMission.successfulRolls >= gameState.currentMission.targetRolls) {
      message += " (миссия выполнена!)";
      rollButton.textContent = "Завершить миссию";
    }
    
    return { points, message, missionSuccess };
  }

  // Функция для завершения миссии и получения наград
  function completeMission() {
    // Отмечаем узел карты как завершенный
    const currentLocation = gameState.currentLocation;
    const currentNodeIndex = gameState.currentNode;
    
    if (gameState.storyProgress[currentLocation] && 
        gameState.storyProgress[currentLocation][currentNodeIndex]) {
      gameState.storyProgress[currentLocation][currentNodeIndex].completed = true;
    }
    
    // Выдаем награды
    const rewards = gameState.currentMission.rewards;
    gameState.xp += rewards.xp;
    gameState.stars += rewards.stars;
    
    // Проверяем переход на новый уровень
    if (gameState.xp >= 100) {
      gameState.level++;
      gameState.xp = gameState.xp - 100;
    }
    
    // Добавляем артефакт в коллекцию
    const artifactToAdd = rewards.artifact;
    if (artifactToAdd) {
      const artifactIndex = gameState.artifacts.findIndex(a => a.name === artifactToAdd);
      if (artifactIndex !== -1) {
        gameState.artifacts[artifactIndex].collected = true;
      }
    }
    
    // Отображаем результат
    resultDiv.textContent = `Миссия выполнена! Получено: ${rewards.xp} XP, ${rewards.stars} звезд, ${rewards.crystals} кристаллов, ${rewards.artifact}`;
    resultDiv.style.display = "block";
    
    // Разблокируем следующий узел
    if (currentNodeIndex < gameState.storyProgress[currentLocation].length - 1) {
      gameState.currentNode++;
      
      // Обновляем текущую миссию (Это упрощенно, в реальном приложении нужно загружать из базы)
      if (gameState.currentNode === gameState.storyProgress[currentLocation].length - 1) {
        // Босс
        gameState.currentMission = {
          title: "Древний дракон",
          description: "Сразись с могущественным драконом, хранителем древних сокровищ!",
          difficulty: 3,
          targetRolls: 5,
          successfulRolls: 0,
          requiredValue: 9,
          rewards: {
            xp: 50,
            stars: 100,
            crystals: 10,
            artifact: "Корона власти"
          }
        };
      } else {
        // Следующая обычная миссия
        gameState.currentMission = {
          title: "Тайны руин",
          description: "Исследуй древние руины и разгадай их тайны. Что скрывается в глубине веков?",
          difficulty: 2,
          targetRolls: 4,
          successfulRolls: 0,
          requiredValue: 8,
          rewards: {
            xp: 30,
            stars: 20,
            crystals: 5,
            artifact: "Ключ от сокровищницы"
          }
        };
      }
    } else {
      // Если это был последний узел, переходим на новую локацию
      // (упрощенно для примера)
      resultDiv.textContent += " Локация 'Туманные равнины' пройдена!";
    }
    
    // Обновляем UI
    setTimeout(() => {
      window.location.reload(); // Временное решение, в реальном приложении нужно обновить UI без перезагрузки
    }, 3000);
  }

  // Хранит текущие анимации
  let currentAnimations = []; 

  // Обработчик нажатия на кнопку броска
  rollButton.addEventListener("click", () => {
    // Проверяем, нужно ли завершить миссию
    if (gameState.currentMission.successfulRolls >= gameState.currentMission.targetRolls) {
      completeMission();
      return;
    }
    
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
        const { points, message, missionSuccess } = evaluateRoll(randomRoll1, randomRoll2);
        
        // Обновляем интерфейс
        updateUI();
        
        // Показываем результат
        resultDiv.textContent = message;
        resultDiv.style.display = "block";
        
        // Подсветка результата в зависимости от успеха миссии
        if (missionSuccess) {
          resultDiv.classList.add("success-result");
          resultDiv.classList.remove("failure-result");
        } else {
          resultDiv.classList.add("failure-result");
          resultDiv.classList.remove("success-result");
        }
        
        // Через некоторое время скрываем кубики и разблокируем кнопку для следующего броска
        setTimeout(() => {
          diceContainer.style.display = "none";
          rollButton.disabled = false;
          
          // Удаляем классы через некоторое время
          setTimeout(() => {
            resultDiv.classList.remove("success-result", "failure-result");
          }, 1000);
        }, 2000);
      }
    };

    animation1.addEventListener("complete", onComplete);
    animation2.addEventListener("complete", onComplete);
  });

  // Инициализация интерфейса при загрузке
  updateUI();
});
