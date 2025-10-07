// bot/src/utils/messageFetcher.js
const { Collection } = require('discord.js');

/**
 * Récupère TOUS les messages d'un salon, même ceux avant le démarrage du bot
 * @param {TextChannel} channel - Le salon Discord
 * @param {number} [limit=Infinity] - Nombre max de messages à récupérer
 * @returns {Promise<Collection<string, Message>>} - Collection de messages
 */
async function fetchAllMessages(channel, limit = Infinity) {
  let messages = new Collection();
  let lastMessageId;
  let fetchCount = 0;
  const maxPerFetch = 100; // Limite imposée par Discord

  while (messages.size < limit) {
    const options = { limit: maxPerFetch };
    if (lastMessageId) options.before = lastMessageId;

    const fetchedMessages = await channel.messages.fetch(options);
    if (fetchedMessages.size === 0) break; // Plus de messages à récupérer

    fetchedMessages.forEach(msg => messages.set(msg.id, msg));
    lastMessageId = fetchedMessages.last().id;
    fetchCount++;

    // Respecte les limites de l'API (5 requêtes par seconde max)
    if (fetchCount % 5 === 0) await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return messages;
}

module.exports = { fetchAllMessages };
