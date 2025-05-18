// Update the GameTimer class with a pause method
class GameTimer {
    constructor(timerElement) {
        this.timerElement = timerElement;
        this.time = 0;
        this.interval = null;
    }
 
    start() {
        if (this.interval) return; // Avoid multiple intervals
        this.interval = setInterval(() => {
            this.time++;
            this.updateDisplay();
        }, 1000);
    }

    stop() {
        clearInterval(this.interval);
        this.interval = null;
    }

    reset() {
        this.stop();
        this.time = 0;
        this.updateDisplay();
    }

    updateDisplay() {
        const minutes = String(Math.floor(this.time / 60)).padStart(2, '0');
        const seconds = String(this.time % 60).padStart(2, '0');
        this.timerElement.textContent = `${minutes}:${seconds}`;
    }

    pause() {
        this.stop(); // Pause the timer
    }

    resume() {
        this.start(); // Resume the timer
    }
}

// Main Game Class
class BattleshipGame {
    constructor(timer) {
        this.gridSize = 10;
        this.shipLengths = [5, 4, 3, 3, 2];
        this.player1Ships = [];
        this.player2Ships = [];
        this.currentPlayer = 1; // Player 1 starts
        this.gameOver = false;
        this.timer = timer;
        this.isPaused = false; // Track game pause state

        this.initGame();
    }

    // Initialize the game
    initGame() {
        this.createGrid('player1');
        this.createGrid('player2');
        this.placeShips();
        this.updateStatus();
        this.addEventListeners();
        this.updateGridEvents();
        this.timer.reset();
        this.timer.start();
    }

    // Create grid for each player
    createGrid(player) {
        const grid = document.getElementById(`${player}-grid`);
        grid.innerHTML = '';

        for (let i = 0; i < this.gridSize ** 2; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            grid.appendChild(cell);
        }
    }

    // Place ships for each player
    placeShips() {
        this.player1Ships = this.generateShips();
        this.player2Ships = this.generateShips();
    }

    // Generate ships randomly
    generateShips() {
        const ships = [];

        this.shipLengths.forEach(length => {
            let placed = false;

            while (!placed) {
                const isVertical = Math.random() < 0.5;
                const startPos = Math.floor(Math.random() * this.gridSize ** 2);

                if (this.canPlaceShip(startPos, length, isVertical, ships)) {
                    const positions = this.getShipPositions(startPos, length, isVertical);
                    ships.push(...positions);
                    placed = true;
                }
            }
        });

        return ships;
    }

    // Check if a ship can be placed
    canPlaceShip(start, length, isVertical, existingShips) {
        const end = isVertical
            ? start + (length - 1) * this.gridSize
            : start + (length - 1);

        if (isVertical && Math.floor(end / this.gridSize) >= this.gridSize) return false;
        if (!isVertical && end % this.gridSize < start % this.gridSize) return false;

        for (let i = 0; i < length; i++) {
            const pos = isVertical ? start + i * this.gridSize : start + i;
            if (existingShips.includes(pos)) return false;
        }

        return true;
    }

    // Get ship positions
    getShipPositions(start, length, isVertical) {
        return Array.from({ length }, (_, i) =>
            isVertical ? start + i * this.gridSize : start + i
        );
    }

    // Update click events
    updateGridEvents() {
        if (this.isPaused) return; // Disable clicks when paused

        const currentGrid = this.currentPlayer === 1 ? 'player2' : 'player1';
        const grid = document.getElementById(`${currentGrid}-grid`);
        const cells = grid.querySelectorAll('.cell');

        cells.forEach(cell => {
            cell.removeEventListener('click', this.handleAttack);
            cell.addEventListener('click', (e) => this.handleAttack(e, currentGrid));
        });
    }

    // Handle an attack
    handleAttack(e, gridOwner) {
        if (this.gameOver || this.isPaused) return;

        const cell = e.target;
        const index = parseInt(cell.dataset.index);

        if (!this.isValidAttack(cell)) return;

        if (gridOwner === 'player1' && this.currentPlayer === 2) {
            this.processAttack(index, 'player1', this.player1Ships);
        } else if (gridOwner === 'player2' && this.currentPlayer === 1) {
            this.processAttack(index, 'player2', this.player2Ships);
        }
    } 

    // Process an attack
    processAttack(index, targetPlayer, targetShips) {
        const isHit = targetShips.includes(index);
        const cell = document.getElementById(`${targetPlayer}-grid`)
            .querySelector(`[data-index="${index}"]`);

        if (isHit) {
            cell.classList.add('hit');
            targetShips.splice(targetShips.indexOf(index), 1);

            if (targetShips.length === 0) {
                this.endGame();
                return;
            }
        } else {
            cell.classList.add('miss');
            this.switchTurn();
        }
    }

    // Switch player turn
    switchTurn() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateStatus();
        this.updateGridEvents();
    }

    // Update game status
    updateStatus() {
        const status = document.getElementById('status');
        const nextPlayer = this.currentPlayer === 1 ? 2 : 1;
        status.textContent = `Joueur ${nextPlayer}, c'est votre tour !`;
    }

    endGame(winner) {
        this.gameOver = true;
        const message = winner === 'player' 
            ? 'Victoire ! Vous avez gagné ! 🎉' 
            : 'Défaite ! L\'ordinateur a gagné ! 💻';

        // Envoie les statistiques au serveur
        this.updatePlayerStats(winner);
        this.showPopup(message);
    }

    // Met à jour les statistiques du joueur sur le serveur
updatePlayerStats(winner) {
    const token = localStorage.getItem("jwt");  // Supposons que le JWT est stocké dans le localStorage

    if (token) {
        fetch("http://192.168.1.17:5000/updateStats", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                won: winner === 'player'  // Envoie "true" si c'est une victoire, sinon "false"
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Statistiques mises à jour:", data);
        })
        .catch(error => {
            console.error("Erreur lors de la mise à jour des statistiques:", error);
        });
    }
}


    // Show popup
    showPopup(message) {
        const popup = document.getElementById('popup');
        const popupMessage = document.getElementById('popup-message');
        popupMessage.textContent = message;
        popup.style.display = 'flex';
    }

    // Validate attack
    isValidAttack(cell) {
        return !cell.classList.contains('hit') && !cell.classList.contains('miss');
    }

    // Pause the game
    pauseGame() {
        this.isPaused = true;
        this.timer.pause();
        this.showPopup("⏸️ Jeu en pause");
    }

    // Resume the game
    resumeGame() {
        this.isPaused = false;
        this.timer.resume();
        document.getElementById('popup').style.display = 'none';
        this.updateGridEvents();
    }

    // Add event listeners
    addEventListeners() {
        document.getElementById('restart').addEventListener('click', () => {
            new BattleshipGame(this.timer);
            document.getElementById('popup').style.display = 'none';
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseGame();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('exit-btn').addEventListener('click', () => {
            window.location.href = 'home.html'; // Navigate to home.html
        });        
    }
}

// Initialize the timer and game
const timerElement = document.getElementById('timer');
const gameTimer = new GameTimer(timerElement);

window.addEventListener('DOMContentLoaded', () => {
    new BattleshipGame(gameTimer);
});