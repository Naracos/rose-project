// api/src/models/Sortie.js
const { ObjectId } = require('mongodb');
const { connectToDb } = require('../utils/db');  // Vérifie le chemin

class Sortie {
  static async getAll(skip = 0, limit = 10) {
    try {
      const db = await connectToDb();  // Appel correct
      return db.collection('sorties')
        .find()
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray();
    } catch (error) {
      console.error("Erreur dans Sortie.getAll:", error);
      throw error;
    }
  }

   /**
   * Enregistre une nouvelle sortie
   * @param {Object} data - Données de la sortie
   * @returns {Promise<Object>} - Résultat de l'insertion
   */
  static async save(data) {
    if (!data || typeof data !== 'object') {
      throw new Error("Les données de la sortie sont invalides");
    }

    try {
      const db = await connectToDb();
      const result = await db.collection('sorties').insertOne({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return result;
    } catch (error) {
      console.error("Erreur dans Sortie.save:", error);
      throw new Error(`Erreur base de données: ${error.message}`);
    }
  }

  static async count() {
    const db = await connectToDb();
    return db.collection('sorties').countDocuments();
  }

  static async getById(id) {
    const db = await connectToDb();
    return db.collection('sorties').findOne({ _id: new ObjectId(id) });
  }

  static async update(id, updates) {
    const db = await connectToDb();
    updates.updatedAt = new Date();
    return db.collection('sorties').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );
  }

  static async delete(id) {
    const db = await connectToDb();
    return db.collection('sorties').deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = Sortie;
