document.addEventListener('DOMContentLoaded', () => {
    // Скрываем loader
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.display = 'none';
    }

    // Получаем все кнопки с играми
    const gameButtons = document.querySelectorAll('.game-button');
    
    // Настраиваем конфигурацию для каждой игры
    const gameConfig = {
        'yahtzee': {
            title: 'Yahtzee',
            path: '/DiceTwo/games/yahtzee/',
            description: 'Игра, в которой нужно собирать комбинации чисел на кубиках'
        },
        'craps': {
            title: 'Craps',
            path: '/DiceTwo/games/craps/',
            description: 'Делайте ставки на выпадение определенных комбинаций'
        },
        'dice-duel': {
            title: 'Дуэль кубиков',
            path: '/DiceTwo/games/dice-duel/',
            description: 'Соревнуйтесь с друзьями за лучший результат'
        },
        'hot-dice': {
            title: 'Горячие кубики',
            path: '/DiceTwo/games/hot-dice/',
            description: 'Особые правила и высокие множители'
        },
        'dice-tower': {
            title: 'Башня кубиков',
            path: '/DiceTwo/games/dice-tower/',
            description: 'Стройте башню из кубиков и устанавливайте рекорды'
        }
    };

    // Добавляем обработчики для каждой кнопки
    gameButtons.forEach(button => {
        button.addEventListener('click', () => {
            const gameId = button.getAttribute('data-game');
            
            if (gameId && gameConfig[gameId]) {
                // Если это в Telegram WebApp, используем BackButton
                if (window.Telegram && window.Telegram.WebApp) {
                    const tg = window.Telegram.WebApp;
                    
                    // Сохраняем информацию о выбранной игре
                    localStorage.setItem('selectedGame', gameId);
                    
                    // Переходим на страницу игры
                    window.location.href = gameConfig[gameId].path;
                } else {
                    // Обычный переход для браузера
                    window.location.href = gameConfig[gameId].path;
                }
            } else {
                console.error(`Игра с ID ${gameId} не найдена в конфигурации`);
                
                // Показываем временное сообщение о разработке
                showDevelopmentMessage(gameId);
            }
        });
    });

    // Функция для показа сообщения "В разработке"
    function showDevelopmentMessage(gameId) {
        const gameName = gameConfig[gameId]?.title || 'Эта игра';
        
        // Создаем элемент для сообщения
        const messageElement = document.createElement('div');
        messageElement.className = 'development-message';
        messageElement.innerHTML = `
            <div class="message-content">
                <h3>${gameName} в разработке</h3>
                <p>Эта игра скоро будет доступна. Загляните позже!</p>
                <button class="close-btn">Понятно</button>
            </div>
        `;
        
        // Добавляем стили для сообщения
        const style = document.createElement('style');
        style.textContent = `
            .development-message {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                animation: fadeIn 0.3s ease-out;
            }
            .message-content {
                background-color: var(--tg-theme-secondary-bg-color);
                border-radius: 12px;
                padding: 20px;
                max-width: 80%;
                text-align: center;
            }
            .message-content h3 {
                margin-top: 0;
                color: var(--tg-theme-text-color);
            }
            .message-content p {
                margin-bottom: 20px;
                color: var(--tg-theme-hint-color);
            }
            .close-btn {
                background-color: var(--tg-theme-button-color);
                color: var(--tg-theme-button-text-color);
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        
        // Добавляем элементы в DOM
        document.head.appendChild(style);
        document.body.appendChild(messageElement);
        
        // Добавляем обработчик для кнопки закрытия
        messageElement.querySelector('.close-btn').addEventListener('click', () => {
            messageElement.remove();
        });
        
        // Автоматически скрываем сообщение через 3 секунды
        setTimeout(() => {
            if (document.body.contains(messageElement)) {
                messageElement.remove();
            }
        }, 3000);
    }
}); 