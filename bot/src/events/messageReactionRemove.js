const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { updateParticipantsList } = require('../handlers/reactions/sortieParticipants');
const { EMOJI_ACCEPT } = require('../../RGPD/config');
const { setPendingMessage, TIMEOUT_MS } = require('../utils/rgpdPendingMessages');
const { hasActiveConsent } = require('../utils/rgpdConsentManager');

const getRgpdMessageId = () => process.env.RGPD_MESSAGE_ID;

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user) {
    if (reaction.partial) await reaction.fetch();
    let message = reaction.message;
    if (message.partial) message = await message.fetch();

    // Ignorer les bots
    if (user.bot) return;

    // ─── Gestion RGPD : retrait de ✅ = possible révocation ──────
    const rgpdMsgId = getRgpdMessageId();
    if (rgpdMsgId && message.id === rgpdMsgId) {
      // Seul le retrait de ✅ déclenche une demande de révocation
      if (reaction.emoji.name === EMOJI_ACCEPT) {
        // Ne déclencher que si l'utilisateur a un consentement ACTIF
        if (!hasActiveConsent(user.id)) {
          console.log(`[RGPD] ${user.username} n'a pas de consentement actif, ignore retrait ✅`);
          return;
        }
        const timeoutMin = Math.round(TIMEOUT_MS / 60000);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('rgpd_decline_confirm')
            .setLabel('❌ Confirmer la révocation')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('rgpd_cancel_confirm')
            .setLabel('Annuler — je maintiens mon accord')
            .setStyle(ButtonStyle.Secondary)
        );
        try {
          const dmUser = await reaction.client.users.fetch(user.id);
          const dmMessage = await dmUser.send({
            content:
              `> 📸 **Droit à l'image — Dionysos Bordeaux**\n\n` +
              `Tu viens de retirer ta réaction ✅.\n` +
              `Souhaites-tu **révoquer** ton consentement au droit à l'image ?\n\n` +
              `⏱️ *Ce message se supprimera automatiquement dans ${timeoutMin} minutes.*`,
            components: [row],
          });
          await setPendingMessage(user.id, dmMessage);
          console.log(`[RGPD] DM de révocation envoyé à ${user.username}`);
        } catch (e) {
          console.warn('[RGPD] Impossible d\'envoyer DM révocation à', user.username, ':', e.message);
        }
      }

      return; // Ne pas déclencher la logique sorties
    }
    // ─────────────────────────────────────────────────────────────

    if (reaction.emoji?.name !== '✅') return;

    const channel = await reaction.client.channels.fetch(message.channelId).catch(() => null);
    if (!channel?.isThread?.()) return;

    const starter = await channel.fetchStarterMessage().catch(() => null);
    if (!starter || starter.id !== message.id) return;

    try {
      await updateParticipantsList(starter);
    } catch (e) {
      console.error('Erreur updateParticipants (remove):', e);
    }
  }
};