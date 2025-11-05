// bot/src/utils/forumSaver.js
const { fetchAllMessages } = require('./messageFetcher');
const { MessageType } = require('discord.js');

// bot/src/utils/forumSaver.js
const axios = require('axios');
const api = require('../services/apiClient');

async function saveChannelToForum(channel, title) {
  if (!channel) throw new Error('Channel manquant');

  const payload = {
    messageId: null,
    threadId: null,
    channelId: channel.id,
    channelName: channel.name || null,
    guildId: channel.guild?.id || channel.guildId || null,
    organizerId: null,
    title: title || `Sortie sur ${channel.name}`
  };

  try {
    const sortie = await api.createSortie(payload);
    const sortieId = sortie._id || sortie.id || (sortie._doc && sortie._doc._id) || 'inconnu';
    return `✅ Sortie enregistrée via l'API (id: ${sortieId})`;
  } catch (err) {
    console.error('Erreur API:', err);
    const body = err.body ?? err.message ?? String(err);
    throw new Error(`Impossible d'enregistrer: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
}

function getAttachmentType(url) {
  if (url.match(/\.(jpeg|jpg|gif|png)$/i)) return "image";
  if (url.match(/\.(mp4|mov|avi|webm)$/i)) return "video";
  return "file";
}

module.exports = { saveChannelToForum };
