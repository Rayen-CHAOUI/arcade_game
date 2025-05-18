const adminCredentials = {
    username: "admin",
    password: "admin123"
};

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const User = document.getElementById('User').value;
    const password = document.getElementById('password').value;
    
    if (User === adminCredentials.username && password === adminCredentials.password) {
        window.location.href = "dashboard.html";
        // Vous pouvez ajouter une redirection ou une autre action ici
    } else {
        alert('Nom d utilisateur ou mot de passe incorrect !');
    }
});

function toggleDropdown() {
    const dropdownMenu = document.getElementById("dropdownMenu");
    const userAccount = document.querySelector(".user-account");

    if (dropdownMenu.style.display === "block") {
        dropdownMenu.style.display = "none";
        userAccount.classList.remove("active");
    } else {
        dropdownMenu.style.display = "block";
        userAccount.classList.add("active");
    }
}

// إغلاق القائمة عند النقر خارجها
window.onclick = function(event) {
    const dropdownMenu = document.getElementById("dropdownMenu");
    const userAccount = document.querySelector(".user-account");

    if (!event.target.matches('.user-account') && !event.target.matches('.username') && !event.target.matches('.user-avatar') && !event.target.matches('.dropdown-arrow')) {
        if (dropdownMenu.style.display === "block") {
            dropdownMenu.style.display = "none";
            userAccount.classList.remove("active");
        }
    }
}

// إظهار نافذة Préférences
function showPreferences(event) {
    event.preventDefault(); // منع تحميل الصفحة
    const preferencesPopup = document.getElementById("preferencesPopup");
    preferencesPopup.style.display = "flex"; // إظهار النافذة
}

// إخفاء نافذة Préférences
function hidePreferences() {
    const preferencesPopup = document.getElementById("preferencesPopup");
    preferencesPopup.style.display = "none"; // إخفاء النافذة
}

// حفظ الإعدادات (وظيفة وهمية)
function savePreferences() {
    alert("Préférences sauvegardées!");
    hidePreferences();
}

// إغلاق النافذة عند النقر خارجها
window.onclick = function(event) {
    const preferencesPopup = document.getElementById("preferencesPopup");
    if (event.target === preferencesPopup) {
        hidePreferences();
    }
}

// بيانات الطلاب (يمكن استبدالها ببيانات حقيقية من قاعدة البيانات)
const etudiants = {
    etudiant1: {
        nom: "Ahmed Ali",
        livres: [
            { titre: "Le Petit Prince", dateEmprunt: "2023-10-01", dateRetour: "2023-10-15", statut: "En cours" },
            { titre: "1984", dateEmprunt: "2023-09-20", dateRetour: "2023-10-05", statut: "Retourné" }
        ]
    },
    etudiant2: {
        nom: "Fatima Zahra",
        livres: [
            { titre: "Harry Potter", dateEmprunt: "2023-10-10", dateRetour: "2023-10-25", statut: "En cours" }
        ]
    },
    etudiant3: {
        nom: "Mohamed Amine",
        livres: []
    },
    etudiant4: {
        nom: "Aya Chahine",
        livres: [
            { titre: "Les Misérables", dateEmprunt: "2023-09-15", dateRetour: "2023-09-30", statut: "Retourné" }
        ]
    }
};

// عرض تفاصيل الطالب
function showDetails(etudiantId) {
    const etudiant = etudiants[etudiantId];
    const detailsContent = document.getElementById("detailsContent");

    let html = `<p><strong>Nom:</strong> ${etudiant.nom}</p>`;
    if (etudiant.livres.length > 0) {
        html += `<h3>Livres empruntés:</h3>`;
        html += `<ul>`;
        etudiant.livres.forEach(livre => {
            html += `<li>
                <strong>Titre:</strong> ${livre.titre}<br>
                <strong>Date d'emprunt:</strong> ${livre.dateEmprunt}<br>
                <strong>Date de retour:</strong> ${livre.dateRetour}<br>
                <strong>Statut:</strong> ${livre.statut}
            </li>`;
        });
        html += `</ul>`;
    } else {
        html += `<p>Aucun livre emprunté.</p>`;
    }

    detailsContent.innerHTML = html;
    document.getElementById("etudiantDetails").style.display = "block";
}

// بحث الطلاب
function searchEtudiant() {
    const searchTerm = document.getElementById("searchBar").value.toLowerCase();
    const etudiantList = document.getElementById("etudiantList").getElementsByTagName("li");

    for (let i = 0; i < etudiantList.length; i++) {
        const etudiantName = etudiantList[i].textContent.toLowerCase();
        if (etudiantName.includes(searchTerm)) {
            etudiantList[i].style.display = "block";
        } else {
            etudiantList[i].style.display = "none";
        }
    }
}