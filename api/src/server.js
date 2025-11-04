// api/src/server.js
const express = require('express');
const cors = require('cors');
const db = require('./utils/db');

(async () => {
  try {
    await db.connect();

    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '2mb' }));

    // route de santé
    app.get('/status', (req, res) => {
      res.json({ status: 'ok', uptime: process.uptime() });
    });

    const sortiesRouter = require('./routes/sorties');
    app.use('/api/sorties', sortiesRouter);

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`API démarrée sur http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Erreur initialisation API:', err);
    process.exit(1);
  }
})();
