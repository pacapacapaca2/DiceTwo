document.addEventListener("DOMContentLoaded", () => {
  const rollButton = document.getElementById("roll-button");
  const resultDiv = document.getElementById("result");
  const diceContainer = document.getElementById("dice-container");
  const dice1 = document.getElementById("dice1");
  const dice2 = document.getElementById("dice2");

  if (!rollButton || !resultDiv || !diceContainer || !dice1 || !dice2) {
    console.error("One or more DOM elements not found.");
    return;
  }

  let currentAnimations = []; // Хранит текущие анимации

  rollButton.addEventListener("click", () => {
    // Скрываем кнопку Roll
    rollButton.style.display = "none";

    // Показываем контейнеры для кубиков
    diceContainer.style.display = "flex"; // Отображение контейнера
    resultDiv.style.display = "none";    // Прячем результат до завершения анимации

    // Генерируем случайные числа для обоих кубиков
    const randomRoll1 = Math.floor(Math.random() * 6) + 1;
    const randomRoll2 = Math.floor(Math.random() * 6) + 1;

    // Удаляем предыдущие анимации, если они есть
    currentAnimations.forEach(animation => animation.destroy());
    currentAnimations = [];

    // Создаём анимации для кубиков
    const animation1 = lottie.loadAnimation({
      container: dice1,
      renderer: "svg",
      loop: false,
      autoplay: true,
      path: `dice${randomRoll1}.json`
    });

    const animation2 = lottie.loadAnimation({
      container: dice2,
      renderer: "svg",
      loop: false,
      autoplay: true,
      path: `dice${randomRoll2}.json`
    });

    currentAnimations.push(animation1, animation2);

    // Показываем результат после завершения обеих анимаций
    let completedAnimations = 0;
    const onComplete = () => {
      completedAnimations++;
      if (completedAnimations === 2) {
        const totalResult = randomRoll1 + randomRoll2;
        resultDiv.textContent = `Result: ${randomRoll1 + randomRoll2} = ${totalResult}`;
        resultDiv.style.display = "block"; // Отображаем результат
      }
    };

    animation1.addEventListener("complete", onComplete);
    animation2.addEventListener("complete", onComplete);
  });
});
