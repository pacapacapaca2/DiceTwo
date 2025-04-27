document.addEventListener("DOMContentLoaded", () => {
  // Определение доступных коллекций кубиков
  const DICE_COLLECTIONS = [
    {
      id: "classic",
      name: "Классические",
      dices: [
        { id: "classic_red", name: "Красный классический", image: "images/dice_red.png", unlocked: true },
        { id: "classic_blue", name: "Синий классический", image: "images/dice_blue.png", unlocked: true },
        { id: "classic_gold", name: "Золотой классический", image: "images/dice_gold.png", unlocked: false, requirement: "level_5" }
      ]
    },
    {
      id: "premium",
      name: "Премиум",
      dices: [
        { id: "premium_crystal", name: "Кристальный", image: "images/dice_crystal.png", unlocked: false, requirement: "level_10" },
        { id: "premium_neon", name: "Неоновый", image: "images/dice_neon.png", unlocked: false, requirement: "level_15" },
        { id: "premium_galaxy", name: "Галактический", image: "images/dice_galaxy.png", unlocked: false, requirement: "level_20" }
      ]
    }
  ];

  // Определение достижений
  const ACHIEVEMENTS = [
    { id: "first_roll", name: "Первый бросок", description: "Сделайте первый бросок кубиков", points: 10, progress: 0, target: 1 },
    { id: "roll_50", name: "Начинающий игрок", description: "Сделайте 50 бросков", points: 25, progress: 0, target: 50 },
    { id: "roll_100", name: "Опытный игрок", description: "Сделайте 100 бросков", points: 50, progress: 0, target: 100 },
    { id: "doubles_10", name: "Дубль", description: "Выбросите 10 дублей", points: 30, progress: 0, target: 10 },
    { id: "snake_eyes", name: "Змеиные глаза", description: "Выбросите двойную единицу", points: 15, progress: 0, target: 1 },
    { id: "lucky_7", name: "Счастливая семерка", description: "Выбросите сумму 7 пять раз", points: 20, progress: 0, target: 5 }
  ];

  // Загрузка данных из localStorage
  const loadUserData = () => {
    const rollCount = parseInt(localStorage.getItem('dice_roll_count') || '0');
    const points = parseInt(localStorage.getItem('dice_points') || '0');
    const level = Math.floor((rollCount * 8) / 100); // Рассчитываем уровень
    
    // Загружаем статус коллекции кубиков
    const diceCollection = JSON.parse(localStorage.getItem('dice_collection') || 'null') || DICE_COLLECTIONS;
    
    // Разблокируем кубики в зависимости от уровня
    diceCollection.forEach(collection => {
      collection.dices.forEach(dice => {
        if (dice.requirement === "level_5" && level >= 5) dice.unlocked = true;
        if (dice.requirement === "level_10" && level >= 10) dice.unlocked = true;
        if (dice.requirement === "level_15" && level >= 15) dice.unlocked = true;
        if (dice.requirement === "level_20" && level >= 20) dice.unlocked = true;
      });
    });
    
    // Сохраняем обновленную коллекцию
    localStorage.setItem('dice_collection', JSON.stringify(diceCollection));
    
    // Загружаем прогресс достижений
    let achievements = JSON.parse(localStorage.getItem('dice_achievements') || 'null') || ACHIEVEMENTS;
    
    // Обновляем прогресс достижений
    if (rollCount > 0 && achievements[0].progress === 0) {
      achievements[0].progress = 1;
      achievements[0].completed = true;
    }
    
    achievements[1].progress = Math.min(rollCount, 50);
    achievements[1].completed = rollCount >= 50;
    
    achievements[2].progress = Math.min(rollCount, 100);
    achievements[2].completed = rollCount >= 100;
    
    // Другие данные, которые можно брать из истории бросков
    const rollHistory = JSON.parse(localStorage.getItem('dice_roll_history') || '[]');
    let doublesCount = 0;
    let snakeEyesCount = 0;
    let lucky7Count = 0;
    
    rollHistory.forEach(roll => {
      if (roll.dice1 === roll.dice2) doublesCount++;
      if (roll.dice1 === 1 && roll.dice2 === 1) snakeEyesCount++;
      if (roll.sum === 7) lucky7Count++;
    });
    
    achievements[3].progress = Math.min(doublesCount, 10);
    achievements[3].completed = doublesCount >= 10;
    
    achievements[4].progress = Math.min(snakeEyesCount, 1);
    achievements[4].completed = snakeEyesCount >= 1;
    
    achievements[5].progress = Math.min(lucky7Count, 5);
    achievements[5].completed = lucky7Count >= 5;
    
    // Сохраняем обновленные достижения
    localStorage.setItem('dice_achievements', JSON.stringify(achievements));
    
    return {
      rollCount,
      points,
      level,
      diceCollection,
      achievements
    };
  };

  // Создание интерфейса профиля
  const createProfileUI = () => {
    const userData = loadUserData();
    const contentContainer = document.querySelector('.min-page-content-height');
    if (!contentContainer) return;
    
    // Очищаем контейнер от индикатора загрузки
    contentContainer.innerHTML = '';
    
    // Создаем секцию профиля
    const profileSection = document.createElement('div');
    profileSection.className = 'daily-section';
    profileSection.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="30" fill="var(--tg-theme-button-color)"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M30 32C33.866 32 37 28.866 37 25C37 21.134 33.866 18 30 18C26.134 18 23 21.134 23 25C23 28.866 26.134 32 30 32ZM30 35C24.477 35 20 39.477 20 45V45.5C20 46.881 21.119 48 22.5 48H37.5C38.881 48 40 46.881 40 45.5V45C40 39.477 35.523 35 30 35Z" fill="white"/>
          </svg>
        </div>
        <div class="profile-info">
          <div class="profile-name">Пользователь</div>
          <div class="profile-stats">
            <div class="profile-level">
              Уровень <span class="level-badge">${userData.level}</span>
            </div>
            <div class="profile-points">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10.326 5.70729L15.5 6.52786L11.75 10.1881L12.652 15.3458L8 12.9L3.348 15.3458L4.25 10.1881L0.5 6.52786L5.674 5.70729L8 1Z" fill="var(--tg-theme-accent-text-color)"/>
              </svg>
              ${userData.points} очков
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Создаем секцию для коллекции кубиков
    const collectionSection = document.createElement('div');
    collectionSection.className = 'daily-section';
    
    let collectionHTML = `
      <div class="section-header">
        <div class="section-title">Коллекция кубиков</div>
      </div>
    `;
    
    userData.diceCollection.forEach(collection => {
      collectionHTML += `
        <div class="collection-category">
          <div class="category-title">${collection.name}</div>
          <div class="collection-grid">
            ${collection.dices.map(dice => `
              <div class="dice-item ${dice.unlocked ? '' : 'locked'}">
                <div class="dice-preview">
                  ${dice.unlocked 
                    ? `<img src="${dice.image}" alt="${dice.name}" onerror="this.src='images/dice_default.png'">`
                    : `<div class="dice-locked">🔒</div>`
                  }
                </div>
                <div class="dice-name">${dice.name}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
    
    collectionSection.innerHTML = collectionHTML;
    
    // Создаем секцию для достижений
    const achievementsSection = document.createElement('div');
    achievementsSection.className = 'daily-section';
    
    let achievementsHTML = `
      <div class="section-header">
        <div class="section-title">Достижения</div>
      </div>
    `;
    
    userData.achievements.forEach(achievement => {
      achievementsHTML += `
        <div class="task-item ${achievement.completed ? 'completed' : ''}">
          <div class="task-info">
            <div class="task-description">${achievement.name}</div>
            <div class="task-progress">
              <div class="task-progress-text">${achievement.progress}/${achievement.target}</div>
              <div class="task-reward">+${achievement.points}</div>
            </div>
          </div>
          <div class="achievement-description">${achievement.description}</div>
          <div class="task-progress-bar">
            <div class="task-progress-fill" style="width: ${Math.min(100, (achievement.progress / achievement.target) * 100)}%"></div>
          </div>
        </div>
      `;
    });
    
    achievementsSection.innerHTML = achievementsHTML;
    
    // Добавляем все секции в контейнер
    contentContainer.appendChild(profileSection);
    contentContainer.appendChild(collectionSection);
    contentContainer.appendChild(achievementsSection);
    
    // Добавляем стили
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .daily-section {
        padding: 16px;
        margin-bottom: 16px;
        background: var(--tg-theme-section-bg-color);
        border-radius: 10px;
      }
      
      .profile-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
      }
      
      .profile-avatar {
        width: 60px;
        height: 60px;
        margin-right: 16px;
        border-radius: 50%;
        overflow: hidden;
      }
      
      .profile-info {
        flex: 1;
      }
      
      .profile-name {
        font-size: 18px;
        font-weight: 590;
        color: var(--tg-theme-text-color);
        margin-bottom: 6px;
      }
      
      .profile-stats {
        display: flex;
        align-items: center;
      }
      
      .profile-level {
        font-size: 14px;
        color: var(--tg-theme-hint-color);
        margin-right: 12px;
        display: flex;
        align-items: center;
      }
      
      .profile-points {
        font-size: 14px;
        color: var(--tg-theme-hint-color);
        display: flex;
        align-items: center;
      }
      
      .profile-points svg {
        margin-right: 4px;
      }
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .section-title {
        font-size: 17px;
        font-weight: 590;
        color: var(--tg-theme-text-color);
      }
      
      .collection-category {
        margin-bottom: 16px;
      }
      
      .category-title {
        font-size: 15px;
        color: var(--tg-theme-hint-color);
        margin-bottom: 8px;
      }
      
      .collection-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      
      .dice-item {
        background: var(--tg-theme-secondary-bg-color);
        border-radius: 10px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .dice-preview {
        width: 60px;
        height: 60px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .dice-preview img {
        max-width: 100%;
        max-height: 100%;
      }
      
      .dice-locked {
        font-size: 24px;
      }
      
      .dice-name {
        font-size: 13px;
        color: var(--tg-theme-text-color);
        text-align: center;
      }
      
      .dice-item.locked {
        opacity: 0.5;
      }
      
      .level-badge {
        display: inline-block;
        background: var(--tg-theme-button-color);
        color: var(--tg-theme-button-text-color);
        font-size: 13px;
        font-weight: 590;
        padding: 2px 6px;
        border-radius: 12px;
        margin-left: 4px;
      }
      
      .achievement-description {
        font-size: 13px;
        color: var(--tg-theme-hint-color);
        margin-bottom: 8px;
      }
    `;
    
    document.head.appendChild(styleElement);
  };
  
  // Инициализация профиля
  createProfileUI();
}); 