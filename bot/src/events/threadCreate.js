// c:\Users\enzob\Desktop\Projet-perso\rose\events\threadCreate.js
const { Events } = require('discord.js');
const { logError } = require('../utils/logError');

module.exports = {
  name: Events.ThreadCreate,
  async execute(thread) {
    if (thread.parentId === '1387810514112876604' ||thread.parentId ===  '1423293659318714533') {
      try {
        // Pour les posts de forum, le message de démarrage peut prendre un instant pour être disponible
        await new Promise(resolve => setTimeout(resolve, 1000));
        const starterMessage = await thread.fetchStarterMessage().catch(() => null);

        if (starterMessage) {
          await starterMessage.pin();
          console.log(`Message épinglé dans le thread ${thread.name}`);
        } else {
          console.log(`Impossible de trouver le message initial pour le thread ${thread.name}`);
        }
      } catch (error) {
        console.error("Erreur lors de l'épinglage du message :", error);
        await logError(thread.client, "Erreur lors de l'épinglage du message", null, error);
      }
    }
  },
};