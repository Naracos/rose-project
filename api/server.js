const app = require('./src/app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rose';

console.log('[DEBUG] Tentative connexion MongoDB:', MONGODB_URI);

// Connexion MongoDB (sans options dépréciées)
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('[DEBUG] ✅ Connecté à MongoDB');
    
    // Démarrer le serveur APRÈS la connexion DB
    app.listen(PORT, () => {
      console.log(`[DEBUG] ✅ API démarrée sur http://localhost:${PORT}`);
      console.log(`[DEBUG] Endpoints disponibles:`);
      console.log(`  - GET  /api/health`);
      console.log(`  - GET  /status`);
      console.log(`  - POST /api/sorties`);
      console.log(`  - GET  /api/sorties/:id`);
      console.log(`  - GET  /api/sorties/message/:messageId`);
      console.log(`  - PATCH /api/sorties/:id`);
    });
  })
  .catch(err => {
    console.error('[DEBUG] ❌ Erreur connexion MongoDB:', err.message);
    console.error('[DEBUG] Conseil: Lance mongod ou utilise MongoDB Atlas');
    
    // Continuer sans DB pour tests
    app.listen(PORT, () => {
      console.log(`[DEBUG] ⚠️ API démarrée SANS MongoDB sur http://localhost:${PORT}`);
    });
  });

process.on('uncaughtException', err => {
  console.error('[ERROR] Erreur non capturée:', err);
  process.exit(1);
});

process.on('unhandledRejection', err => {
  console.error('[ERROR] Rejet de promesse non géré:', err);
});
