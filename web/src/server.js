// web/src/server.js
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware pour servir les fichiers statiques
app.use(express.static('public'));

// Configuration du proxy vers l'API
app.use('/api', async (req, res) => {
  try {
    // Construit l'URL de l'API en supprimant le préfixe /api
    const apiUrl = `http://localhost:3000${req.originalUrl.replace(/^\/api/, '')}`;

    console.log(`Proxy vers: ${apiUrl}`);  // Log pour débogage

    const response = await axios({
      method: req.method,
      url: apiUrl,
      params: req.query,  // Transmet les paramètres de requête
      data: req.body,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Erreur proxy API:", {
      message: error.message,
      config: error.config,
      response: error.response?.data
    });
    res.status(500).json({
      error: "Erreur proxy",
      details: error.response?.data || error.message
    });
  }
});

// Routes pour les pages HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/sortie.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/sortie.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur web démarré sur http://localhost:${PORT}`);
});
