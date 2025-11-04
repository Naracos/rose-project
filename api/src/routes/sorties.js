const express = require('express');
const router = express.Router();
const controller = require('../controllers/sortiesController');

router.post('/', controller.createSortie);
router.get('/message/:messageId', controller.getByMessageId);
router.patch('/:id/participants', express.json(), controller.updateParticipants);
router.post('/sync', express.json(), controller.syncFromBot);
router.post('/:id/save', express.json(), controller.saveSortie);
router.patch('/:id', express.json(), controller.updateSortie);

module.exports = router;
