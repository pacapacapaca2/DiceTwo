// challenges.js - Система ежедневных испытаний
// Генерирует ежедневные испытания и проверяет результаты бросков

// Массив возможных типов испытаний
const CHALLENGE_TYPES = [
  { 
    type: "sumEqual", 
    description: "Выбросите сумму равную {target}", 
    difficulty: 1,
    rewardMin: 10,
    rewardMax: 20 
  },
  { 
    type: "sumGreater", 
    description: "Выбросите сумму больше {target}", 
    difficulty: 2,
    rewardMin: 15,
    rewardMax: 30 
  },
  { 
    type: "sumLess", 
    description: "Выбросите сумму меньше {target}", 
    difficulty: 2,
    rewardMin: 15,
    rewardMax: 30 
  },
  { 
    type: "doubles", 
    description: "Выбросите дубль (одинаковые значения на кубиках)", 
    difficulty: 3,
    rewardMin: 25,
    rewardMax: 40 
  },
  { 
    type: "specific", 
    description: "Выбросите {dice1} на первом кубике и {dice2} на втором", 
    difficulty: 5,
    rewardMin: 40,
    rewardMax: 60 
  },
  { 
    type: "consecutive", 
    description: "Выбросите последовательные числа (например, 3 и 4)", 
    difficulty: 4,
    rewardMin: 30,
    rewardMax: 50 
  }
];

// Массив повышенных наград за серию ежедневных входов
const STREAK_BONUSES = [
  { days: 3, bonusPercent: 20 },
  { days: 7, bonusPercent: 50 },
  { days: 14, bonusPercent: 100 },
  { days: 30, bonusPercent: 200 }
];

// Генерирует испытание на день
function generateDailyChallenge() {
  // Используем дату как зерно для генератора случайных чисел
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Простой генератор псевдослучайных чисел с фиксированным зерном
  const seededRandom = () => {
    let x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  };
  
  // Выбираем случайный тип испытания
  const challengeIndex = Math.floor(seededRandom() * CHALLENGE_TYPES.length);
  const challenge = CHALLENGE_TYPES[challengeIndex];
  
  // Создаем параметры испытания
  let parameters = {};
  let description = challenge.description;
  
  switch(challenge.type) {
    case "sumEqual":
    case "sumGreater":
    case "sumLess":
      parameters.target = Math.floor(seededRandom() * 9) + 3; // Значения от 3 до 11
      description = description.replace("{target}", parameters.target);
      break;
    case "specific":
      parameters.dice1 = Math.floor(seededRandom() * 6) + 1;
      parameters.dice2 = Math.floor(seededRandom() * 6) + 1;
      description = description
        .replace("{dice1}", parameters.dice1)
        .replace("{dice2}", parameters.dice2);
      break;
  }
  
  // Рассчитываем базовую награду
  const baseReward = Math.floor(seededRandom() * (challenge.rewardMax - challenge.rewardMin + 1)) + challenge.rewardMin;
  
  return {
    id: `challenge-${today.toISOString().split('T')[0]}`,
    type: challenge.type,
    description,
    parameters,
    baseReward,
    completed: false
  };
}

// Проверяет, выполнил ли игрок испытание
function checkChallengeCompletion(challenge, dice1Value, dice2Value) {
  const sum = dice1Value + dice2Value;
  
  switch(challenge.type) {
    case "sumEqual":
      return sum === challenge.parameters.target;
    case "sumGreater":
      return sum > challenge.parameters.target;
    case "sumLess":
      return sum < challenge.parameters.target;
    case "doubles":
      return dice1Value === dice2Value;
    case "specific":
      return dice1Value === challenge.parameters.dice1 && dice2Value === challenge.parameters.dice2;
    case "consecutive":
      return Math.abs(dice1Value - dice2Value) === 1;
    default:
      return false;
  }
}

// Вычисляет бонус на основе серии входов (streak)
function calculateStreakBonus(streakDays, baseReward) {
  // Находим подходящий бонус из таблицы
  for (let i = STREAK_BONUSES.length - 1; i >= 0; i--) {
    if (streakDays >= STREAK_BONUSES[i].days) {
      return Math.floor(baseReward * STREAK_BONUSES[i].bonusPercent / 100);
    }
  }
  return 0;
}

// Экспортируем функции для использования в других модулях
export {
  generateDailyChallenge,
  checkChallengeCompletion,
  calculateStreakBonus
}; 