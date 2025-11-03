// c:\Users\enzob\Desktop\Projet-perso\rose\events\threadCreate.js
const { Events } = require('discord.js');
const { logError } = require('../utils/logError');
const logAction = require('../utils/actionLogger');

module.exports = {
  name: Events.ThreadCreate,
  async execute(thread) {
    try {
      // Épinglage automatique pour les forums spécifiques
      if (thread.parentId === process.env.SORTIES_PONCTUELLES_ID || thread.parentId === process.env.SORTIES_RECURRENTES_ID) {
        // Pour les posts de forum, le message de démarrage peut prendre un instant pour être disponible
        await new Promise(resolve => setTimeout(resolve, 1000));
        const starterMessage = await thread.fetchStarterMessage().catch(() => null);

        if (starterMessage) {
          await starterMessage.pin();
          console.log(`Message épinglé dans le thread ${thread.name}`);
        } else {
          console.log(`Impossible de trouver le message initial pour le thread ${thread.name}`);
        }
      }

      // Gestion des sorties
      if (thread.parentId === process.env.SORTIES_PONCTUELLES_ID) {
        const starterMessage = await thread.fetchStarterMessage().catch(() => null);
        if (!starterMessage) {
          await logAction(thread.client, 'Message initial de sortie introuvable', null, { threadId: thread.id });
          return;
        }

        const organizer = starterMessage.author;
        if (!organizer) {
          await logAction(thread.client, 'Organisateur introuvable', null, { threadId: thread.id });
          return;
        }

        // Envoyer le message initial à l'organisateur
        const dmMessage = await organizer.send({
          content: `🎉 **Nouvelle sortie créée !**\nJe suivrai les participants de votre sortie "${thread.name}".\n\n**Liste des participants :** *(vide pour le moment)*\n\nLa liste sera mise à jour automatiquement à chaque nouvelle réaction ✅.`
        }).catch(async (err) => {
          await logAction(thread.client, 'Impossible d\'envoyer le MP initial à l\'organisateur', organizer, {
            threadId: thread.id,
            error: err.message
          });
          return null;
        });

        if (dmMessage) {
          await logAction(thread.client, 'MP initial envoyé à l\'organisateur', organizer, {
            threadId: thread.id,
            dmMessageId: dmMessage.id
          });
        }

        // Ajouter automatiquement la réaction ✅ au message initial
        await starterMessage.react('✅').catch(async (err) => {
          await logAction(thread.client, 'Impossible d\'ajouter la réaction ✅', null, {
            threadId: thread.id,
            error: err.message
          });
        });
      }
    } catch (error) {
      console.error("Erreur lors du traitement du thread :", error);
      await logError(thread.client, "Erreur lors du traitement du thread", null, error);
      await logAction(thread.client, 'Erreur lors de la création d\'une sortie', null, {
        threadId: thread.id,
        error: error.message
      });
    }
  },
};