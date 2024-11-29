let playerPosition = 0;

document.getElementById('roll-dice').addEventListener('click', () => {
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    playerPosition += diceRoll;

    document.getElementById('position').innerText = playerPosition;
});
