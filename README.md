# Battleship Arcade Game (Bataille de Navale)

Un jeu web interactif de **Bataille Navale** développé avec **HTML, CSS et JavaScript** pour le frontend, et **Node.js, Express.js et MongoDB** pour le backend.  
Cette application propose une expérience riche pour les joueurs ainsi qu’un **tableau de bord administrateur complet** pour la gestion et l’analyse.

---

##  Fonctionnalités

###  Tableau de Bord Administrateur

Réservé aux administrateurs, ce panneau de contrôle permet de gérer les utilisateurs et de suivre leurs activités.

- **Gestion des Joueurs :**
  - Affichage de tous les joueurs enregistrés.
  - Ajout manuel de nouveaux joueurs.
  - Suppression de joueurs de la base de données.

- **Journaux d'Activité :**
  - Suivi et visualisation des actions réalisées par les utilisateurs.

- **Rapports Statistiques :**
  - Génération de rapports visuels et graphiques sur les activités et performances des joueurs.

- **Barre de Navigation :**
  Contient des liens vers :
  - Joueurs
  - Logs (journaux)
  - Ajouter un joueur
  - Supprimer un joueur
  - Rapports

---

###  Tableau de Bord Joueur

Ce panneau permet aux utilisateurs de :

- **Créer un Compte ou Se Connecter :**
  - Inscription avec un nom d’utilisateur et une adresse email uniques.
  - Connexion sécurisée pour les utilisateurs existants.
  - Réinitialisation de mot de passe en cas d’oubli via email.

---

###  Modes de Jeu

Après connexion, l’utilisateur accède à une page principale avec trois choix :

- **Jouer contre la Machine** – Affronter un adversaire automatique.
- **Multijoueur Local** – Deux joueurs sur le même appareil.
- **Multijoueur en Ligne** – Affronter des adversaires en ligne grâce à **Socket.IO**.

---

###  Classement des Joueurs

Un **classement en direct** est affiché à gauche de l’écran selon les scores des joueurs.

---

##  Schéma Utilisateur (MongoDB)

```js
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now },
  password: { type: String, required: true },
  gamesPlayed: { type: Number, default: 0 },
  level: { type: Number, default: 50 },
  gamesWon: { type: Number, default: 0 },
  gamesLost: { type: Number, default: 0 },
  resetToken: { type: String, default: null },
  resetTokenExpire: { type: Date, default: null },
});

---

##  **Technologies utilisées**

- **Frontend** : HTML, CSS, JavaScript
- **Backend** : Node.js, Express.js
- **Base de Données** : MongoDB
- **Multijoueur Temps Réel** : Socket.IO

## **Auteur**
CHAOUI Rayen