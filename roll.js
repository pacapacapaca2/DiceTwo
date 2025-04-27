document.addEventListener("DOMContentLoaded", () => {
  const rollButton = document.getElementById("roll-button");
  const resultDiv = document.getElementById("result");
  const diceContainer = document.getElementById("dice-container");
  const dice1 = document.getElementById("dice1");
  const dice2 = document.getElementById("dice2");

  if (!rollButton || !resultDiv || !diceContainer || !dice1 || !dice2) {
    console.error("One or more DOM elements not found.");
    return;
  }

  // Инициализация менеджера заданий
  const taskManager = new DailyTasksManager();
  taskManager.initializeUI();

  let currentAnimations = []; // Хранит текущие анимации
  let rollHistory = JSON.parse(localStorage.getItem('dice_roll_history') || '[]');
  let rollCount = parseInt(localStorage.getItem('dice_roll_count') || '0');
  let streakCount = parseInt(localStorage.getItem('dice_streak_count') || '0');
  let lastRollDate = localStorage.getItem('dice_last_roll_date') || '';

  // Проверка на новый день
  const today = new Date().toDateString();
  if (today !== lastRollDate) {
    streakCount = 0;
    localStorage.setItem('dice_streak_count', streakCount.toString());
    localStorage.setItem('dice_last_roll_date', today);
  }

  // Обновляем счетчик бросков
  const updateRollCounter = () => {
    const rollCounterElement = document.getElementById('roll-counter');
    if (rollCounterElement) {
      rollCounterElement.textContent = rollCount.toString();
    }
  };

  // Обновляем историю бросков
  const updateRollHistory = (dice1Value, dice2Value, sum) => {
    const maxHistoryItems = 10;
    const timestamp = new Date().toISOString();
    
    rollHistory.unshift({
      dice1: dice1Value,
      dice2: dice2Value,
      sum: sum,
      timestamp: timestamp
    });
    
    if (rollHistory.length > maxHistoryItems) {
      rollHistory = rollHistory.slice(0, maxHistoryItems);
    }
    
    localStorage.setItem('dice_roll_history', JSON.stringify(rollHistory));
    
    // Обновляем UI истории, если такой элемент есть
    const historyContainer = document.getElementById('roll-history-list');
    if (historyContainer) {
      renderRollHistory();
    }
  };

  // Отображение истории бросков
  const renderRollHistory = () => {
    const historyContainer = document.getElementById('roll-history-list');
    if (!historyContainer) return;
    
    historyContainer.innerHTML = '';
    
    if (rollHistory.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'history-empty';
      emptyMessage.textContent = 'История бросков пуста';
      historyContainer.appendChild(emptyMessage);
      return;
    }
    
    rollHistory.forEach((roll, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const date = new Date(roll.timestamp);
      const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      
      historyItem.innerHTML = `
        <div class="history-dice">
          <span class="dice-value">${roll.dice1}</span> + 
          <span class="dice-value">${roll.dice2}</span> = 
          <span class="dice-sum">${roll.sum}</span>
        </div>
        <div class="history-time">${formattedTime}</div>
      `;
      
      historyContainer.appendChild(historyItem);
    });
  };

  // Обработка броска кубиков
  rollButton.addEventListener("click", () => {
    // Скрываем кнопку Roll
    rollButton.style.display = "none";

    // Показываем контейнеры для кубиков
    diceContainer.style.display = "flex"; // Отображение контейнера
    resultDiv.style.display = "none";    // Прячем результат до завершения анимации

    // Генерируем случайные числа для обоих кубиков
    const randomRoll1 = Math.floor(Math.random() * 6) + 1;
    const randomRoll2 = Math.floor(Math.random() * 6) + 1;
    const totalResult = randomRoll1 + randomRoll2;

    // Увеличиваем счетчик бросков
    rollCount++;
    localStorage.setItem('dice_roll_count', rollCount.toString());
    updateRollCounter();

    // Проверяем серию
    if (randomRoll1 === randomRoll2) {
      streakCount++;
      localStorage.setItem('dice_streak_count', streakCount.toString());
      
      // Если серия достигла 3, даем награду
      if (streakCount === 3) {
        setTimeout(() => {
          taskManager.addPoints(50);
          
          const notification = document.createElement('div');
          notification.className = 'bonus-notification fadeInDown';
          notification.innerHTML = `
            <div class="notification-content">
              <div class="notification-icon">🎲</div>
              <div class="notification-text">
                <div class="notification-title">Серия дублей!</div>
                <div class="notification-description">3 дубля подряд</div>
              </div>
              <div class="notification-reward">+50</div>
            </div>
          `;
          
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.classList.replace('fadeInDown', 'fadeInUp');
            setTimeout(() => notification.remove(), 200);
          }, 3000);
          
          streakCount = 0;
          localStorage.setItem('dice_streak_count', '0');
        }, 1500);
      }
    } else {
      streakCount = 0;
      localStorage.setItem('dice_streak_count', '0');
    }

    // Обновляем историю бросков
    updateRollHistory(randomRoll1, randomRoll2, totalResult);

    // Удаляем предыдущие анимации, если они есть
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

    // Показываем результат после завершения обеих анимаций
    let completedAnimations = 0;
    const onComplete = () => {
      completedAnimations++;
      if (completedAnimations === 2) {
        resultDiv.textContent = `Результат: ${totalResult}`;
        resultDiv.style.display = "block"; // Отображаем результат
        
        // Показываем кнопку повторного броска после короткой задержки
        setTimeout(() => {
          rollButton.style.display = "block";
        }, 800);
        
        // Обновляем прогресс заданий
        taskManager.updateTaskProgress([randomRoll1, randomRoll2]);
      }
    };

    animation1.addEventListener("complete", onComplete);
    animation2.addEventListener("complete", onComplete);
  });

  // Инициализация UI
  renderRollHistory();
  updateRollCounter();

  // Создаем UI для истории и заданий, если его еще нет
  const createAdditionalUI = () => {
    const minPageContentHeight = document.querySelector('.min-page-content-height');
    if (!minPageContentHeight) return;

    // Проверяем, существует ли уже наш UI
    if (document.getElementById('daily-tasks-container')) return;

    // Создаем контейнер для очков
    const pointsContainer = document.createElement('div');
    pointsContainer.className = 'points-container';
    pointsContainer.innerHTML = `
      <div class="points-icon">💎</div>
      <div class="points-info">
        <div class="points-title">Очки</div>
      </div>
      <div class="points-value" id="points-display">${taskManager.points}</div>
    `;

    // Создаем контейнер для ежедневного бонуса
    const dailyBonusContainer = document.createElement('div');
    dailyBonusContainer.className = 'daily-section';
    dailyBonusContainer.innerHTML = `
      <div class="section-header">
        <div class="section-title">Ежедневный бонус</div>
      </div>
      <div class="daily-bonus">
        <div class="bonus-icon">🎁</div>
        <div class="bonus-info">
          <div class="bonus-title">Получайте награду каждый день</div>
          <div class="bonus-description">Серия входов: ${taskManager.streak} дн.</div>
        </div>
        <button id="daily-bonus-button" class="daily-bonus-button ${taskManager.dailyBonus ? 'claimed' : ''}">
          ${taskManager.dailyBonus ? 'Получено' : 'Получить'}
        </button>
      </div>
    `;

    // Создаем контейнер для ежедневных заданий
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'daily-section';
    tasksContainer.id = 'daily-tasks-container';
    tasksContainer.innerHTML = `
      <div class="section-header">
        <div class="section-title">Ежедневные задания</div>
        <div id="tasks-completion-badge" class="tasks-completion-badge" style="display:none">✓</div>
      </div>
      <div id="daily-tasks-list"></div>
    `;

    // Создаем контейнер для статистики и истории
    const statsContainer = document.createElement('div');
    statsContainer.className = 'daily-section';
    statsContainer.innerHTML = `
      <div class="section-header">
        <div class="section-title">Статистика</div>
      </div>
      <div class="stats-grid">
        <div class="stats-item">
          <div class="stats-value" id="roll-counter">${rollCount}</div>
          <div class="stats-label">Всего бросков</div>
        </div>
        <div class="stats-item">
          <div class="stats-value">${Math.floor((rollCount * 8) / 100)}</div>
          <div class="stats-label">Уровень</div>
        </div>
      </div>
      <div class="section-header" style="margin-top: 16px;">
        <div class="section-title">История бросков</div>
      </div>
      <div id="roll-history-list" class="history-list"></div>
    `;

    // Вставляем все контейнеры перед контейнером с игрой
    const appContainer = document.getElementById('app');
    if (appContainer) {
      minPageContentHeight.insertBefore(pointsContainer, appContainer);
      minPageContentHeight.insertBefore(dailyBonusContainer, appContainer);
      minPageContentHeight.insertBefore(tasksContainer, appContainer);
      minPageContentHeight.appendChild(statsContainer);
    } else {
      minPageContentHeight.appendChild(pointsContainer);
      minPageContentHeight.appendChild(dailyBonusContainer);
      minPageContentHeight.appendChild(tasksContainer);
      minPageContentHeight.appendChild(statsContainer);
    }

    // Добавляем стили для новых элементов
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      
      .stats-item {
        background: var(--tg-theme-secondary-bg-color);
        border-radius: 10px;
        padding: 12px;
        text-align: center;
      }
      
      .stats-value {
        font-size: 18px;
        font-weight: 590;
        color: var(--tg-theme-text-color);
        margin-bottom: 4px;
      }
      
      .stats-label {
        font-size: 13px;
        color: var(--tg-theme-hint-color);
      }
      
      .history-list {
        margin-top: 8px;
      }
      
      .history-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .history-item:last-child {
        border-bottom: none;
      }
      
      .dice-value {
        font-weight: 510;
      }
      
      .dice-sum {
        font-weight: 590;
        color: var(--tg-theme-accent-text-color);
      }
      
      .history-time {
        font-size: 13px;
        color: var(--tg-theme-hint-color);
      }
      
      .history-empty {
        text-align: center;
        padding: 16px;
        color: var(--tg-theme-hint-color);
        font-size: 14px;
      }
      
      #app {
        margin-top: 20px;
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .center-btn {
        background: var(--tg-theme-button-color);
        color: var(--tg-theme-button-text-color);
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 510;
        cursor: pointer;
        margin: 20px 0;
      }
      
      #dice-container {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
      }
      
      .dice {
        width: 100px;
        height: 100px;
      }
      
      #result {
        font-size: 18px;
        font-weight: 590;
        color: var(--tg-theme-text-color);
        margin-bottom: 20px;
      }
    `;
    
    document.head.appendChild(styleElement);
    
    // После создания UI обновляем задания и бонусную кнопку
    taskManager.renderTasks();
    
    // Добавляем обработчик для кнопки бонуса
    const bonusButton = document.getElementById('daily-bonus-button');
    if (bonusButton && !taskManager.dailyBonus) {
      bonusButton.addEventListener('click', () => {
        const result = taskManager.claimDailyBonus();
        if (result) {
          bonusButton.classList.add('claimed');
          bonusButton.textContent = 'Получено';
          bonusButton.disabled = true;
          
          // Показываем уведомление о получении бонуса
          const notification = document.createElement('div');
          notification.className = 'bonus-notification fadeInDown';
          notification.innerHTML = `
            <div class="notification-content">
              <div class="notification-icon">🎁</div>
              <div class="notification-text">
                <div class="notification-title">Ежедневный бонус!</div>
                <div class="notification-description">Серия входов: ${result.streak} дн.</div>
              </div>
              <div class="notification-reward">+${result.bonus}</div>
            </div>
          `;
          
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.classList.replace('fadeInDown', 'fadeInUp');
            setTimeout(() => notification.remove(), 200);
          }, 3000);
        }
      });
    }
    
    renderRollHistory();
  };
  
  // Создаем дополнительный UI
  createAdditionalUI();
});
