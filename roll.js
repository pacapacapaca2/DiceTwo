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

    // Показываем контейнер для кубика
    diceContainer.style.display = "block";
    resultDiv.style.display = "none"; // Прячем результат до завершения анимации

    const randomRoll = Math.floor(Math.random() * 6) + 1;

    // Удаляем предыдущую анимацию, если она есть
    if (currentAnimation) {
      currentAnimation.destroy();
    }

    // Создаём новую анимацию
    currentAnimation = lottie.loadAnimation({
      container: dice, // Контейнер для анимации
      renderer: "svg", // Используем SVG для рендеринга
      loop: false,     // Анимация проигрывается один раз
      autoplay: true,  // Автозапуск анимации
      path: `dice${randomRoll}.json` // Путь к JSON-файлу
    });

    // Показываем результат после завершения анимации
    currentAnimation.addEventListener("complete", () => {
      resultDiv.textContent = `Result: ${randomRoll}`;
      resultDiv.style.display = "block"; // Отображаем результат
    });
  });
});
