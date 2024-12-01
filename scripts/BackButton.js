const tg = window.Telegram.WebApp;
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            window.location.href="/DiceTwo/"; 
        });
        tg.expand();
