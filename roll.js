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

  // Начальное состояние игры
  const initialGameState = {
    rollCount: 0,
    bestScore: 0,
    stars: 0,
    level: 1,
    xp: 0, // процент до следующего уровня
    bonusRolls: 0, // бонусные броски
    todayRolls: 0, // сколько бросков сделано сегодня
    maxDailyRolls: 999, // максимальное количество бросков (убираем ограничение)
    history: [], // история бросков
    
    // Данные для режима истории
    currentLocation: "Туманные равнины",
    currentNode: 0, // 0-индексированный номер текущего узла на карте
    storyProgress: {
      "Туманные равнины": [
        { completed: false, name: "Деревня", type: "normal" },
        { completed: false, name: "Лес", type: "normal" },
        { completed: false, name: "Пещера", type: "normal" },
        { completed: false, name: "Руины", type: "normal" },
        { completed: false, name: "Древний дракон", type: "boss" }
      ],
      "Огненные горы": [
        { completed: false, name: "Перевал", type: "normal" },
        { completed: false, name: "Пещеры", type: "normal" },
        { completed: false, name: "Вулкан", type: "normal" },
        { completed: false, name: "Кузница", type: "normal" },
        { completed: false, name: "Огненный элементаль", type: "boss" }
      ],
      "Ледяная пустошь": [
        { completed: false, name: "Аванпост", type: "normal" },
        { completed: false, name: "Замерзшее озеро", type: "normal" },
        { completed: false, name: "Ледник", type: "normal" },
        { completed: false, name: "Снежная крепость", type: "normal" },
        { completed: false, name: "Ледяной гигант", type: "boss" }
      ]
    },
    
    // Информация о доступных миссиях
    missions: {
      "Деревня": {
        title: "Спасение деревни",
        description: "Помоги жителям деревни справиться с нашествием крыс. Брось кубики, чтобы прогнать вредителей!",
        difficulty: 1,
        targetRolls: 2,
        requiredValue: 5,
        rewards: {
          xp: 10,
          stars: 5,
          crystals: 1,
          artifact: "Свиток мудрости"
        }
      },
      "Лес": {
        title: "Тайны леса",
        description: "Исследуй загадочный лес и найди потерянную тропу. Бросай кубики, чтобы преодолеть препятствия!",
        difficulty: 1,
        targetRolls: 3,
        requiredValue: 6,
        rewards: {
          xp: 15,
          stars: 10,
          crystals: 2,
          artifact: "Щит героя"
        }
      },
      "Пещера": {
        title: "Загадка пещеры",
        description: "Исследуй темную пещеру и найди древний артефакт. Бросай кубики, чтобы преодолеть препятствия!",
        difficulty: 2,
        targetRolls: 3,
        requiredValue: 7,
        rewards: {
          xp: 20,
          stars: 15,
          crystals: 3,
          artifact: "Амулет силы"
        }
      },
      "Руины": {
        title: "Тайны руин",
        description: "Исследуй древние руины и разгадай их тайны. Что скрывается в глубине веков?",
        difficulty: 2,
        targetRolls: 4,
        requiredValue: 8,
        rewards: {
          xp: 30,
          stars: 20,
          crystals: 5,
          artifact: "Ключ от сокровищницы"
        }
      },
      "Древний дракон": {
        title: "Древний дракон",
        description: "Сразись с могущественным драконом, хранителем древних сокровищ!",
        difficulty: 3,
        targetRolls: 5,
        requiredValue: 9,
        rewards: {
          xp: 50,
          stars: 100,
          crystals: 10,
          artifact: "Древний меч"
        }
      }
    },
    
    // Текущая активная миссия
    currentMission: null,
    
    // Информация об артефактах
    artifacts: [
      { id: "sword", name: "Древний меч", icon: "🗡️", collected: false, description: "Легендарное оружие, выкованное в незапамятные времена" },
      { id: "shield", name: "Щит героя", icon: "🛡️", collected: false, description: "Надежная защита от вражеских атак" },
      { id: "scroll", name: "Свиток мудрости", icon: "📜", collected: false, description: "Содержит древние знания и тайны" },
      { id: "amulet", name: "Амулет силы", icon: "🔮", collected: false, description: "Дарует носителю невероятную магическую мощь" },
      { id: "potion", name: "Зелье исцеления", icon: "🧪", collected: false, description: "Способно излечить любые раны и болезни" },
      { id: "key", name: "Ключ от сокровищницы", icon: "🔑", collected: false, description: "Открывает дверь к несметным богатствам" },
      { id: "crown", name: "Корона власти", icon: "👑", collected: false, description: "Символ могущества и власти над землями" },
      { id: "gem", name: "Камень душ", icon: "💎", collected: false, description: "Таинственный артефакт с невероятной энергией" },
      { id: "book", name: "Книга заклинаний", icon: "📕", collected: false, description: "Содержит мощные магические формулы" },
      { id: "staff", name: "Посох мага", icon: "🪄", collected: false, description: "Усиливает магические способности владельца" },
      { id: "ring", name: "Кольцо невидимости", icon: "💍", collected: false, description: "Делает носителя невидимым для окружающих" },
      { id: "orb", name: "Сфера элементов", icon: "🔴", collected: false, description: "Позволяет контролировать стихийные силы" }
    ]
  };

  // Загружаем сохраненное состояние или используем начальное
  let gameState = loadGameState() || {...initialGameState};
  
  // Устанавливаем текущую миссию на основе прогресса
  initCurrentMission();

  // Функция для сохранения состояния игры в localStorage
  function saveGameState() {
    localStorage.setItem('diceAdventure_gameState', JSON.stringify(gameState));
  }
  
  // Функция для загрузки состояния игры из localStorage
  function loadGameState() {
    const savedState = localStorage.getItem('diceAdventure_gameState');
    return savedState ? JSON.parse(savedState) : null;
  }
  
  // Функция для сброса прогресса (полного или частичного)
  function resetGameState(fullReset = false) {
    if (fullReset) {
      gameState = {...initialGameState};
    } else {
      // Сброс только игрового прогресса, но сохранение коллекций и статистики
      const artifacts = [...gameState.artifacts];
      const stars = gameState.stars;
      const rollCount = gameState.rollCount;
      const bestScore = gameState.bestScore;
      
      gameState = {...initialGameState};
      gameState.artifacts = artifacts;
      gameState.stars = stars;
      gameState.rollCount = rollCount;
      gameState.bestScore = bestScore;
    }
    
    saveGameState();
    initCurrentMission();
    updateUI();
    updateMapUI();
  }
  
  // Функция для инициализации текущей миссии на основе прогресса
  function initCurrentMission() {
    const location = gameState.currentLocation;
    const nodeIndex = gameState.currentNode;
    
    if (gameState.storyProgress[location] && gameState.storyProgress[location][nodeIndex]) {
      const nodeName = gameState.storyProgress[location][nodeIndex].name;
      const missionTemplate = gameState.missions[nodeName];
      
      if (missionTemplate) {
        gameState.currentMission = {
          ...missionTemplate,
          successfulRolls: 0
        };
      }
    }
  }
  
  // Функция для обновления визуального отображения карты миссий
  function updateMapUI() {
    const mapContainer = document.querySelector('.map-path');
    if (!mapContainer) return;
    
    // Очищаем содержимое
    mapContainer.innerHTML = '';
    
    // Получаем текущую локацию и узлы
    const location = gameState.currentLocation;
    const nodeIndex = gameState.currentNode;
    const nodes = gameState.storyProgress[location];
    
    if (!nodes) return;
    
    // Создаем узлы
    nodes.forEach((node, index) => {
      const nodeElement = document.createElement('div');
      nodeElement.className = `map-node ${node.completed ? 'completed' : ''} ${index === nodeIndex ? 'current' : ''} ${index > nodeIndex ? 'locked' : ''} ${node.type === 'boss' ? 'boss' : ''}`;
      
      const nodeIcon = document.createElement('div');
      nodeIcon.className = 'node-icon';
      
      if (node.completed) {
        nodeIcon.textContent = '✓';
      } else if (index === nodeIndex) {
        nodeIcon.textContent = '!';
      } else if (node.type === 'boss') {
        nodeIcon.textContent = '⚔️';
      } else {
        nodeIcon.textContent = '?';
      }
      
      const nodeLabel = document.createElement('div');
      nodeLabel.className = 'node-label';
      nodeLabel.textContent = node.name;
      
      nodeElement.appendChild(nodeIcon);
      nodeElement.appendChild(nodeLabel);
      mapContainer.appendChild(nodeElement);
    });
    
    // Обновляем заголовок локации
    const locationTitle = document.querySelector('.location-title');
    if (locationTitle) {
      locationTitle.textContent = location;
    }
  }
  
  // Функция для обновления информации о миссии
  function updateMissionUI() {
    const mission = gameState.currentMission;
    if (!mission) return;
    
    // Обновляем заголовок миссии
    const missionTitle = document.querySelector('.mission-title');
    if (missionTitle) {
      missionTitle.textContent = mission.title;
    }
    
    // Обновляем описание миссии
    const missionDescription = document.querySelector('.mission-description');
    if (missionDescription) {
      missionDescription.textContent = mission.description;
    }
    
    // Обновляем сложность
    const missionDifficulty = document.querySelector('.mission-difficulty');
    if (missionDifficulty) {
      let stars = '';
      for (let i = 0; i < 3; i++) {
        stars += i < mission.difficulty ? '★' : '☆';
      }
      missionDifficulty.textContent = stars;
    }
    
    // Обновляем награды
    const rewardItems = document.querySelectorAll('.reward-item');
    if (rewardItems.length >= 3) {
      // XP
      const xpIcon = rewardItems[0].querySelector('.reward-icon');
      const xpValue = rewardItems[0].querySelector('.reward-value');
      if (xpIcon && xpValue) {
        xpIcon.textContent = '🏆';
        xpValue.textContent = `+${mission.rewards.xp} опыта`;
      }
      
      // Звезды
      const starsIcon = rewardItems[1].querySelector('.reward-icon');
      const starsValue = rewardItems[1].querySelector('.reward-value');
      if (starsIcon && starsValue) {
        starsIcon.textContent = '💎';
        starsValue.textContent = `×${mission.rewards.crystals} кристалла`;
      }
      
      // Артефакт
      const artifactIcon = rewardItems[2].querySelector('.reward-icon');
      const artifactValue = rewardItems[2].querySelector('.reward-value');
      if (artifactIcon && artifactValue) {
        const artifact = gameState.artifacts.find(a => a.name === mission.rewards.artifact);
        if (artifact) {
          artifactIcon.textContent = artifact.icon;
          artifactValue.textContent = artifact.name;
        }
      }
    }
  }
  
  // Функция для обновления отображения коллекции артефактов
  function updateArtifactsUI() {
    const collectionContainer = document.querySelector('.artifacts-container');
    if (!collectionContainer) return;
    
    // Очищаем содержимое
    collectionContainer.innerHTML = '';
    
    // Получаем информацию о собранных артефактах
    const collectedCount = gameState.artifacts.filter(a => a.collected).length;
    const totalCount = gameState.artifacts.length;
    
    // Обновляем счетчик
    const collectionCount = document.querySelector('.collection-count');
    if (collectionCount) {
      collectionCount.textContent = `${collectedCount}/${totalCount}`;
    }
    
    // Добавляем собранные артефакты
    const collectedArtifacts = gameState.artifacts.filter(a => a.collected);
    collectedArtifacts.forEach(artifact => {
      const artifactElement = document.createElement('div');
      artifactElement.className = 'artifact-item collected';
      
      const artifactIcon = document.createElement('div');
      artifactIcon.className = 'artifact-icon';
      artifactIcon.textContent = artifact.icon;
      
      artifactElement.appendChild(artifactIcon);
      collectionContainer.appendChild(artifactElement);
    });
    
    // Добавляем несколько заблокированных слотов
    for (let i = 0; i < 5 && collectedCount + i < totalCount; i++) {
      const artifactElement = document.createElement('div');
      artifactElement.className = 'artifact-item locked';
      
      const artifactIcon = document.createElement('div');
      artifactIcon.className = 'artifact-icon';
      artifactIcon.textContent = '?';
      
      artifactElement.appendChild(artifactIcon);
      collectionContainer.appendChild(artifactElement);
    }
  }

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
    if (gameState.currentMission) {
      if (gameState.currentMission.successfulRolls < gameState.currentMission.targetRolls) {
        const remainingRolls = gameState.currentMission.targetRolls - gameState.currentMission.successfulRolls;
        rollButton.textContent = `Бросить кубики (${remainingRolls})`;
      } else {
        rollButton.textContent = "Завершить миссию";
      }
    } else {
      rollButton.textContent = "Бросить кубики";
    }
    
    rollButton.disabled = false;
    
    // Обновляем другие элементы интерфейса
    updateMapUI();
    updateMissionUI();
    updateArtifactsUI();
    
    // Сохраняем состояние
    saveGameState();
  }

  // Функция для проверки броска и начисления очков
  function evaluateRoll(roll1, roll2) {
    const total = roll1 + roll2;
    let points = total;
    let message = `Выпало: ${total}`;
    let missionSuccess = false;
    
    // Проверяем успех миссии
    if (gameState.currentMission && total >= gameState.currentMission.requiredValue) {
      missionSuccess = true;
      gameState.currentMission.successfulRolls++;
      message += ` (успех! ✅)`;
    } else if (gameState.currentMission) {
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
    if (gameState.currentMission && gameState.currentMission.successfulRolls >= gameState.currentMission.targetRolls) {
      message += " (миссия выполнена!)";
      rollButton.textContent = "Завершить миссию";
    }
    
    // Сохраняем состояние игры
    saveGameState();
    
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
      initCurrentMission();
    } else {
      // Если это был последний узел, переходим на новую локацию
      const locations = Object.keys(gameState.storyProgress);
      const currentLocationIndex = locations.indexOf(currentLocation);
      
      if (currentLocationIndex < locations.length - 1) {
        // Переходим к следующей локации
        gameState.currentLocation = locations[currentLocationIndex + 1];
        gameState.currentNode = 0;
        initCurrentMission();
        resultDiv.textContent += ` Открыта новая локация: ${gameState.currentLocation}!`;
      } else {
        // Все локации пройдены
        gameState.currentMission = null;
        resultDiv.textContent += " Поздравляем! Вы прошли все доступные локации!";
      }
    }
    
    // Сохраняем состояние игры
    saveGameState();
    
    // Обновляем UI
    setTimeout(() => {
      updateUI();
    }, 3000);
  }

  // Хранит текущие анимации
  let currentAnimations = []; 

  // Обработчик нажатия на кнопку броска
  rollButton.addEventListener("click", () => {
    // Проверяем, нужно ли завершить миссию
    if (gameState.currentMission && gameState.currentMission.successfulRolls >= gameState.currentMission.targetRolls) {
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
        } else if (gameState.currentMission) { // Только если мы в режиме миссии
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

  // Добавляем кнопку сброса прогресса (только для демонстрации)
  const resetButton = document.createElement('button');
  resetButton.id = 'reset-button';
  resetButton.className = 'secondary-button';
  resetButton.textContent = 'Сбросить прогресс';
  resetButton.onclick = () => {
    if (confirm('Вы уверены, что хотите сбросить прогресс? Это действие нельзя отменить.')) {
      resetGameState(false);
    }
  };
  
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.appendChild(resetButton);
  }

  // Инициализация интерфейса при загрузке
  updateUI();
});
