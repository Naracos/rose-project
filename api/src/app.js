const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

console.log('[DEBUG] Chargement des routes...');

// Routes de test (AVANT /api/sorties)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    mongodb: {
      connected: mongoose.connection.readyState === 1
    }
  });
});

app.get('/status', async (req, res) => {
  console.log('[DEBUG] Route /status appelée');
  
  let mongoConnected = false;
  let mongoPing = null;
  
  // Test de connexion MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      const startMongo = Date.now();
      await mongoose.connection.db.admin().ping();
      mongoPing = Date.now() - startMongo;
      mongoConnected = true;
      console.log(`[DEBUG] MongoDB ping: ${mongoPing}ms`);
    } else {
      console.log(`[DEBUG] MongoDB state: ${mongoose.connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
    }
  } catch (err) {
    console.error('[DEBUG] Erreur ping MongoDB:', err.message);
  }
  
  const response = {
    status: 'OK',
    timestamp: new Date(),
    mongodb: {
      connected: mongoConnected,
      state: mongoose.connection.readyState,
      ping: mongoPing
    }
  };
  
  console.log('[DEBUG] Réponse /status:', JSON.stringify(response, null, 2));
  res.json(response);
});

// Routes principales
try {
  const sortiesRouter = require('./routes/sorties');
  app.use('/api/sorties', sortiesRouter);
  console.log('[DEBUG] ✅ Routes /api/sorties enregistrées');
} catch (err) {
  console.error('[DEBUG] ❌ Erreur chargement routes sorties:', err.message);
}

// Gestion erreurs 404 (APRÈS les routes)
app.use((req, res) => {
  console.warn(`[WARN] Route non trouvée: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;