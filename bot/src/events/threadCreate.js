// c:\Users\enzob\Desktop\Projet-perso\rose\events\threadCreate.js
const { Events, EmbedBuilder } = require('discord.js');
const { logError } = require('../utils/logError');
const logAction = require('../utils/actionLogger');
const { cleanPinMessages } = require('../utils/cleanPinMessages');
const { buildParticipantsEmbed } = require('../handlers/reactions/sortieParticipants');
const api = require('../services/apiClient');

/**
 * Event threadCreate
 * - épingle le message initial du thread
 * - envoie MP à l'organisateur (SORTIES_PONCTUELLES uniquement)
 * - crée un embed tableau des participants dans le thread (SORTIES_PONCTUELLES uniquement)
 * - épingle cet embed
 * - supprime les messages système d'épinglage
 */
module.exports = {
  name: 'threadCreate',
  async execute(thread) {
    try {
      const isPonctuelle = thread.parentId === process.env.SORTIES_PONCTUELLES_ID;
      const isRecurrente = thread.parentId === process.env.SORTIES_RECURRENTES_ID;

      // Épinglage automatique pour les deux forums
      if (isPonctuelle || isRecurrente) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const starterMessage = await thread.fetchStarterMessage().catch(() => null);

        if (starterMessage) {
          // Épingler le message initial
          await starterMessage.pin().catch(err => {
            console.error('Erreur épinglage message initial:', err);
          });
          console.log(`✅ Message épinglé dans le thread ${thread.name}`);
        } else {
          console.log(`⚠️ Impossible de trouver le message initial pour le thread ${thread.name}`);
        }

        // Nettoyer les messages système d'épinglage (pour les deux forums)
        await cleanPinMessages(thread);
      }

      // Gestion spécifique des sorties PONCTUELLES uniquement
      if (isPonctuelle) {
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

        // Ajouter la réaction ✅
        await starterMessage.react('✅').catch(async (err) => {
          await logAction(thread.client, 'Impossible d\'ajouter la réaction ✅', null, {
            threadId: thread.id,
            error: err.message
          });
        });

        // Créer la sortie via l'API
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

        const sortie = await api.createSortie(payload);
        console.log('✅ Sortie créée via API id=', sortie._id || sortie.id);

        // Envoyer MP à l'organisateur
        const organizerId = payload.organizerId;
        if (organizerId) {
          try {
            const user = await thread.client.users.fetch(organizerId).catch(() => null);
            if (user) {
              const dm = await user.createDM();
              const initialContent = `🎉 **Nouvelle sortie créée !**\nJe suivrai les participants de votre sortie "https://discord.com/channels/${thread.guildId}/${thread.id}".\n\nLa liste sera mise à jour automatiquement à chaque nouvelle réaction ✅.`;
              const dmMsg = await dm.send({ content: initialContent });

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
            console.error('Erreur envoi MP organisateur :', e);
          }
        }

        // Créer et envoyer le tableau des participants dans le thread
        try {
          // Utiliser buildParticipantsEmbed avec sortieUrl du thread
          const participantEmbed = buildParticipantsEmbed({ 
            title, 
            sortieUrl: thread.url 
          }, []);

          const tableMsg = await thread.send({ embeds: [participantEmbed] });

          // Épingler le tableau
          await tableMsg.pin().catch(err => {
            console.error('Erreur épinglage tableau:', err);
          });

          const sortieId = sortie._id || sortie.id;
          if (sortieId) {
            // Sauvegarder tableMessageId, tableChannelId ET sortieUrl
            await api.updateSortie(sortieId, {
              tableMessageId: tableMsg.id,
              tableChannelId: thread.id,
              sortieUrl: thread.url
            }).catch(err => {
              console.error('Erreur sauvegarde tableau message dans l\'API:', err);
            });
          }

          await logAction(thread.client, 'Tableau des participants créé et épinglé', organizer, {
            threadId: thread.id,
            tableMessageId: tableMsg.id
          });

          // Nettoyer les nouveaux messages d'épinglage (tableau)
          await cleanPinMessages(thread);
        } catch (err) {
          console.error('Erreur création tableau participants:', err);
        }
      }
    } catch (error) {
      console.error('Erreur lors du traitement du thread :', error);
      await logError(thread.client, 'Erreur lors du traitement du thread', null, error);
      await logAction(thread.client, 'Erreur lors de la création d\'une sortie', null, {
        threadId: thread.id,
        error: error.message
      });
    }
  }
};