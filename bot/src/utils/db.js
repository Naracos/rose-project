// bot/src/utils/db.js
const mongoose = require('mongoose');

async function connect() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rose_db';
  console.log('Tentative de connexion à MongoDB (bot):', uri);
  mongoose.set('strictQuery', false);
  await mongoose.connect(uri);
  console.log('✅ Bot connecté à MongoDB');
  return mongoose;
}

module.exports = { connect, mongoose };
