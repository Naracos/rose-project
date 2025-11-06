const express = require('express');
const router = express.Router();
const sortiesController = require('../controllers/sortiesController');

console.log('[DEBUG] Chargement du router /api/sorties...');

// GET /api/sorties/message/:messageId (AVANT :id pour éviter conflit)
router.get('/message/:messageId', (req, res, next) => {
  console.log(`[DEBUG] GET /api/sorties/message/${req.params.messageId}`);
  sortiesController.getSortieByMessageId(req, res, next);
});

// GET /api/sorties/:id
router.get('/:id', (req, res, next) => {
  console.log(`[DEBUG] GET /api/sorties/${req.params.id}`);
  sortiesController.getSortieById(req, res, next);
});

// POST /api/sorties
router.post('/', (req, res, next) => {
  console.log('[DEBUG] POST /api/sorties', JSON.stringify(req.body, null, 2));
  sortiesController.createSortie(req, res, next);
});

// PATCH /api/sorties/:id
router.patch('/:id', (req, res, next) => {
  console.log(`[DEBUG] PATCH /api/sorties/${req.params.id}`, JSON.stringify(req.body, null, 2));
  sortiesController.updateSortie(req, res, next);
});

// PATCH /api/sorties/:id/participants
router.patch('/:id/participants', (req, res, next) => {
  console.log(`[DEBUG] PATCH /api/sorties/${req.params.id}/participants`);
  sortiesController.updateParticipants(req, res, next);
});

console.log('[DEBUG] ✅ Router /api/sorties configuré avec 5 routes');

module.exports = router;
