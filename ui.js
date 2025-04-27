// ui.js - Компоненты пользовательского интерфейса
// Отвечает за отображение ежедневных испытаний и прогресса пользователя

// Создает элемент ежедневного испытания
function createChallengeElement(challenge, streakDays) {
  const challengeContainer = document.createElement('div');
  challengeContainer.className = 'challenge-container';
  
  // Заголовок испытания
  const challengeHeader = document.createElement('div');
  challengeHeader.className = 'challenge-header';
  challengeHeader.innerHTML = `
    <h3>Ежедневное испытание</h3>
    <div class="streak-indicator">
      <i class="streak-icon">🔥</i>
      <span>${streakDays} ${getDayForm(streakDays)}</span>
    </div>
  `;
  challengeContainer.appendChild(challengeHeader);
  
  // Описание испытания
  const challengeDescription = document.createElement('div');
  challengeDescription.className = 'challenge-description';
  challengeDescription.textContent = challenge.description;
  challengeContainer.appendChild(challengeDescription);
  
  // Информация о награде
  const rewardInfo = document.createElement('div');
  rewardInfo.className = 'reward-info';
  
  // Расчет бонуса за серию
  let bonusAmount = 0;
  if (streakDays >= 3) {
    if (streakDays >= 30) {
      bonusAmount = challenge.baseReward * 2; // 200%
    } else if (streakDays >= 14) {
      bonusAmount = challenge.baseReward; // 100%
    } else if (streakDays >= 7) {
      bonusAmount = Math.floor(challenge.baseReward * 0.5); // 50%
    } else {
      bonusAmount = Math.floor(challenge.baseReward * 0.2); // 20%
    }
  }
  
  const totalReward = challenge.baseReward + bonusAmount;
  
  rewardInfo.innerHTML = `
    <div class="reward-base">
      <span>Базовая награда:</span>
      <span class="reward-amount">${challenge.baseReward} 💎</span>
    </div>
    ${bonusAmount > 0 ? `
      <div class="reward-bonus">
        <span>Бонус за серию ${streakDays} ${getDayForm(streakDays)}:</span>
        <span class="reward-amount">+${bonusAmount} 💎</span>
      </div>
    ` : ''}
    <div class="reward-total">
      <span>Итого:</span>
      <span class="reward-amount">${totalReward} 💎</span>
    </div>
  `;
  challengeContainer.appendChild(rewardInfo);
  
  // Статус испытания
  const challengeStatus = document.createElement('div');
  challengeStatus.className = 'challenge-status';
  challengeStatus.innerHTML = challenge.completed
    ? '<div class="status-complete">✅ Выполнено</div>'
    : '<div class="status-incomplete">⏳ Ожидает выполнения</div>';
  challengeContainer.appendChild(challengeStatus);
  
  return challengeContainer;
}

// Создает панель с информацией о профиле пользователя
function createProfilePanel(profile) {
  const profilePanel = document.createElement('div');
  profilePanel.className = 'profile-panel';
  
  profilePanel.innerHTML = `
    <div class="profile-stats">
      <div class="stat-item">
        <i class="stat-icon">💎</i>
        <div class="stat-value">${profile.luckPoints}</div>
        <div class="stat-label">Очки удачи</div>
      </div>
      <div class="stat-item">
        <i class="stat-icon">🎲</i>
        <div class="stat-value">${profile.totalRolls}</div>
        <div class="stat-label">Всего бросков</div>
      </div>
      <div class="stat-item">
        <i class="stat-icon">🔥</i>
        <div class="stat-value">${profile.streakDays}</div>
        <div class="stat-label">Дней подряд</div>
      </div>
      <div class="stat-item">
        <i class="stat-icon">🏆</i>
        <div class="stat-value">${profile.challengesCompleted.length}</div>
        <div class="stat-label">Испытаний пройдено</div>
      </div>
    </div>
  `;
  
  return profilePanel;
}

// Создает панель магазина с предметами
function createShopPanel(shopItems) {
  const shopPanel = document.createElement('div');
  shopPanel.className = 'shop-panel';
  
  const shopHeader = document.createElement('div');
  shopHeader.className = 'shop-header';
  shopHeader.innerHTML = '<h3>Магазин</h3>';
  shopPanel.appendChild(shopHeader);
  
  const itemsGrid = document.createElement('div');
  itemsGrid.className = 'items-grid';
  
  // Группируем предметы по типу
  const itemsByType = shopItems.reduce((acc, item) => {
    acc[item.type] = acc[item.type] || [];
    acc[item.type].push(item);
    return acc;
  }, {});
  
  // Отображаем предметы по категориям
  const typeLabels = {
    dice_style: 'Стили кубиков',
    background: 'Фоны',
    effect: 'Эффекты'
  };
  
  Object.keys(itemsByType).forEach(type => {
    const categoryLabel = document.createElement('div');
    categoryLabel.className = 'category-label';
    categoryLabel.textContent = typeLabels[type] || type;
    itemsGrid.appendChild(categoryLabel);
    
    const items = itemsByType[type];
    items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'shop-item';
      if (item.isUnlocked) {
        itemElement.classList.add('unlocked');
      }
      
      itemElement.innerHTML = `
        <div class="item-icon">${getItemIcon(item.type)}</div>
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-description">${item.description}</div>
        </div>
        <div class="item-cost">
          ${item.isUnlocked
            ? '<span class="unlocked-label">✅ Разблокировано</span>'
            : `<span class="cost-label">${item.cost} 💎</span>
               <button class="buy-button" data-id="${item.id}" ${!item.canPurchase ? 'disabled' : ''}>
                 ${item.canPurchase ? 'Купить' : 'Недостаточно очков'}
               </button>`
          }
        </div>
      `;
      
      itemsGrid.appendChild(itemElement);
    });
  });
  
  shopPanel.appendChild(itemsGrid);
  
  return shopPanel;
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

// Вспомогательная функция для получения иконки предмета
function getItemIcon(type) {
  switch (type) {
    case 'dice_style':
      return '🎲';
    case 'background':
      return '🖼️';
    case 'effect':
      return '✨';
    default:
      return '🎁';
  }
}

// Отображение уведомления
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Анимация появления
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Автоматическое скрытие через 3 секунды
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
  
  return notification;
}

// Отображение модального окна с наградой
function showRewardModal(reward, onClose) {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content reward-modal';
  
  modalContent.innerHTML = `
    <div class="reward-animation">🎉</div>
    <h2>Поздравляем!</h2>
    <p>Вы успешно выполнили испытание и получаете:</p>
    <div class="reward-amount-large">${reward} 💎</div>
    <button class="close-modal-button">Забрать награду</button>
  `;
  
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);
  
  // Анимация появления
  setTimeout(() => {
    modalOverlay.classList.add('show');
  }, 10);
  
  // Обработчик закрытия
  const closeButton = modalContent.querySelector('.close-modal-button');
  closeButton.addEventListener('click', () => {
    modalOverlay.classList.remove('show');
    setTimeout(() => {
      modalOverlay.remove();
      if (typeof onClose === 'function') {
        onClose();
      }
    }, 300);
  });
  
  return modalOverlay;
}

// Экспортируем функции для использования в других модулях
export {
  createChallengeElement,
  createProfilePanel,
  createShopPanel,
  showNotification,
  showRewardModal
}; 