// bot/src/utils/db.js
const { MongoClient } = require('mongodb');

let db;

async function connectToDb() {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      return client.db();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Attend 1s
    }
  }
}


module.exports = { connectToDb };
