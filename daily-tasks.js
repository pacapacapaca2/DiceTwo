// Система ежедневных заданий и наград
const DAILY_TASKS = [
  { id: 1, description: "Выбросить сумму больше 8", target: 3, reward: 50, type: "sum-above", threshold: 8 },
  { id: 2, description: "Выбросить дубль (два одинаковых числа)", target: 1, reward: 30, type: "doubles" },
  { id: 3, description: "Выбросить сумму ровно 7", target: 2, reward: 40, type: "exact-sum", value: 7 },
  { id: 4, description: "Выбросить два кубика с суммой меньше 5", target: 1, reward: 60, type: "sum-below", threshold: 5 },
  { id: 5, description: "Выбросить шестерку на любом кубике", target: 3, reward: 25, type: "specific-value", value: 6 }
];

// Класс для управления ежедневными заданиями
class DailyTasksManager {
  constructor() {
    this.tasks = this.loadTasks();
    this.points = this.loadPoints();
    this.lastReset = this.loadLastReset();
    this.dailyBonus = this.loadDailyBonus();
    this.streak = this.loadStreak();
    
    // Проверка необходимости сброса
    this.checkForReset();
  }

  // Загрузка данных из localStorage
  loadTasks() {
    const saved = localStorage.getItem('dice_daily_tasks');
    return saved ? JSON.parse(saved) : this.generateDailyTasks();
  }

  loadPoints() {
    return parseInt(localStorage.getItem('dice_points') || '0');
  }

  loadLastReset() {
    return localStorage.getItem('dice_last_reset') || new Date().toDateString();
  }

  loadDailyBonus() {
    return JSON.parse(localStorage.getItem('dice_daily_bonus') || 'false');
  }

  loadStreak() {
    return parseInt(localStorage.getItem('dice_streak') || '0');
  }

  // Сохранение данных в localStorage
  saveTasks() {
    localStorage.setItem('dice_daily_tasks', JSON.stringify(this.tasks));
  }

  savePoints() {
    localStorage.setItem('dice_points', this.points.toString());
  }

  saveLastReset() {
    localStorage.setItem('dice_last_reset', this.lastReset);
  }

  saveDailyBonus() {
    localStorage.setItem('dice_daily_bonus', JSON.stringify(this.dailyBonus));
  }

  saveStreak() {
    localStorage.setItem('dice_streak', this.streak.toString());
  }

  // Генерация случайных заданий на день
  generateDailyTasks() {
    // Перемешиваем и выбираем 3 случайных задания
    const shuffled = [...DAILY_TASKS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    return selected.map(task => ({
      ...task,
      progress: 0,
      completed: false
    }));
  }

  // Проверка необходимости сброса заданий (новый день)
  checkForReset() {
    const today = new Date().toDateString();
    if (today !== this.lastReset) {
      // Новый день - сбрасываем задания
      this.tasks = this.generateDailyTasks();
      this.lastReset = today;
      this.dailyBonus = false;
      
      // Обновляем или сбрасываем серию входов
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (this.lastReset === yesterday.toDateString()) {
        this.streak += 1;
      } else {
        this.streak = 1;
      }
      
      this.saveLastReset();
      this.saveTasks();
      this.saveDailyBonus();
      this.saveStreak();
    }
  }

  // Обновление прогресса по заданию
  updateTaskProgress(diceValues) {
    const sum = diceValues[0] + diceValues[1];
    const isDouble = diceValues[0] === diceValues[1];
    let updated = false;

    this.tasks.forEach(task => {
      if (task.completed) return;

      let progressUpdated = false;
      
      switch (task.type) {
        case 'sum-above':
          if (sum > task.threshold) progressUpdated = true;
          break;
        case 'sum-below':
          if (sum < task.threshold) progressUpdated = true;
          break;
        case 'exact-sum':
          if (sum === task.value) progressUpdated = true;
          break;
        case 'doubles':
          if (isDouble) progressUpdated = true;
          break;
        case 'specific-value':
          if (diceValues.includes(task.value)) progressUpdated = true;
          break;
      }

      if (progressUpdated) {
        task.progress++;
        if (task.progress >= task.target) {
          task.completed = true;
          this.addPoints(task.reward);
          this.showTaskCompletionNotification(task);
        }
        updated = true;
      }
    });

    if (updated) {
      this.saveTasks();
      this.renderTasks();
    }
  }

  // Добавление очков
  addPoints(amount) {
    this.points += amount;
    this.savePoints();
    this.updatePointsDisplay();
  }

  // Собрать ежедневный бонус
  claimDailyBonus() {
    if (this.dailyBonus) return false;
    
    // Базовый бонус + бонус за серию входов
    const bonus = 20 + Math.min(this.streak * 5, 50);
    this.addPoints(bonus);
    this.dailyBonus = true;
    this.saveDailyBonus();
    
    return {bonus, streak: this.streak};
  }

  // Отображение уведомления о выполнении задания
  showTaskCompletionNotification(task) {
    const notification = document.createElement('div');
    notification.className = 'task-notification fadeInDown';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">✓</div>
        <div class="notification-text">
          <div class="notification-title">Задание выполнено!</div>
          <div class="notification-description">${task.description}</div>
        </div>
        <div class="notification-reward">+${task.reward}</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
      notification.classList.replace('fadeInDown', 'fadeInUp');
      setTimeout(() => notification.remove(), 200);
    }, 3000);
  }

  // Отрисовка заданий в интерфейсе
  renderTasks() {
    const tasksContainer = document.getElementById('daily-tasks-list');
    if (!tasksContainer) return;
    
    tasksContainer.innerHTML = '';
    
    this.tasks.forEach(task => {
      const taskElement = document.createElement('div');
      taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
      
      taskElement.innerHTML = `
        <div class="task-info">
          <div class="task-description">${task.description}</div>
          <div class="task-progress">
            <div class="task-progress-text">${task.progress}/${task.target}</div>
            <div class="task-reward">+${task.reward}</div>
          </div>
        </div>
        <div class="task-progress-bar">
          <div class="task-progress-fill" style="width: ${Math.min(100, (task.progress / task.target) * 100)}%"></div>
        </div>
      `;
      
      tasksContainer.appendChild(taskElement);
    });

    // Проверяем, все ли задания выполнены
    const allCompleted = this.tasks.every(task => task.completed);
    const completionBadge = document.getElementById('tasks-completion-badge');
    
    if (completionBadge) {
      completionBadge.style.display = allCompleted ? 'block' : 'none';
    }
  }

  // Обновление отображения очков
  updatePointsDisplay() {
    const pointsDisplay = document.getElementById('points-display');
    if (pointsDisplay) {
      pointsDisplay.textContent = this.points;
    }
  }

  // Инициализация интерфейса
  initializeUI() {
    this.renderTasks();
    this.updatePointsDisplay();
    
    // Проверяем, получен ли ежедневный бонус
    const bonusButton = document.getElementById('daily-bonus-button');
    if (bonusButton) {
      if (this.dailyBonus) {
        bonusButton.classList.add('claimed');
        bonusButton.textContent = 'Бонус получен';
        bonusButton.disabled = true;
      } else {
        bonusButton.addEventListener('click', () => {
          const result = this.claimDailyBonus();
          if (result) {
            bonusButton.classList.add('claimed');
            bonusButton.textContent = 'Бонус получен';
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
    }
  }
}

// Экспортируем класс для использования в других файлах
window.DailyTasksManager = DailyTasksManager; 