const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const Sortie = require('../models/Sortie');

// Middleware de validation des données
const validateSortieData = (req, res, next) => {
  if (!req.body.channelId || !req.body.channelName || !req.body.title) {
    return res.status(400).json({
      error: "Données manquantes",
      details: "channelId, channelName et title sont requis"
    });
  }

  if (!Array.isArray(req.body.messages)) {
    return res.status(400).json({
      error: "Format invalide",
      details: "messages doit être un tableau"
    });
  }
  next();
};

// Créer une sortie (version complète)
router.post('/', validateSortieData, async (req, res) => {
  try {
    const sortieData = {
      channelId: req.body.channelId,
      channelName: req.body.channelName,
      title: req.body.title,
      mainMessage: req.body.messages[0] || null,  // Premier message comme message principal
      messages: req.body.messages.map(msg => ({
        id: msg.id,
        author: msg.author,
        content: msg.content,
        createdAt: new Date(msg.createdAt),
        reactions: msg.reactions || [],
        attachments: msg.attachments || [],
        editedAt: msg.editedAt ? new Date(msg.editedAt) : null
      })),
      messageCount: req.body.messages.length,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Sortie.save(sortieData);
    res.status(201).json({
      success: true,
      _id: result.insertedId,
      ...sortieData
    });
  } catch (error) {
    console.error("Erreur création sortie:", error);
    res.status(500).json({
      error: "Erreur serveur",
      details: error.message
    });
  }
});

// Lister les sorties (avec pagination)
router.get('/', async (req, res) => {
  try {
    console.log("Requête reçue avec params:", req.query);  // Log des paramètres

    // Valeurs par défaut et validation
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    console.log(`Pagination: page=${page}, limit=${limit}, skip=${skip}`);

    // Récupération parallèle des données
    const [sorties, total] = await Promise.all([
      Sortie.getAll(skip, limit).catch(err => {
        console.error("Erreur getAll:", err);
        throw err;
      }),
      Sortie.count().catch(err => {
        console.error("Erreur count:", err);
        throw err;
      })
    ]);

    console.log(`Résultats: ${sorties.length} sorties, total=${total}`);

    res.json({
      success: true,
      data: sorties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error) {
    console.error("Erreur complète dans /sorties:", {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({
      error: "Erreur serveur",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


// Récupérer une sortie complète
router.get('/:id', async (req, res) => {
  try {
    const sortie = await Sortie.getById(req.params.id);
    if (!sortie) {
      return res.status(404).json({
        error: "Sortie non trouvée",
        id: req.params.id
      });
    }
    res.json({
      success: true,
      data: sortie
    });
  } catch (error) {
    console.error("Erreur récupération sortie:", error);
    res.status(500).json({
      error: "Erreur serveur",
      details: error.message
    });
  }
});

// Mettre à jour une sortie
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.messages && !Array.isArray(updates.messages)) {
      return res.status(400).json({
        error: "Format invalide",
        details: "messages doit être un tableau"
      });
    }

    const result = await Sortie.update(id, updates);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Erreur mise à jour sortie:", error);
    res.status(500).json({
      error: "Erreur serveur",
      details: error.message
    });
  }
});

// Supprimer une sortie
router.delete('/:id', async (req, res) => {
  try {
    const result = await Sortie.delete(req.params.id);
    res.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Erreur suppression sortie:", error);
    res.status(500).json({
      error: "Erreur serveur",
      details: error.message
    });
  }
});

module.exports = router;
