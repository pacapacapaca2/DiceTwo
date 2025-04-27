document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.expand();
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            window.location.href = '/DiceTwo/games/';
        });
    }

    // Элементы DOM
    const diceContainer = document.getElementById('dice-container');
    const diceElements = document.querySelectorAll('.dice');
    const rollButton = document.getElementById('roll-button');
    const backButton = document.getElementById('back-button');
    const scoreRows = document.querySelectorAll('.score-row');
    const upperBonusElement = document.getElementById('upper-bonus');
    const upperTotalElement = document.getElementById('upper-total');
    const lowerTotalElement = document.getElementById('lower-total');
    const grandTotalElement = document.getElementById('grand-total');

    // Состояние игры
    const gameState = {
        dice: [1, 2, 3, 4, 5],
        held: [false, false, false, false, false],
        rollsLeft: 3,
        scores: {
            ones: null,
            twos: null,
            threes: null,
            fours: null,
            fives: null,
            sixes: null,
            'three-of-a-kind': null,
            'four-of-a-kind': null,
            'full-house': null,
            'small-straight': null,
            'large-straight': null,
            'yahtzee': null,
            'chance': null
        },
        turnsLeft: 13
    };

    // Функция для обновления отображения кубиков
    function updateDiceDisplay() {
        diceElements.forEach((die, index) => {
            const valueElement = die.querySelector('.dice-value');
            valueElement.textContent = gameState.dice[index];
            
            if (gameState.held[index]) {
                die.classList.add('held');
            } else {
                die.classList.remove('held');
            }
        });
    }

    // Функция для броска кубиков
    function rollDice() {
        if (gameState.rollsLeft <= 0 || gameState.turnsLeft <= 0) {
            return;
        }

        // Бросаем только незафиксированные кубики
        gameState.dice = gameState.dice.map((die, index) => {
            if (!gameState.held[index]) {
                return Math.floor(Math.random() * 6) + 1;
            }
            return die;
        });

        // Обновляем счетчик бросков
        gameState.rollsLeft--;
        rollButton.textContent = `Бросить кубики (${gameState.rollsLeft})`;
        
        if (gameState.rollsLeft <= 0) {
            rollButton.disabled = true;
        }

        // Обновляем отображение
        updateDiceDisplay();
        updatePossibleScores();
    }

    // Функция для расчета возможных очков
    function calculateScore(category) {
        const dice = [...gameState.dice];
        
        // Считаем количество каждого значения
        const counts = {};
        for (let i = 1; i <= 6; i++) {
            counts[i] = dice.filter(d => d === i).length;
        }
        
        switch (category) {
            case 'ones':
                return counts[1] * 1;
            case 'twos':
                return counts[2] * 2;
            case 'threes':
                return counts[3] * 3;
            case 'fours':
                return counts[4] * 4;
            case 'fives':
                return counts[5] * 5;
            case 'sixes':
                return counts[6] * 6;
            case 'three-of-a-kind':
                if (Object.values(counts).some(count => count >= 3)) {
                    return dice.reduce((sum, d) => sum + d, 0);
                }
                return 0;
            case 'four-of-a-kind':
                if (Object.values(counts).some(count => count >= 4)) {
                    return dice.reduce((sum, d) => sum + d, 0);
                }
                return 0;
            case 'full-house':
                if (Object.values(counts).some(count => count === 3) && 
                    Object.values(counts).some(count => count === 2)) {
                    return 25;
                }
                return 0;
            case 'small-straight':
                if ((counts[1] && counts[2] && counts[3] && counts[4]) || 
                    (counts[2] && counts[3] && counts[4] && counts[5]) || 
                    (counts[3] && counts[4] && counts[5] && counts[6])) {
                    return 30;
                }
                return 0;
            case 'large-straight':
                if ((counts[1] && counts[2] && counts[3] && counts[4] && counts[5]) || 
                    (counts[2] && counts[3] && counts[4] && counts[5] && counts[6])) {
                    return 40;
                }
                return 0;
            case 'yahtzee':
                if (Object.values(counts).some(count => count === 5)) {
                    return 50;
                }
                return 0;
            case 'chance':
                return dice.reduce((sum, d) => sum + d, 0);
            default:
                return 0;
        }
    }

    // Обновляем отображение возможных очков
    function updatePossibleScores() {
        scoreRows.forEach(row => {
            const category = row.getAttribute('data-category');
            const valueElement = row.querySelector('.score-value');
            
            // Пропускаем категории, где счет уже записан
            if (gameState.scores[category] !== null) {
                return;
            }
            
            // Рассчитываем возможные очки
            const possibleScore = calculateScore(category);
            valueElement.textContent = possibleScore;
        });
    }

    // Функция для записи очков и обновления общего счета
    function scoreCategory(category) {
        // Проверяем, что категория еще не использовалась и был сделан хотя бы один бросок
        if (gameState.scores[category] !== null || gameState.rollsLeft === 3) {
            return;
        }
        
        // Записываем очки
        const score = calculateScore(category);
        gameState.scores[category] = score;
        
        // Обновляем отображение
        const row = document.querySelector(`.score-row[data-category="${category}"]`);
        const valueElement = row.querySelector('.score-value');
        valueElement.textContent = score;
        row.classList.add('selected');
        
        // Уменьшаем количество оставшихся ходов
        gameState.turnsLeft--;
        
        // Сбрасываем кубики и броски
        gameState.held = [false, false, false, false, false];
        gameState.rollsLeft = 3;
        rollButton.textContent = `Бросить кубики (${gameState.rollsLeft})`;
        rollButton.disabled = false;
        
        // Обновляем общий счет
        updateTotalScores();
        
        // Проверяем завершение игры
        if (gameState.turnsLeft <= 0) {
            endGame();
        }
    }

    // Обновление общего счета
    function updateTotalScores() {
        // Верхняя секция
        const upperSection = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
        let upperTotal = 0;
        
        upperSection.forEach(category => {
            if (gameState.scores[category] !== null) {
                upperTotal += gameState.scores[category];
            }
        });
        
        // Бонус за верхнюю секцию
        let bonus = 0;
        if (upperTotal >= 63) {
            bonus = 35;
        }
        upperBonusElement.textContent = `${upperTotal} / 63 + ${bonus}`;
        
        // Итого в верхней секции
        upperTotalElement.textContent = upperTotal + bonus;
        
        // Нижняя секция
        const lowerSection = [
            'three-of-a-kind', 'four-of-a-kind', 'full-house', 
            'small-straight', 'large-straight', 'yahtzee', 'chance'
        ];
        let lowerTotal = 0;
        
        lowerSection.forEach(category => {
            if (gameState.scores[category] !== null) {
                lowerTotal += gameState.scores[category];
            }
        });
        
        lowerTotalElement.textContent = lowerTotal;
        
        // Общий итог
        grandTotalElement.textContent = (upperTotal + bonus + lowerTotal);
    }

    // Завершение игры
    function endGame() {
        rollButton.disabled = true;
        rollButton.textContent = 'Игра завершена';
        
        // Здесь можно добавить сохранение результата, показ диалога и т.д.
        const finalScore = parseInt(grandTotalElement.textContent);
        
        // Показываем сообщение с результатом
        setTimeout(() => {
            alert(`Поздравляем! Ваш финальный счет: ${finalScore}`);
        }, 500);
    }

    // Обработчики событий
    
    // Бросок кубиков
    rollButton.addEventListener('click', rollDice);
    
    // Фиксация кубиков
    diceElements.forEach((die, index) => {
        die.addEventListener('click', () => {
            if (gameState.rollsLeft < 3) { // можно фиксировать только после первого броска
                gameState.held[index] = !gameState.held[index];
                updateDiceDisplay();
            }
        });
    });
    
    // Выбор категории для записи очков
    scoreRows.forEach(row => {
        row.addEventListener('click', () => {
            const category = row.getAttribute('data-category');
            scoreCategory(category);
        });
    });
    
    // Кнопка назад
    backButton.addEventListener('click', () => {
        window.location.href = '/DiceTwo/games/';
    });
    
    // Инициализация игры
    updateDiceDisplay();
}); 