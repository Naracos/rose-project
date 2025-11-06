const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const api = require('../../services/apiClient');
const updateCache = require('../../services/updateCache');

/**
 * Construit l'embed du tableau des participants
 * Utilisé à la fois en MP et dans le thread
 */
function buildParticipantsEmbed(sortie, participants) {
  const participantsList = participants.length
    ? participants.map(id => `• <@${id}>`).join('\n')
    : '*(Aucun participant pour le moment)*';

  // Construire le titre avec lien (si sortieUrl disponible)
  const title = sortie.sortieUrl
    ? `📋 ${sortie.sortieUrl}`
    : `📋 ${sortie.title}`;

  return new EmbedBuilder()
    .setTitle(title)
    .setDescription('**Participants inscrits :**')
    .addFields({
      name: `Nombre: ${participants.length}`,
      value: participantsList,
      inline: false
    })
    .setColor(participants.length > 0 ? '#00aa00' : '#0099ff')
    .setFooter({ text: 'Réagissez avec ✅ pour vous inscrire/retirer' })
    .setTimestamp();
}

/**
 * Construit la ActionRow avec le bouton Ping Participants
 */
function buildPingButton(sortieId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ping_participants_${sortieId}`)
      .setLabel('📢 Ping Participants')
      .setStyle(ButtonStyle.Primary)
  );
}

/**
 * Met à jour le MP de l'organisateur avec l'embed du tableau
 */
async function updateOrganizerDMFromSortie(client, sortie, participants) {
  if (!sortie?.organizerId) return;

  try {
    const user = await client.users.fetch(sortie.organizerId).catch(() => null);
    if (!user) return;
    const dm = await user.createDM();

    const embed = buildParticipantsEmbed(sortie, participants);

    if (sortie.organizerDmMessageId) {
      try {
        const msg = await dm.messages.fetch(sortie.organizerDmMessageId).catch(() => null);
        if (msg) {
          await msg.edit({ embeds: [embed] });
          console.log('✅ MP organisateur mis à jour');
          return;
        }
      } catch (e) {
        console.error('Erreur fetch MP existant:', e.message);
      }
    }

    const newMsg = await dm.send({ embeds: [embed] });
    const sortieId = sortie._id || sortie.id;
    if (sortieId) await api.updateSortie(sortieId, { organizerDmMessageId: newMsg.id });
  } catch (err) {
    console.error('Erreur updateOrganizerDMFromSortie:', err);
  }
}

/**
 * Met à jour le tableau des participants dans le thread
 */
async function updateTableauFromSortie(client, sortie, participants) {
  if (!sortie?.threadId) {
    console.warn('updateTableauFromSortie: threadId manquant');
    return;
  }

  try {
    const thread = await client.channels.fetch(sortie.threadId).catch(() => null);
    if (!thread) {
      console.warn('updateTableauFromSortie: thread non trouvé id=', sortie.threadId);
      return;
    }

    let tableMsg = null;

    // Priorité 1 : utiliser tableMessageId si disponible
    if (sortie.tableMessageId) {
      try {
        tableMsg = await thread.messages.fetch(sortie.tableMessageId).catch(() => null);
        if (tableMsg) {
          console.log('✅ Message tableau trouvé via ID');
        }
      } catch (e) {
        console.warn('Erreur fetch via tableMessageId:', e.message);
      }
    }

    // Priorité 2 : chercher par titre de l'embed (fallback)
    if (!tableMsg) {
      console.log('⚠️ Fallback: cherche le message embed par titre...');
      const messages = await thread.messages.fetch({ limit: 50 }).catch(() => null);
      if (messages) {
        for (const msg of messages.values()) {
          if (msg.embeds.length > 0 && msg.embeds[0].title && msg.embeds[0].title.includes('📋')) {
            tableMsg = msg;
            console.log('✅ Message trouvé via titre embed');
            break;
          }
        }
      }
    }

    if (!tableMsg) {
      console.warn('updateTableauFromSortie: impossible de trouver le message embed du tableau');
      return;
    }

    const sortieId = sortie._id || sortie.id;
    const embed = buildParticipantsEmbed(sortie, participants);
    const button = buildPingButton(sortieId);

    await tableMsg.edit({ embeds: [embed], components: [button] });
    console.log('✅ Tableau mis à jour pour sortie:', sortie.title);
  } catch (err) {
    console.error('Erreur updateTableauFromSortie:', err);
  }
}

/**
 * Fonction principale : met à jour participants via l'API
 */
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
  if (!sortieId) throw new Error('Impossible d\'obtenir l\'ID de la sortie depuis l\'API');

  // Vérifier si les participants Discord ont changé (avant API call)
  const cachedParticipants = updateCache.getCachedParticipants(sortieId);
  const participantsSorted = [...participants].sort().join(',');
  const cachedSorted = cachedParticipants ? [...cachedParticipants].sort().join(',') : null;

  if (cachedSorted === participantsSorted) {
    console.log('⏭️ Participants Discord inchangés, skip debounce');
    return { sortieId, participants };
  }

  console.log('🔄 Changement détecté, application du debounce...');
  updateCache.updateCache(sortieId, participants);

  // Appliquer debounce
  await updateCache.getDebounceTimer(sortieId);

  // Met à jour les participants via l'API
  try {
    await api.updateParticipants(sortieId, participants);
    console.log('✅ API mise à jour avec', participants.length, 'participants');
  } catch (err) {
    console.error('Erreur updateParticipants API:', err);
    return { sortieId, participants };
  }

  // Récupère la sortie mise à jour et met à jour le MP + tableau
  try {
    const updated = await api.getSortieByMessageId(starterMessage.id);
    console.log('📋 Sortie récupérée: participants=', updated.participants?.length);
    
    const apiParticipants = updated.participants || participants;
    await updateOrganizerDMFromSortie(starterMessage.client, updated, apiParticipants);
    await updateTableauFromSortie(starterMessage.client, updated, apiParticipants);
  } catch (err) {
    console.error('Erreur mise à jour après sync participants:', err);
  }

  return { sortieId, participants };
}

module.exports = { updateParticipantsList, buildParticipantsEmbed, buildPingButton };