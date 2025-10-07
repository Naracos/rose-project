// api/src/utils/db.js
const { MongoClient } = require('mongodb');

let db = null;

async function connectToDb() {
  if (db) return db;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rose_db';
  console.log(`Tentative de connexion à MongoDB: ${uri}`);

  const client = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 }); // Test de connexion
    db = client.db('rose_db');
    console.log("✅ Connecté à MongoDB");
    return db;
  } catch (error) {
    console.error("❌ Échec de la connexion à MongoDB:", error);
    throw new Error(`Impossible de se connecter à MongoDB: ${error.message}`);
  }
}

// Export correct de la fonction
module.exports = { connectToDb };
