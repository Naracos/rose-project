// c:\Users\enzob\Desktop\Projet-perso\rose\events\threadCreate.js
const { Events } = require('discord.js');
const { logError } = require('../utils/logError');
const logAction = require('../utils/actionLogger');
const api = require('../services/apiClient');

module.exports = {
  name: 'threadCreate',
  async execute(thread) {
    try {
      // Épinglage automatique pour les forums spécifiques
      if (thread.parentId === process.env.SORTIES_PONCTUELLES_ID || thread.parentId === process.env.SORTIES_RECURRENTES_ID) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const starterMessage = await thread.fetchStarterMessage().catch(() => null);
        if (starterMessage) {
          await starterMessage.pin().catch(() => {});
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

        // Ajouter automatiquement la réaction ✅ au message initial
        await starterMessage.react('✅').catch(async (err) => {
          await logAction(thread.client, 'Impossible d\'ajouter la réaction ✅', null, {
            threadId: thread.id,
            error: err.message
          });
        });

        const channelId = thread.parentId || null;
        let channelName = thread.parent?.name || null;
        if (!channelName && channelId) {
          const ch = await thread.client.channels.fetch(channelId).catch(() => null);
          channelName = ch?.name || null;
        }

        const title = thread.name || (starterMessage?.content?.slice(0, 200)) || 'sortie';
        const payload = {
          messageId: starterMessage?.id || null,
          threadId: thread.id,
          channelId,
          channelName,
          guildId: thread.guildId,
          organizerId: thread.ownerId || starterMessage?.author?.id,
          title
        };

        // Création via API externe
        const sortie = await api.createSortie(payload);
        console.log('Sortie créée via API id=', sortie._id || sortie.id);

        // Envoi UN SEUL MP initial à l'organisateur et stockage du message DM côté API
        const organizerId = payload.organizerId;
        if (organizerId) {
          try {
            const user = await thread.client.users.fetch(organizerId).catch(() => null);
            if (user) {
              const dm = await user.createDM();
              const content = `🎉 **Sortie créée !**\nJe suivrai les participants de votre sortie "https://discord.com/channels/${thread.guildId}/${thread.id}".\n\n*La liste sera mise à jour automatiquement à chaque nouvelle réaction ✅.*`;
              const dmMsg = await dm.send({ content });

              // sauvegarde l'id du message DM et du channel DM côté API
              const sortieId = sortie._id || sortie.id;
              if (sortieId) {
                await api.updateSortie(sortieId, {
                  organizerDmMessageId: dmMsg.id,
                  organizerDmChannelId: dm.id
                }).catch(err => {
                  console.error('Erreur sauvegarde organizer DM dans l\'API:', err);
                });
              }

              await logAction(thread.client, 'MP initial envoyé à l\'organisateur', organizer, {
                threadId: thread.id,
                dmMessageId: dmMsg.id
              });
            }
          } catch (e) {
            console.error('Impossible d’envoyer le MP organisateur :', e);
          }
        }
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