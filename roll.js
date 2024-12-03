document.addEventListener("DOMContentLoaded", () => {
  const rollButton = document.getElementById("roll-button");
  const resultDiv = document.getElementById("result");
  const diceContainer = document.getElementById("dice-container");
  const dice = document.getElementById("dice");

  if (!rollButton || !resultDiv || !diceContainer || !dice) {
    console.error("One or more DOM elements not found.");
    return;
  }

  let currentAnimation = null; // Хранит текущую анимацию

  // Обработчик кнопки Roll
  rollButton.addEventListener("click", () => {
    // Скрываем кнопку Roll
    rollButton.style.display = "none";

    // Показываем контейнеры для кубика и результата
    resultDiv.style.display = "block";
    diceContainer.style.display = "block";

    const randomRoll = Math.floor(Math.random() * 6) + 1;

    // Обновляем текст результата
    resultDiv.textContent = `Result: ${randomRoll}`;

    // Удаляем предыдущую анимацию, если она есть
    if (currentAnimation) {
      currentAnimation.destroy();
    }

    // Загружаем и воспроизводим новую анимацию
    currentAnimation = lottie.loadAnimation({
      container: dice, // Контейнер для анимации
      renderer: "svg", // Используем SVG для рендеринга
      loop: false,     // Анимация проигрывается один раз
      autoplay: true,  // Автозапуск анимации
      path: `animations/dice${randomRoll}.json` // Путь к JSON-файлу
    });
  });
});
