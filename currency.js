// currency.js - Система виртуальной валюты и профиля пользователя
// Управляет очками удачи, серией входов и разблокированным контентом

// Начальное состояние профиля пользователя
const DEFAULT_USER_PROFILE = {
  userId: null,           // ID пользователя в Telegram
  luckPoints: 0,          // Очки удачи
  totalRolls: 0,          // Общее количество бросков
  unlockedItems: [],      // Разблокированные предметы
  streakDays: 0,          // Текущая серия ежедневных входов
  lastVisit: null,        // Дата последнего входа
  challengesCompleted: [] // Завершенные испытания
};

// Каталог предметов, которые можно разблокировать
const UNLOCKABLE_ITEMS = [
  { 
    id: "dice_style_gold", 
    name: "Золотые кубики", 
    description: "Роскошные золотые кубики с драгоценными камнями", 
    cost: 100,
    type: "dice_style" 
  },
  { 
    id: "dice_style_neon", 
    name: "Неоновые кубики", 
    description: "Яркие неоновые кубики светятся в темноте", 
    cost: 150,
    type: "dice_style" 
  },
  { 
    id: "dice_style_crystal", 
    name: "Хрустальные кубики", 
    description: "Прозрачные кубики из чистого хрусталя", 
    cost: 200,
    type: "dice_style" 
  },
  { 
    id: "background_forest", 
    name: "Мистический лес", 
    description: "Фон с загадочным темным лесом", 
    cost: 120,
    type: "background" 
  },
  { 
    id: "background_galaxy", 
    name: "Космическая галактика", 
    description: "Завораживающий космический фон", 
    cost: 180,
    type: "background" 
  },
  { 
    id: "effect_fireworks", 
    name: "Фейерверк удачи", 
    description: "Эффект фейерверка при удачном броске", 
    cost: 90,
    type: "effect" 
  }
];

// Получение профиля пользователя из локального хранилища
function getUserProfile() {
  try {
    const storedProfile = localStorage.getItem('diceGameUserProfile');
    if (storedProfile) {
      return JSON.parse(storedProfile);
    }
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
  }
  
  return { ...DEFAULT_USER_PROFILE };
}

// Сохранение профиля пользователя в локальное хранилище
function saveUserProfile(profile) {
  try {
    localStorage.setItem('diceGameUserProfile', JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении профиля:', error);
    return false;
  }
}

// Обновление счетчика серии ежедневных входов
function updateLoginStreak() {
  const profile = getUserProfile();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!profile.lastVisit) {
    // Первый вход
    profile.streakDays = 1;
  } else {
    const lastVisitDate = new Date(profile.lastVisit);
    lastVisitDate.setHours(0, 0, 0, 0);
    
    const timeDiff = today - lastVisitDate;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Последовательное посещение
      profile.streakDays++;
    } else if (daysDiff > 1) {
      // Пропущен день или более, сбрасываем счетчик
      profile.streakDays = 1;
    }
    // Если daysDiff === 0, пользователь заходит в тот же день, счетчик не меняется
  }
  
  profile.lastVisit = today.toISOString();
  saveUserProfile(profile);
  
  return profile.streakDays;
}

// Добавление очков удачи пользователю
function addLuckPoints(amount) {
  const profile = getUserProfile();
  profile.luckPoints += amount;
  saveUserProfile(profile);
  return profile.luckPoints;
}

// Проверка, может ли пользователь приобрести предмет
function canPurchaseItem(itemId) {
  const profile = getUserProfile();
  const item = UNLOCKABLE_ITEMS.find(i => i.id === itemId);
  
  if (!item) return false;
  if (profile.unlockedItems.includes(itemId)) return false;
  
  return profile.luckPoints >= item.cost;
}

// Покупка предмета
function purchaseItem(itemId) {
  if (!canPurchaseItem(itemId)) {
    return { success: false, message: "Недостаточно очков или предмет уже разблокирован" };
  }
  
  const profile = getUserProfile();
  const item = UNLOCKABLE_ITEMS.find(i => i.id === itemId);
  
  profile.luckPoints -= item.cost;
  profile.unlockedItems.push(itemId);
  
  saveUserProfile(profile);
  
  return { 
    success: true, 
    message: `Вы успешно приобрели "${item.name}"!`,
    newBalance: profile.luckPoints 
  };
}

// Проверка, разблокирован ли предмет
function isItemUnlocked(itemId) {
  const profile = getUserProfile();
  return profile.unlockedItems.includes(itemId);
}

// Получение списка предметов для магазина
function getShopItems() {
  const profile = getUserProfile();
  
  return UNLOCKABLE_ITEMS.map(item => ({
    ...item,
    isUnlocked: profile.unlockedItems.includes(item.id),
    canPurchase: profile.luckPoints >= item.cost && !profile.unlockedItems.includes(item.id)
  }));
}

// Экспортируем функции для использования в других модулях
export {
  getUserProfile,
  updateLoginStreak,
  addLuckPoints,
  canPurchaseItem,
  purchaseItem,
  isItemUnlocked,
  getShopItems,
  UNLOCKABLE_ITEMS
}; 