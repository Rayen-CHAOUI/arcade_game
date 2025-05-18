class BattleshipGame {
    constructor() { 
        this.gridSize = 10;
        this.shipLengths = [5, 4, 3, 3, 2];
        this.playerShips = [];
        this.computerShips = [];
        this.gameOver = false;
        this.currentTurn = 'player';
        
        this.initGame();
        this.addEventListeners();
    }

    initGame() { 
        this.createGrid('player');
        this.createGrid('computer');
        this.placeShips();
        this.updateStatus();
    }

    createGrid(player) { 
        const grid = document.getElementById(`${player}-grid`);
        grid.innerHTML = '';
        
        for (let i = 0; i < this.gridSize ** 2; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            
            if (player === 'computer') {
                cell.addEventListener('click', (e) => this.handlePlayerAttack(e));
            }
            
            grid.appendChild(cell);
        }
    }

    placeShips() {
        this.playerShips = this.generateShips();
        this.computerShips = this.generateShips();
    }

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

    canPlaceShip(start, length, isVertical, existingShips) {
        const end = isVertical ? 
            start + (length - 1) * this.gridSize :
            start + (length - 1);
        
        if (isVertical && Math.floor(end / this.gridSize) >= this.gridSize) return false;
        if (!isVertical && end % this.gridSize < start % this.gridSize) return false;
        
        for (let i = 0; i < length; i++) {
            const pos = isVertical ? start + i * this.gridSize : start + i;
            if (existingShips.includes(pos)) return false;
        }
        
        return true;
    }

    getShipPositions(start, length, isVertical) {
        return Array.from({ length }, (_, i) => 
            isVertical ? start + i * this.gridSize : start + i
        );
    }

    handlePlayerAttack(e) {
        if (!this.isPlayerTurn()) return;
        
        const cell = e.target;
        const index = parseInt(cell.dataset.index);
        
        if (this.isValidAttack(cell)) {
            this.processAttack(index, 'computer', this.computerShips);
            this.currentTurn = 'computer';
            setTimeout(() => this.computerAttack(), 1000);
        }
    }

    computerAttack() {
        if (this.isComputerTurn()) {
            const validCells = this.getValidComputerTargets();
            const randomIndex = Math.floor(Math.random() * validCells.length);
            this.processAttack(validCells[randomIndex], 'player', this.playerShips);
            this.currentTurn = 'player';
        }
    }

    processAttack(index, targetPlayer, targetShips) {
        const isHit = targetShips.includes(index);
        const cell = document.getElementById(`${targetPlayer}-grid`)
            .querySelector(`[data-index="${index}"]`);
        
        cell.classList.add(isHit ? 'hit' : 'miss');
        
        if (isHit) {
            targetShips.splice(targetShips.indexOf(index), 1);
            if (targetShips.length === 0) this.endGame(targetPlayer);
        }
        
        this.updateStatus();
    }

    updateStatus() {
        const status = document.getElementById('status');
        status.textContent = this.currentTurn === 'player' 
            ? 'Votre tour !' 
            : 'L\'ordinateur réfléchit...';
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
        fetch("http://localhost:5000/updateStats", {
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


    showPopup(message) {
        const popup = document.getElementById('popup');
        const popupMessage = document.getElementById('popup-message');
        popupMessage.textContent = message;
        popup.style.display = 'flex';
    }

    // Helper methods
    isPlayerTurn() {
        return !this.gameOver && this.currentTurn === 'player';
    }

    isComputerTurn() {
        return !this.gameOver && this.currentTurn === 'computer';
    }

    isValidAttack(cell) {
        return !cell.classList.contains('hit') && 
               !cell.classList.contains('miss');
    }

    getValidComputerTargets() {
        return Array.from(document.getElementById('player-grid').children)
            .filter(cell => this.isValidAttack(cell))
            .map(cell => parseInt(cell.dataset.index));
    }

    addEventListeners() {
        document.getElementById('restart').addEventListener('click', () => {
            new BattleshipGame();
            document.getElementById('popup').style.display = 'none';
        });
    }
}

// Start new game
new BattleshipGame();