const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
require("os");



const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.secretKey;


app.use(express.json()); 
app.use(cors());

//////////////////// Connect to MongoDB //////////////////////////
mongoose.connect(process.env.MongoDB_URL , {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    })
      .then(() => console.log("MongoDB connecté"))
      .catch(err => console.error(err));
/////////////////////////////////////////////////////////////////


//////////////////////// User Schema //////////////////////
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email:{ type:String, unique:true, required:true },
  createdAt: { type: Date, default: Date.now },
  password: { type: String, required: true },
  gamesPlayed: { type: Number, default: 0 },
  level: { type: Number, default: 50 },
  gamesWon: { type: Number, default: 0 },
  gamesLost : { type: Number, default: 0 },
  resetToken: { type: String, default: null },
  resetTokenExpire: { type: Date, default: null },
});

//////////////////////// Log Schema //////////////////////
const LogSchema = new mongoose.Schema({
  username: { type: String, required: true },
  action: { type: String, required: true }, // "Connexion", "Déconnexion", "Jeu joué", "Victoire", "Défaite"
  timestamp: { type: Date, default: Date.now },
});

const InvitationSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "denied"], default: "pending" },
  sentAt: { type: Date, default: Date.now },
});


/////////////////////// MODELS ////////////////////////////
const User = mongoose.model("User", UserSchema);
const Log = mongoose.model("Log", LogSchema);
const Invitation = mongoose.model("Invitation", InvitationSchema);


///////////// Middleware to verify JWT token ///////////////////////////
const verifyToken = (req, res, next) => {
  const tokenHeader = req.headers["authorization"];
  if (!tokenHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = tokenHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: err.name === "TokenExpiredError" ? "Token expired" : "Invalid token" });
    }
    req.user = decoded;
    next();
  });
}; 

//////////////////// Signup API //////////////////////////////
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "Nom d'utilisateur déjà pris" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id, username }, JWT_SECRET, { expiresIn: "1h" });

        // Enregistrer le log de connexion
        await saveLog(username, "creation de compte");

    res.json({ message: "Utilisateur créé avec succès", token, user: newUser });
  } catch (err) {
    console.error("❌ Erreur lors de l'inscription:", err);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

////////////////// Login API ////////////////////
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign({ userId: user._id, username }, JWT_SECRET, { expiresIn: "1h" });

    // Enregistrer le log de connexion
    await saveLog(username, "Connexion");

    res.json({ message: "Connexion réussie", token, user });
  } catch (err) {
    console.error("❌ Erreur lors de la connexion:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


///////////// Update Game Stats  /////////////////////////
app.post("/updateStats", verifyToken, async (req, res) => {
  const { won } = req.body;
  const { username } = req.user;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    user.gamesPlayed += 1;

    // Update level based on win or loss
    if (won) {
      user.level += 30;
    } else {
      user.level = Math.max(0, user.level - 15); // Ensure level doesn't go below 0
    }

    await user.save();

    // Enregistrer le log de la partie
    const action = won ? "Victoire" : "Défaite";
    await saveLog(username, `Jeu joué - ${action}`);

    res.json({ message: "Statistiques mises à jour", user });
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour des stats:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



///////////////////// ALL PLAYER API ///////////////////////
app.get("/players", async (req, res) => {
    try {
        const players = await User.find({}, "username email createdAt level gamesPlayed gamesWon gamesLost");
        res.json(players);
    } catch (err) {
        console.error("❌ Erreur lors de la récupération des joueurs:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

///////////////////// increment Games Played API ///////////////////////////
app.post("/incrementGamesPlayed", verifyToken, async (req, res) => {
    const { username } = req.user; // Get username from the decoded JWT

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "Joueur non trouvé." });
        }

        user.gamesPlayed += 1;
        await user.save();

        res.json({ message: "Mise à jour réussie !", user });
    } catch (error) {
        console.error("❌ Erreur serveur:", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

///////////////////////////////////// WIN LOSSES UPDATES /////////////////////////////////////
app.post("/updateStats", verifyToken, async (req, res) => {
  const { won } = req.body;
  const { username } = req.user;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    user.gamesPlayed += 1;

    if (won) {
      user.gamesWon += 1;
      user.level += 30; // ou +1 selon la logique que tu veux garder
    } else {
      user.gamesLost += 1;
      user.level = Math.max(0, user.level - 15);
    }

    await user.save();

    const action = won ? "Victoire" : "Défaite";
    await saveLog(username, `Jeu joué - ${action}`);

    res.json({ message: "Statistiques mises à jour", user });
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour des stats:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


/////////////////////////////////// Reset Passwords API ////////////////////////////////

// Add this API to handle reset password request
app.post("/reset-password-request", async (req, res) => {
  const { email, username } = req.body;
  try {
    const user = await User.findOne({ email, username });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // Generate reset token and expiration
    const resetToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    // Send reset token to user's email (or just send success for demo)
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Add this API to handle password reset
app.post("/reset-password", async (req, res) => {
  const { email, username, newPassword } = req.body;
  try {
    const user = await User.findOne({ email, username });
    if (!user || !user.resetToken || user.resetTokenExpire < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    // Hash new password and update it
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpire = null;
    await user.save();

        // Save log for password reset action
        await saveLog(username, "Password reset successfully");

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});


///////////////////// Fonction pour enregistrer un log //////////////////////////
const saveLog = async (username, action) => {
  try {
    const log = new Log({ username, action });
    await log.save();
    console.log(`📊 Log enregistré : ${username} - ${action}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'enregistrement du log :", error);
  }
};


//////////////////// Logout API ////////////////////
app.post("/logout", verifyToken, async (req, res) => {
  try {
    const { username } = req.user;
    await saveLog(username, "Déconnexion");
    res.json({ message: "Déconnexion réussie" });
  } catch (err) {
    console.error("❌ Erreur lors de la déconnexion :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

//////////////////// Get Logs API ////////////////////
app.get("/logs", verifyToken, async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des logs :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
/////////////////////////  ADD & REMOVE USERS / LOGS Activities /  BY ADMIN ////////////////////////////

//////////////////// Add user API //////////////////////////////
app.post("/adduser", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "Nom d'utilisateur déjà pris" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id, username }, JWT_SECRET, { expiresIn: "1h" });

        // Enregistrer le log de connexion
        await saveLog(username, "user added by Admin");

    res.json({ message: "Utilisateur créé avec succès", token, user: newUser });
  } catch (err) {
    console.error("❌ Erreur lors de l'inscription:", err);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});
//////////////////// Delete user API ////////////////////

app.delete("/removeuser", async (req, res) => {
  const { username, email } = req.body;

  try {
      const deletedUser = await User.findOneAndDelete({ username, email });

      if (!deletedUser) {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Log the deletion
      await saveLog("Admin", `Deleted user: ${deletedUser.username}`);

      res.json({ message: "Utilisateur supprimé avec succès", user: deletedUser });
  } catch (err) {
      console.error("❌ Erreur lors de la suppression de l'utilisateur:", err);
      res.status(500).json({ error: "Erreur serveur" });
  }
});

//////////////////////// Report dashboard admin ///////////////////////////////////// 
app.get("/report", async (req, res) => {
  try {
      const users = await User.find({}, "username email createdAt");
      const logs = await Log.find({}, "username action timestamp");

      res.json({ users, logs });
  } catch (err) {
      console.error("❌ Error fetching report data:", err);
      res.status(500).json({ error: "Server error" });
  }
});

//////////////////// Get Logs API ////////////////////
app.get("/adminlogs", async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });

    // Fetch user details for each log
    const logsWithUserDetails = await Promise.all(
      logs.map(async (log) => {
        const user = await User.findOne({ username: log.username }, "email username");
        return {
          timestamp: log.timestamp,
          action: log.action,
          user: user ? { username: user.username, email: user.email } : { username: log.username, email: "Non défini" }
        };
      })
    );

    res.json(logsWithUserDetails);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des logs :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const io = new Server(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const gameRooms = {};
const waitingPlayers = [];

io.on("connection", (socket) => {
  console.log("✅ Un joueur s'est connecté :", socket.id);

  socket.on("joinGame", async (username) => {
    socket.username = username;
    console.log(`🎮 ${username} (${socket.id}) veut rejoindre une partie`);

    if (!waitingPlayers.includes(socket)) {
      waitingPlayers.push(socket);
      console.log("🕒 Joueur ajouté à la file d'attente :", socket.id);

      // Si on a deux joueurs, on les fait rejoindre une room
      if (waitingPlayers.length >= 2) {
        const player1 = waitingPlayers.shift();
        const player2 = waitingPlayers.shift();
        const roomId = `room-${Date.now()}`;

        player1.join(roomId);
        player2.join(roomId);

        gameRooms[roomId] = {
          players: [
            { id: player1.id, username: player1.username },
            { id: player2.id, username: player2.username }
          ]
        };

        console.log(`🔗 Match trouvé ! ${player1.username} (${player1.id}) vs ${player2.username} (${player2.id})`);
        console.log(`🏠 Création de la salle : ${roomId}`);

        io.to(roomId).emit("startGame", {
          message: "La partie peut commencer !",
          players: gameRooms[roomId].players.map(p => p.username),
        });

        try {
          await saveLog(player1.username, `A rejoint une partie - Salle : ${roomId}`);
          await saveLog(player2.username, `A rejoint une partie - Salle : ${roomId}`);
        } catch (err) {
          console.error("❌ Erreur lors de l’enregistrement des logs :", err);
        }
      } else {
        socket.emit("waiting", { message: "En attente d'un adversaire..." });
      }
    }
  });

  socket.on("attack", (index) => {
    const roomId = findRoomByPlayer(socket.id);
    if (roomId) {
      console.log(`🎯 Attaque de ${socket.username} (${socket.id}) dans la salle ${roomId} : case ${index}`);
      socket.to(roomId).emit("opponentMove", index);
    }
  });

  socket.on("chatMessage", (message) => {
    const roomId = findRoomByPlayer(socket.id);
    if (roomId) {
      const sender = socket.username || "Joueur";
      console.log(`💬 Message de ${sender} dans la salle ${roomId} : ${message}`);
      io.to(roomId).emit("chatMessage", { sender, message });
    }
  });

  socket.on("sendInvitation", (receiverUsername) => {
    console.log(`📨 Invitation envoyée par ${socket.username} à ${receiverUsername}`);
    socket.emit("invitationSent", { receiver: receiverUsername });
  });

  socket.on("disconnect", () => {
    console.log("🚫 Joueur déconnecté :", socket.id);

    // Retirer de la file d’attente s’il y est
    const index = waitingPlayers.indexOf(socket);
    if (index !== -1) {
      waitingPlayers.splice(index, 1);
      console.log("❌ Joueur retiré de la file d'attente :", socket.id);
    }

    // Gérer la déconnexion en salle
    const roomId = findRoomByPlayer(socket.id);
    if (roomId) {
      gameRooms[roomId].players = gameRooms[roomId].players.filter(p => p.id !== socket.id);
      console.log(`❗ ${socket.username} a quitté la salle ${roomId}`);
      io.to(roomId).emit("playerLeft", { id: socket.id });

      if (gameRooms[roomId].players.length === 0) {
        delete gameRooms[roomId];
        console.log(`🗑️ Salle supprimée : ${roomId}`);
      }
    }
  });
});

function findRoomByPlayer(playerId) {
  return Object.keys(gameRooms).find(roomId =>
    gameRooms[roomId].players.some(p => p.id === playerId)
  );
}

module.exports = { app, http };



///////////////////// Search Player by Username API ///////////////////////
app.get("/searchPlayer/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "Joueur non trouvé" });
    }

    // 👉 Enregistrer l'action dans les logs
    await saveLog(username, "Recherche du profil joueur");

    // Retourner les informations du joueur
    res.json({
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      level: user.level,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      gamesLost: user.gamesLost
    });

  } catch (err) {
    console.error("❌ Erreur lors de la recherche de joueur :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/////////////////////////////////// Send invitation to another player //////////////////////////////////////////
app.post("/send-invitation", verifyToken, async (req, res) => {
  const { receiverUsername } = req.body;
  const { username } = req.user;

  try {
    const sender = await User.findOne({ username });
    if (!sender) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const receiver = await User.findOne({ username: receiverUsername });
    if (!receiver) return res.status(404).json({ error: "Joueur destinataire non trouvé" });

    // Ensure there's no existing pending invitation
    const existingInvitation = await Invitation.findOne({
      sender: sender._id,
      receiver: receiver._id,
      status: "pending"
    });
    
    if (existingInvitation) {
      return res.status(400).json({ error: "Invitation déjà envoyée" });
    }

    const invitation = new Invitation({
      sender: sender._id,
      receiver: receiver._id,
      status: "pending"
    });

    await invitation.save();
    socket.emit("invitationSent", { receiver: receiver.username });

    res.json({ message: "Invitation envoyée", invitation });
  } catch (err) {
    console.error("❌ Erreur lors de l'envoi de l'invitation :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



///////////////////////////////////// Get all pending invitations for the current user ///////////////////////////////////
app.get("/invitations", verifyToken, async (req, res) => {
  const { username } = req.user;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const invitations = await Invitation.find({
      receiver: user._id,
      status: "pending",
    }).populate("sender", "username");

    res.json({ invitations });
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des invitations:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/////////////////////////////////////// Accept an invitation
app.post("/accept-invitation", verifyToken, async (req, res) => {
  const { invitationId } = req.body;
  const { username } = req.user;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) return res.status(404).json({ error: "Invitation non trouvée" });

    // Check if the logged-in user is the receiver
    if (!invitation.receiver.equals(user._id)) {
      return res.status(403).json({ error: "Vous ne pouvez pas accepter cette invitation." });
    }

    // Update the invitation status to "accepted"
    invitation.status = "accepted";
    await invitation.save();

    // Notify both players (you could also trigger a game start here if needed)
    io.to(invitation.sender.toString()).emit("invitationStatus", { status: "accepted", invitation });
    io.to(invitation.receiver.toString()).emit("invitationStatus", { status: "accepted", invitation });

    res.json({ message: "Invitation acceptée avec succès", invitation });
  } catch (err) {
    console.error("❌ Erreur lors de l'acceptation de l'invitation:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/////////////////////////////////////// Deny an invitation/////////////////////////////////////
app.post("/deny-invitation", verifyToken, async (req, res) => {
  const { invitationId } = req.body;
  const { username } = req.user;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) return res.status(404).json({ error: "Invitation non trouvée" });

    // Check if the logged-in user is the receiver
    if (!invitation.receiver.equals(user._id)) {
      return res.status(403).json({ error: "Vous ne pouvez pas refuser cette invitation." });
    }

    // Update the invitation status to "denied"
    invitation.status = "denied";
    await invitation.save();

    // Notify both players (you could also handle the UI here)
    io.to(invitation.sender.toString()).emit("invitationStatus", { status: "denied", invitation });
    io.to(invitation.receiver.toString()).emit("invitationStatus", { status: "denied", invitation });

    res.json({ message: "Invitation refusée avec succès", invitation });
  } catch (err) {
    console.error("❌ Erreur lors du refus de l'invitation:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});







//////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// START SERVER ////////////////////////////////
http.listen(PORT, () => {
  console.log(`🚀 Serveur avec Socket.IO démarré sur le port ${PORT}`);
});
////////////////////////////////////////////////////////////////////////////////