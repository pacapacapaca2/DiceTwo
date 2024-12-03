document.addEventListener("DOMContentLoaded", () => {
  const rollButton = document.getElementById("roll-button");
  const resultDiv = document.getElementById("result");
  const diceContainer = document.getElementById("dice-container");

  // Контейнер для анимаций
  const dice = document.createElement("div");
  diceContainer.appendChild(dice);  // Вставляем контейнер для анимации в diceContainer

  // Подключение анимаций через lottie-web
  const diceAnimations = [];
  
  // Функция для загрузки анимаций
  for (let i = 1; i <= 6; i++) {
    diceAnimations[i] = lottie.loadAnimation({
      container: dice,  // Контейнер для анимации
      renderer: "svg",   // Используем SVG для рендеринга
      loop: false,       // Анимация проигрывается один раз
      autoplay: false,   // Запуск вручную
      path: `https://raw.githubusercontent.com/pacapacapaca2/DiceTwo/main/dice${i}.json`  // Путь к файлу .json
    });
  }

  // Обработчик кнопки Roll
  rollButton.addEventListener("click", () => {
    // Скрываем кнопку Roll
    rollButton.style.display = "none";

    // Показываем контейнеры для кубика и результата
    resultDiv.style.display = "block";
    diceContainer.style.display = "block";

    // Генерируем случайное число от 1 до 6
    const randomRoll = Math.floor(Math.random() * 6) + 1;

    // Обновляем текст результата
    resultDiv.textContent = `Result: ${randomRoll}`;

    // Скрываем все анимации
    diceAnimations.forEach((anim, index) => {
      if (index !== randomRoll) {
        anim.stop();  // Останавливаем анимацию, если она не соответствует результату
      }
    });

    // Запускаем анимацию выбранного кубика
    diceAnimations[randomRoll]?.play();
  });
});
