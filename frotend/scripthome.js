//////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("jwt");

    if (!token) {
        window.location.href = "login.html";
    } else {
        try {
            const payload = JSON.parse(atob(token.split('.')[1])); 
            document.getElementById("welcome-message").innerText = "Bienvenue, " + payload.username;
        } catch (e) {
            console.error("Erreur de décodage du JWT:", e);
            localStorage.removeItem("jwt");
            window.location.href = "login.html";
        }
    }
}); 

//////////////////////////////////////////////////////////////////////////////
async function logout() {
    const confirmLogout = confirm("Êtes-vous sûr de vouloir vous déconnecter ?");
    if (!confirmLogout) return;

    const token = localStorage.getItem("jwt");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        await fetch("http://localhost:5000/logout", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });
    } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
    }

    localStorage.removeItem("jwt");
    window.location.href = "login.html";
}


//////////////////////////////////////////////////////////////////////////////
async function fetchPlayers() {
    try {
        const response = await fetch("http://localhost:5000/players");
        const players = await response.json();

        // Récupère le joueur connecté
        const token = localStorage.getItem("jwt");
        let currentUsername = null;
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentUsername = payload.username;
            } catch (e) {
                console.error("Erreur de décodage du JWT:", e);
            }
        }

        // Trier les joueurs
        players.sort((a, b) => b.level - a.level || b.gamesPlayed - a.gamesPlayed);

        const playersList = document.getElementById("players-list");
        playersList.innerHTML = ""; // Clear previous content

        players.forEach((player, index) => {
            const row = document.createElement("tr");

            // Ajoute une classe si c'est le joueur connecté
            if (player.username === currentUsername) {
                row.classList.add("current-player");
            }

            row.innerHTML = `
                <td>${index + 1}</td> 
                <td>${player.username}</td>
                <td>${player.level}</td>
                <td>${player.gamesPlayed}</td>
                <td>${player.gamesWon}</td>
                <td>${player.gamesLost}</td>
            `;
            playersList.appendChild(row);
        });
    } catch (error) {
        console.error("Erreur lors du chargement des joueurs:", error);
    }
}


// Charger les joueurs au chargement de la page
document.addEventListener("DOMContentLoaded", fetchPlayers);


 
///////////////////////////////// increment Games Played /////////////////////////////////////////////
async function incrementGamesPlayed() {
    const token = localStorage.getItem("jwt");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/incrementGamesPlayed", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Send token
            }
        });

        if (response.ok) {
            console.log("Nombre de parties played, mises à jour !");
            fetchPlayers(); // Refresh leaderboard
        } else {
            console.error("Échec de la mise à jour.");
        }
    } catch (error) {
        console.error("Erreur:", error);
    }
}
 

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Attach to Bataille Navale button
document.addEventListener("DOMContentLoaded", function () {
    const batailleNavaleCard = document.querySelector(".game-card[href='mainPage.html']");
    if (batailleNavaleCard) {
        batailleNavaleCard.addEventListener("click", incrementGamesPlayed);
    }
});


// Fonction pour chercher un joueur par son nom d'utilisateur
async function searchPlayer() {
    const username = document.getElementById("search-username").value;

    if (!username) {
        alert("Veuillez saisir un nom d'utilisateur");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/searchPlayer/${username}`);
        const data = await response.json();

        if (data.username) {
            // Sauvegarde les données dans le localStorage
            localStorage.setItem("selectedPlayer", JSON.stringify(data));
            // Redirige vers la page de détails
            window.location.href = "playerDetails.html";
        } else {
            alert("Joueur non trouvé");
        }
    } catch (err) {
        console.error("Erreur de recherche : ", err);
        alert("Erreur lors de la recherche");
    }
}


function repondreInvitation(playerUsername, action) {
    // Tu pourrais utiliser l'API pour accepter ou refuser une invitation
    fetch('/api/invitation/response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        sender: playerUsername, 
        action: action,
        receiver: localStorage.getItem("currentUsername") // L'utilisateur actuel
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(`Invitation ${action === 'accept' ? 'acceptée' : 'refusée'} de ${playerUsername}`);
        // Mettre à jour l'interface utilisateur si nécessaire
      } else {
        alert("Erreur lors de la réponse à l'invitation.");
      }
    })
    .catch(error => {
      alert("Une erreur s'est produite. Veuillez réessayer.");
      console.error('Erreur:', error);
    });
  }
  