// bot/src/utils/forumSaver.js
const { fetchAllMessages } = require('./messageFetcher');
const { MessageType } = require('discord.js');

// bot/src/utils/forumSaver.js
const axios = require('axios');

async function saveChannelToForum(sourceChannel, title) {
  try {
    // 1. Récupère les 100 derniers messages (ajustable)
    const messages = await sourceChannel.messages.fetch({ limit: 100 });
    const sortedMessages = [...messages.values()]
      .filter(msg => !msg.author.bot)
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    // 2. Formate les données pour l'API
    const payload = {
      channelId: sourceChannel.id,
      channelName: sourceChannel.name,
      title,
      messages: await Promise.all(sortedMessages.map(async msg => {
        const reactions = await Promise.all(
          [...msg.reactions.cache.values()].map(async reaction => ({
            emoji: reaction.emoji.name,
            count: reaction.count,
            users: (await reaction.users.fetch()).map(user => user.id)
          }))
        );

        return {
          id: msg.id,
          author: {
            id: msg.author.id,
            username: msg.author.username,
            discriminator: msg.author.discriminator,
            avatar: msg.author.displayAvatarURL({ dynamic: true })
          },
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
          reactions,
          attachments: msg.attachments.map(attach => ({
            url: attach.proxyURL,
            name: attach.name,
            type: getAttachmentType(attach.url)
          }))
        };
      }))
    };

    // 3. Envoie les données à l'API
    const API_URL = process.env.API_URL || 'http://localhost:3000';
    const response = await axios.post(`${API_URL}/sorties`, payload);

    return `✅ Sortie enregistrée via l'API. [ID: ${response.data._id}]`;
  } catch (error) {
    console.error("Erreur API:", error.response?.data || error.message);
    throw new Error(`Impossible d'enregistrer: ${error.message}`);
  }
}

function getAttachmentType(url) {
  if (url.match(/\.(jpeg|jpg|gif|png)$/i)) return "image";
  if (url.match(/\.(mp4|mov|avi|webm)$/i)) return "video";
  return "file";
}

module.exports = { saveChannelToForum };
