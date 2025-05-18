//////////////////////////////////////////////////////////    API ROUTES   //////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////// LOGIN API ////////////////////////////////////////////
async function login(username, password) {
    try {
        const response = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password})
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("jwt", data.token);
            window.location.href = "home.html";
        } else {
            alert(data.message || "Connexion échouée");
        }
    } catch (error) {
        console.error("Erreur:", error);
        alert("Une erreur s'est produite");
    }
}


///////////////////////////////////////// SIGN UP API /////////////////////////////////////////////
async function signup(username,email, password) {
    try {
        const response = await fetch("http://localhost:5000/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Save the JWT token and redirect to home.html
            localStorage.setItem("jwt", data.token);
            window.location.href="home.html";
        } else {
            alert(data.message || "Inscription échouée");
        }
    } catch (error) {
        console.error("Erreur:", error);
        alert("Une erreur s'est produite");
    }
}


///////////////////////////////////////// Appel après une partie //////////////////////////////////////////
async function updateStats(won) {
    const username = localStorage.getItem("username");
    if (!username) return;

    await fetch("http://localhost5000/updateStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, won }),
    });
}

//////////////////// Modifier la fin de partie dans `BattleshipGame` ///////////////////////////////////////////
endGame(winner) 
{
    this.gameOver = true;
    const message = winner === 'player' ? 'Victoire ! 🎉' : 'Défaite ! 💻';
    this.showPopup(message);
    updateStats(winner === 'player');
}

//////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
    console.log("Script chargé !");
    
    const toggleIcons = document.querySelectorAll(".toggle-password");
    
    toggleIcons.forEach(icon => {
        console.log("Icône trouvée :", icon);
        
        icon.addEventListener("click", function () {
            console.log("Icône cliquée !");

            // Cherche l'input dans le même input-group
            const inputGroup = this.closest(".input-group"); // Trouver le parent div
            const passwordInput = inputGroup.querySelector("input[type='password'], input[type='text']"); // Trouver l'input à l'intérieur
            
            if (!passwordInput) {
                console.log("Erreur : Aucun champ de mot de passe trouvé !");
                return;
            }

            // Changer le type d'input et l'icône
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                this.classList.remove("fa-eye");
                this.classList.add("fa-eye-slash");
            } else {
                passwordInput.type = "password";
                this.classList.remove("fa-eye-slash");
                this.classList.add("fa-eye");
            }
        });
    });
});

