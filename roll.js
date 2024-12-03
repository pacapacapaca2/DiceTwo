document.addEventListener("DOMContentLoaded", () => { 
  const rollButton = document.getElementById("roll-button");
  const resultDiv = document.getElementById("result");
  const diceContainer = document.getElementById("dice-container");
  const dice = document.getElementById("dice");

  // Подключение анимаций через lottie-web
  const diceAnimations = [];
  for (let i = 1; i <= 6; i++) {
    diceAnimations[i] = lottie.loadAnimation({
      container: dice, // Контейнер для анимации
      renderer: "svg", // Используем SVG для рендеринга
      loop: false,     // Анимация проигрывается один раз
      autoplay: false, // Запуск вручную
      path: dice${i}.tgs // Путь к файлу анимации
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
    resultDiv.textContent = Result: ${randomRoll};

    // Останавливаем все предыдущие анимации
    diceAnimations.forEach((anim) => anim?.stop());

    // Запускаем анимацию выбранного кубика
    diceAnimations[randomRoll]?.play();
  });
});
