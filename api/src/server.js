// api/src/server.js
const express = require('express');
const cors = require('cors');
const sortieRoutes = require('./routes/sorties');
const { connectToDb } = require('./utils/db');  // Vérifie le chemin

const app = express();
app.use(cors());
app.use(express.json());

// Connexion à MongoDB au démarrage
connectToDb().then(() => {
  console.log("✅ Connecté à MongoDB");
}).catch(err => {
  console.error("❌ Erreur de connexion à MongoDB:", err);
});

// Routes
app.use('/sorties', sortieRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});
