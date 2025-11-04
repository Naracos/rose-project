const Sortie = require('../models/Sortie');

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
 * POST /api/sorties
 * Create a sortie (expects channelId, channelName and title recommended)
 */
exports.createSortie = async (req, res) => {
  try {
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
    res.status(201).json(sortie);
  } catch (err) {
    console.error('createSortie error', err);
    res.status(500).json({ error: 'internal_error' });
  }
};

/**
 * GET /api/sorties/message/:messageId
 * Retourne une sortie par messageId
 */
exports.getByMessageId = async (req, res) => {
  try {
    const { messageId } = req.params;
    const sortie = await Sortie.findOne({ messageId });
    if (!sortie) return res.status(404).json({ error: 'Not found' });
    res.json(sortie);
  } catch (err) {
    console.error('getByMessageId error', err);
    res.status(500).json({ error: 'internal_error' });
  }
};

/**
 * PATCH /api/sorties/:id/participants
 * Remplace la liste des participants (body: { participants: [...] })
 */
exports.updateParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { participants } = req.body;
    if (!Array.isArray(participants)) return res.status(400).json({ error: 'participants doit être un tableau' });

    const sortie = await Sortie.findById(id);
    if (!sortie) return res.status(404).json({ error: 'Not found' });

    sortie.participants = Array.from(new Set(participants.map(String)));
    await sortie.save();
    res.json(sortie);
  } catch (err) {
    console.error('updateParticipants error', err);
    res.status(500).json({ error: 'internal_error' });
  }
};

/**
 * POST /api/sorties/sync
 * Synchronisation envoyée par le bot : { messageId, participants: [...] }
 * - cherche sortie par messageId, met à jour participants (merge unique)
 * - si non trouvée -> 404
 */
exports.syncFromBot = async (req, res) => {
  try {
    const { messageId, participants } = req.body;
    if (!messageId) return res.status(400).json({ error: 'messageId requis' });
    if (!Array.isArray(participants)) return res.status(400).json({ error: 'participants doit être un tableau' });

    const sortie = await Sortie.findOne({ messageId });
    if (!sortie) return res.status(404).json({ error: 'Not found' });

    const existing = new Set(sortie.participants.map(String));
    for (const p of participants.map(String)) existing.add(p);
    sortie.participants = Array.from(existing);
    await sortie.save();
    res.json(sortie);
  } catch (err) {
    console.error('syncFromBot error', err);
    res.status(500).json({ error: 'internal_error' });
  }
};

/**
 * POST /api/sorties/:id/save
 * Marque la sortie comme sauvegardée (utilisé par la commande !savesortie)
 * body optional: { note, meta }
 */
exports.saveSortie = async (req, res) => {
  try {
    const { id } = req.params;
    const sortie = await Sortie.findById(id);
    if (!sortie) return res.status(404).json({ error: 'Not found' });

    sortie.saved = true;
    sortie.savedAt = new Date();
    if (req.body.meta) sortie.meta = req.body.meta;
    await sortie.save();
    res.json(sortie);
  } catch (err) {
    console.error('saveSortie error', err);
    res.status(500).json({ error: 'internal_error' });
  }
};

/**
 * PATCH /api/sorties/:id
 * Met à jour certains champs autorisés d'une sortie (whitelist)
 */
exports.updateSortie = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const allowed = ['organizerDmMessageId', 'organizerDmChannelId', 'title', 'meta', 'saved', 'savedAt', 'participants'];
    const update = {};
    for (const k of allowed) if (Object.prototype.hasOwnProperty.call(body, k)) update[k] = body[k];

    if (Object.keys(update).length === 0) return res.status(400).json({ error: 'Aucun champ autorisé à mettre à jour' });

    const sortie = await Sortie.findByIdAndUpdate(id, update, { new: true }).exec();
    if (!sortie) return res.status(404).json({ error: 'Not found' });
    res.json(sortie);
  } catch (err) {
    console.error('updateSortie error', err);
    res.status(500).json({ error: 'internal_error' });
  }
};