const Sortie = require('../models/Sortie');

console.log('[DEBUG] Chargement de sortiesController...');

function extractFromBody(body = {}) {
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    const m = body.messages[0];
    return {
      messageId: m.id || m.messageId || body.messageId || null,
      threadId: m.threadId || body.threadId || null,
      channelId: m.channelId || body.channelId || null,
      channelName: m.channelName || m.channel?.name || body.channelName || null,
      guildId: m.guildId || body.guildId || null,
      organizerId: m.author?.id || m.organizerId || body.organizerId || null,
      title: m.title || m.content?.slice(0,200) || body.title || null,
      participants: body.participants || m.participants || []
    };
  }
  return {
    messageId: body.messageId || null,
    threadId: body.threadId || null,
    channelId: body.channelId || null,
    channelName: body.channelName || null,
    guildId: body.guildId || null,
    organizerId: body.organizerId || null,
    title: body.title || null,
    participants: body.participants || []
  };
}

/**
 * GET /api/sorties/:id
 */
exports.getSortieById = async (req, res) => {
  try {
    console.log(`[DEBUG] getSortieById appelé pour id=${req.params.id}`);
    const { id } = req.params;
    const sortie = await Sortie.findById(id).exec();
    if (!sortie) {
      console.log(`[DEBUG] Sortie non trouvée: ${id}`);
      return res.status(404).json({ error: 'Sortie not found' });
    }
    console.log(`[DEBUG] Sortie trouvée: ${sortie.title}`);
    res.json(sortie);
  } catch (err) {
    console.error('[DEBUG] Erreur getSortieById:', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
};

/**
 * GET /api/sorties/message/:messageId
 */
exports.getSortieByMessageId = async (req, res) => {
  try {
    console.log(`[DEBUG] getSortieByMessageId appelé pour messageId=${req.params.messageId}`);
    const { messageId } = req.params;
    const sortie = await Sortie.findOne({ messageId }).exec();
    if (!sortie) {
      console.log(`[DEBUG] Sortie non trouvée pour messageId: ${messageId}`);
      return res.status(404).json({ error: 'Sortie not found' });
    }
    console.log(`[DEBUG] Sortie trouvée: ${sortie.title}`);
    res.json(sortie);
  } catch (err) {
    console.error('[DEBUG] Erreur getSortieByMessageId:', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
};

/**
 * POST /api/sorties
 */
exports.createSortie = async (req, res) => {
  try {
    console.log('[DEBUG] createSortie appelé avec:', JSON.stringify(req.body, null, 2));
    const data = extractFromBody(req.body || {});
    // validation souple
    if (!data.channelId || !data.channelName || !data.title) {
      return res.status(400).json({ error: 'Données manquantes', details: 'channelId, channelName et title sont recommandés' });
    }
    const sortie = new Sortie({
      messageId: data.messageId,
      threadId: data.threadId,
      channelId: data.channelId,
      channelName: data.channelName,
      guildId: data.guildId,
      organizerId: data.organizerId,
      title: data.title,
      participants: Array.isArray(data.participants) ? Array.from(new Set(data.participants.map(String))) : []
    });
    await sortie.save();
    console.log(`[DEBUG] Sortie créée: ${sortie._id}`);
    res.status(201).json(sortie);
  } catch (err) {
    console.error('[DEBUG] Erreur createSortie:', err.message);
    res.status(400).json({ error: err.message });
  }
};

/**
 * PATCH /api/sorties/:id
 */
exports.updateSortie = async (req, res) => {
  try {
    console.log(`[DEBUG] updateSortie appelé pour id=${req.params.id}`);
    const { id } = req.params;
    const body = req.body || {};
    const allowed = ['organizerDmMessageId', 'organizerDmChannelId', 'tableMessageId', 'tableChannelId', 'sortieUrl', 'title', 'meta', 'saved', 'savedAt', 'participants'];
    const update = {};
    for (const k of allowed) if (Object.prototype.hasOwnProperty.call(body, k)) update[k] = body[k];

    if (Object.keys(update).length === 0) {
      console.log('[DEBUG] Aucun champ autorisé à mettre à jour');
      return res.status(400).json({ error: 'Aucun champ autorisé à mettre à jour' });
    }

    const sortie = await Sortie.findByIdAndUpdate(id, update, { new: true }).exec();
    if (!sortie) {
      console.log(`[DEBUG] Sortie non trouvée: ${id}`);
      return res.status(404).json({ error: 'Not found' });
    }
    console.log(`[DEBUG] Sortie mise à jour: ${sortie._id}`);
    res.json(sortie);
  } catch (err) {
    console.error('[DEBUG] Erreur updateSortie:', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
};

/**
 * PATCH /api/sorties/:id/participants
 */
exports.updateParticipants = async (req, res) => {
  try {
    console.log(`[DEBUG] updateParticipants appelé pour id=${req.params.id}`);
    const { id } = req.params;
    const { participants } = req.body;
    if (!Array.isArray(participants)) {
      console.log('[DEBUG] participants n\'est pas un array');
      return res.status(400).json({ error: 'participants must be an array' });
    }

    const sortie = await Sortie.findByIdAndUpdate(id, { participants }, { new: true }).exec();
    if (!sortie) {
      console.log(`[DEBUG] Sortie non trouvée: ${id}`);
      return res.status(404).json({ error: 'Not found' });
    }
    console.log(`[DEBUG] Participants mis à jour: ${sortie._id}, count=${participants.length}`);
    res.json(sortie);
  } catch (err) {
    console.error('[DEBUG] Erreur updateParticipants:', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
};

console.log('[DEBUG] ✅ sortiesController chargé');