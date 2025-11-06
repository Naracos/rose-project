const { MessageType } = require('discord.js');

/**
 * Supprime les messages système "a épinglé un message" du thread
 * Attend quelques secondes pour s'assurer que tous les messages système sont créés
 */
async function cleanPinMessages(thread) {
  try {
    // Attendre que les messages système soient créés
    await new Promise(resolve => setTimeout(resolve, 2500));

    const messages = await thread.messages.fetch({ limit: 100 }).catch(() => new Map());
    if (!messages || messages.size === 0) {
      console.log('⚠️ Aucun message à nettoyer');
      return;
    }

    let deletedCount = 0;
    for (const msg of messages.values()) {
      // Log pour déboguer
      if (msg.system) {
        console.log(`[DEBUG] Message système trouvé - type: ${msg.type}, content: "${msg.content?.slice(0, 50)}"`);
      }

      // Vérifier si c'est un message système d'épinglage
      // Chercher "epinglé" ou "pinned" dans le contenu ou type MessageType.CHANNEL_PINNED_MESSAGE
      if (msg.system && (msg.type === MessageType.ChannelPinnedMessage || msg.type === 'ChannelPinnedMessage' || msg.content?.includes('épinglé') || msg.content?.includes('pinned'))) {
        try {
          await msg.delete();
          console.log(`✅ Message d'épinglage supprimé: ${msg.id}`);
          deletedCount++;
        } catch (err) {
          console.error('Erreur suppression message d\'épinglage:', err.message);
        }
      }
    }
    console.log(`🗑️ Total messages d'épinglage supprimés: ${deletedCount}`);
  } catch (err) {
    console.error('Erreur cleanPinMessages:', err);
  }
}

module.exports = { cleanPinMessages };