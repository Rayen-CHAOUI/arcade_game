document.addEventListener('DOMContentLoaded', () => {
  fetchPlayers();
});

function fetchPlayers() {
  fetch('http://localhost:5000/players')
    .then(response => response.json())
    .then(data => {
      const playerTableBody = document.getElementById('playersTable').getElementsByTagName('tbody')[0];
      playerTableBody.innerHTML = ""; // Clear the table before inserting new data

      data.forEach((player, index) => {
        const row = playerTableBody.insertRow();

        row.insertCell(0).textContent = index + 1; // Auto-increment index
        row.insertCell(1).textContent = player.username;
        row.insertCell(2).textContent = player.email;
        row.insertCell(3).textContent = new Date(player.createdAt).toLocaleDateString();
        row.insertCell(4).textContent = player.level;
        row.insertCell(5).textContent = player.gamesPlayed;
        row.insertCell(6).textContent = player.gamesWon;
        row.insertCell(7).textContent = player.gamesLost;
      });
    })
    .catch(error => console.error('Error fetching players:', error));
}

