const socket = io("localhost:5000");
const username = prompt("Entrez votre pseudo :");
socket.emit("joinGame", username);


const timerElement = document.getElementById('timer');
const status = document.getElementById('status');
const popup = document.getElementById('popup');
const popupMessage = document.getElementById('popup-message');

class GameTimer {
    constructor(el) {
        this.el = el;
        this.time = 0;
        this.interval = null;
    }

    start() {
        if (this.interval) return;
        this.interval = setInterval(() => {
            this.time++;
            this.update();
        }, 1000);
    }

    pause() {
        clearInterval(this.interval);
        this.interval = null;
    }

    reset() {
        this.pause();
        this.time = 0;
        this.update();
    }

    update() {
        const m = String(Math.floor(this.time / 60)).padStart(2, '0');
        const s = String(this.time % 60).padStart(2, '0');
        this.el.textContent = `${m}:${s}`;
    }
}

const timer = new GameTimer(timerElement);
timer.start();

// Gestion de la connexion
socket.on("waiting", () => {
    status.textContent = "En attente d’un adversaire...";
});

socket.on("startGame", () => {
    status.textContent = "Partie démarrée ! À vous de jouer.";
    timer.reset();
    timer.start();
});

socket.on("opponentMove", (index) => {
    const cell = document.querySelector(`#player-grid [data-index="${index}"]`);
    if (cell && !cell.classList.contains("hit")) {
        cell.classList.add("miss");
        status.textContent = "À vous de jouer !";
    }
});

function createGrid(id) {
    const grid = document.getElementById(id);
    for (let i = 0; i < 100; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.index = i;
        if (id === "opponent-grid") {
            cell.addEventListener("click", () => {
                socket.emit("attack", i);
            });
        }
        grid.appendChild(cell);
    }
}

createGrid("player-grid");
createGrid("opponent-grid");

// Boutons
document.getElementById("pause-btn").onclick = () => {
    timer.pause();
    popup.style.display = "flex";
    popupMessage.textContent = "⏸️ Jeu en pause";
};

document.getElementById("resume-btn").onclick = () => {
    timer.start();
    popup.style.display = "none";
};

document.getElementById("restart").onclick = () => {
    socket.emit("restart");
};

document.getElementById("exit-btn").onclick = () => {
    window.location.href = "home.html";
};


const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatBox = document.getElementById('chat-box');

// Envoyer un message
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (message) {
        appendMessage('me', message);
        socket.emit('chatMessage', message);
        chatInput.value = '';
    }
});

// Recevoir un message
socket.on('chatMessage', (message) => {
    appendMessage('other', message);
});

// Ajouter un message dans la boîte de chat
function appendMessage(sender, message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<span class="${sender}">${sender === 'me' ? 'Moi' : 'Adversaire'} :</span> ${message}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}
