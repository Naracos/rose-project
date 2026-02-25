const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { updateParticipantsList } = require('../handlers/reactions/sortieParticipants');
const { EMOJI_ACCEPT, EMOJI_DECLINE } = require('../../RGPD/config');
const { setPendingMessage, TIMEOUT_MS } = require('../utils/rgpdPendingMessages');
const { getCurrentStatus, hasActiveConsent } = require('../utils/rgpdConsentManager');

// Lire l'ID du message RGPD en live (le /rgpd setup peut le mettre à jour dans process.env)
const getRgpdMessageId = () => process.env.RGPD_MESSAGE_ID;

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        // Recharger les variables au cas où le setup a changé l'ID message
        require('dotenv').config({ override: true });

        if (reaction.partial) await reaction.fetch();
        let message = reaction.message;
        if (message.partial) message = await message.fetch();

        // Ignorer les bots
        if (user.bot) return;

        // ─── Gestion RGPD ────────────────────────────────────────────
        const rgpdMsgId = getRgpdMessageId();
        if (rgpdMsgId && message.id === rgpdMsgId) {
            const emoji = reaction.emoji.name;
            if (emoji !== EMOJI_ACCEPT && emoji !== EMOJI_DECLINE) return;

            const currentStatus = getCurrentStatus(user.id);

            // ── Bloquer les actions redondantes pour éviter le spam DM ──
            if (emoji === EMOJI_ACCEPT && currentStatus === 'accepted') {
                console.log(`[RGPD] ${user.username} a déjà un consentement actif, ignore ✅`);
                return;
            }
            if (emoji === EMOJI_DECLINE && (currentStatus === 'declined' || currentStatus === 'revoked')) {
                console.log(`[RGPD] ${user.username} a déjà refusé/révoqué, ignore ❌`);
                return;
            }

            // ── Réaction exclusive : retire l'emoji opposé si présent ──
            const oppositeEmoji = emoji === EMOJI_ACCEPT ? EMOJI_DECLINE : EMOJI_ACCEPT;
            const oppositeReaction = message.reactions.cache.get(oppositeEmoji);
            if (oppositeReaction) {
                oppositeReaction.users.remove(user.id).catch(() => { });
            }

            // ── Construire le bouton de confirmation approprié ──
            let row;
            let dmContent;

            if (emoji === EMOJI_ACCEPT) {
                row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('rgpd_accept_confirm')
                        .setLabel('✅ Confirmer mon accord')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('rgpd_cancel_confirm')
                        .setLabel('Annuler')
                        .setStyle(ButtonStyle.Secondary)
                );
                const timeoutMin = Math.round(TIMEOUT_MS / 60000);
                dmContent =
                    `> 📸 **Droit à l'image — Dionysos Bordeaux**\n\n` +
                    `Tu es sur le point d'**accepter** le droit à l'image.\n` +
                    `Un PDF signé électroniquement te sera envoyé en message privé.\n\n` +
                    `✅ Confirme ton choix ci-dessous.\n` +
                    `⏱️ *Ce message se supprimera automatiquement dans ${timeoutMin} minutes.*`;
            } else {
                row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('rgpd_decline_confirm')
                        .setLabel('❌ Confirmer mon refus / révocation')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('rgpd_cancel_confirm')
                        .setLabel('Annuler')
                        .setStyle(ButtonStyle.Secondary)
                );
                const timeoutMin = Math.round(TIMEOUT_MS / 60000);
                dmContent =
                    `> 📸 **Droit à l'image — Dionysos Bordeaux**\n\n` +
                    `Tu es sur le point de **refuser ou révoquer** le droit à l'image.\n\n` +
                    `❌ Confirme ton choix ci-dessous.\n` +
                    `⏱️ *Ce message se supprimera automatiquement dans ${timeoutMin} minutes.*`;
            }

            // ── Envoyer le DM de confirmation (avec gestion anti-spam) ──
            try {
                const dmUser = await reaction.client.users.fetch(user.id);
                const dmMessage = await dmUser.send({ content: dmContent, components: [row] });
                // Enregistrer le message (annule et remplace l'éventuel précédent)
                await setPendingMessage(user.id, dmMessage);
                console.log(`[RGPD] DM de confirmation envoyé à ${user.username} (${emoji})`);
            } catch (e) {
                console.warn('[RGPD] Impossible d\'envoyer DM à', user.username, ':', e.message);
                // Fallback : message temporaire dans le salon (15 s)
                try {
                    const ch = await reaction.client.channels.fetch(message.channelId).catch(() => null);
                    if (ch?.isTextBased()) {
                        const tmpMsg = await ch.send({
                            content: `<@${user.id}> Active tes messages privés pour confirmer ton choix RGPD.`,
                        });
                        setTimeout(() => tmpMsg.delete().catch(() => { }), 15000);
                    }
                } catch (_) { }
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
            console.error('Erreur updateParticipants (add):', e);
        }
    }
};