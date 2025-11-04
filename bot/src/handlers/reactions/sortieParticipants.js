const logAction = require('../../utils/actionLogger');
const api = require('../../services/apiClient');

async function updateOrganizerDMFromSortie(client, sortie, participants) {
  if (!sortie?.organizerId) return;
  try {
    const user = await client.users.fetch(sortie.organizerId).catch(() => null);
    if (!user) return;
    const dm = await user.createDM();
    const content = participants.length
      ? `Voici la liste des participants (${participants.length}) : ${participants.map(id => `<@${id}>`).join(', ')}`
      : 'Aucun participant pour le moment.';
    if (sortie.organizerDmMessageId) {
      // tenter de récupérer et éditer le message existant
      try {
        const msg = await dm.messages.fetch(sortie.organizerDmMessageId).catch(() => null);
        if (msg) {
          await msg.edit({ content });
          return;
        }
      } catch (e) {
        // ignore et retenter en envoyant un nouveau message
      }
    }
    // envoi d'un nouveau MP et sauvegarde de son id
    const newMsg = await dm.send({ content });
    const sortieId = sortie._id || sortie.id;
    if (sortieId) await api.updateSortie(sortieId, { organizerDmMessageId: newMsg.id });
  } catch (err) {
    console.error('Erreur updateOrganizerDMFromSortie:', err);
  }
}

async function updateParticipantsList(starterMessage) {
  if (starterMessage.partial) starterMessage = await starterMessage.fetch();

  const reaction = starterMessage.reactions.cache.get('✅') || (await starterMessage.reactions.fetch()).get('✅');
  const usersMap = reaction ? await reaction.users.fetch() : new Map();
  const participants = Array.from(usersMap.values()).filter(u => !u.bot).map(u => u.id);

  const channelId = starterMessage.thread?.parentId || starterMessage.channelId;
  let channelName = starterMessage.thread?.parent?.name || starterMessage.channel?.name || null;
  if (!channelName && channelId && starterMessage.client) {
    const ch = await starterMessage.client.channels.fetch(channelId).catch(() => null);
    channelName = ch?.name || null;
  }
  const title = starterMessage.thread?.name || starterMessage.content?.slice(0, 200) || 'sortie';

  // Cherche ou crée la sortie via l'API
  let sortie;
  try {
    sortie = await api.getSortieByMessageId(starterMessage.id);
  } catch (e) {
    if (e.status === 404) {
      sortie = await api.createSortie({
        messageId: starterMessage.id,
        threadId: starterMessage.thread?.id || null,
        channelId,
        channelName,
        guildId: starterMessage.guildId || (starterMessage.guild?.id || null),
        organizerId: starterMessage.author?.id || null,
        title,
        participants
      });
    } else {
      throw e;
    }
  }

  const sortieId = sortie._id || sortie.id || (sortie._doc && sortie._doc._id);
  if (!sortieId) throw new Error('Impossible d’obtenir l’ID de la sortie depuis l’API');

  await api.updateParticipants(sortieId, participants);

  // récupérer la sortie mise à jour et mettre à jour le MP de l'organisateur
  try {
    const updated = await api.getSortieByMessageId(starterMessage.id);
    await updateOrganizerDMFromSortie(starterMessage.client, updated, participants);
  } catch (err) {
    console.error('Erreur updateParticipants -> updateOrganizerDM:', err);
  }

  return { sortieId, participants };
}

module.exports = { updateParticipantsList };