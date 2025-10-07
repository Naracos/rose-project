const express = require('express');
const cors = require('cors');
const { connectToDb } = require('./utils/db');
const conversationRoutes = require('./routes/conversations');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/conversations', conversationRoutes);

// Démarrage
app.listen(PORT, async () => {
  await connectToDb();
  console.log(`API démarrée sur le port ${PORT}`);
});
