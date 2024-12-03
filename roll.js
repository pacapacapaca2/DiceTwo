document.addEventListener("DOMContentLoaded", () => {
  const rollButton = document.getElementById("roll-button");
  const resultDiv = document.getElementById("result");
  const diceContainer = document.getElementById("dice-container");
  const dice = document.getElementById("dice");

  // Подключение анимаций через lottie-web с использованием fetch()
  const diceAnimations = [];
  
  // Функция загрузки анимации с помощью fetch
  function loadAnimation(path) {
    return fetch(path)
      .then(response => response.json())
      .then(animationData => {
        return lottie.loadAnimation({
          container: dice,
          renderer: "svg",
          loop: false,
          autoplay: false,
          animationData: animationData  // Используем данные анимации
        });
      })
      .catch(err => {
        console.error("Ошибка при загрузке анимации:", err);
      });
  }

  // Загружаем анимации для каждого кубика с использованием raw URL
  for (let i = 1; i <= 6; i++) {
    diceAnimations[i] = loadAnimation(`https://raw.githubusercontent.com/pacapacapaca2/DiceTwo/main/dice${i}.json`);
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

    // Останавливаем все предыдущие анимации
    diceAnimations.forEach((anim) => anim?.stop());

    // Запускаем анимацию выбранного кубика
    diceAnimations[randomRoll]?.play();
  });
});
