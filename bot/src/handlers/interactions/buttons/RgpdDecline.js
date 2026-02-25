const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getCurrentStatus, hasActiveConsent, recordConsent } = require('../../../utils/rgpdConsentManager');
const { generateRgpdRevokePdf } = require('../../../utils/generateRgpdPdf');
const { clearPendingMessage } = require('../../../utils/rgpdPendingMessages');
const { DM_DECLINE, DM_REVOKE } = require('../../../../RGPD/config');


module.exports = {
    customId: 'rgpd_decline_confirm',
    async execute(interaction) {
        // Recharger les variables d'environnement au cas où le .env a été modifié
        require('dotenv').config({ override: true });

        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ flags: 64 });
            }

            const user = interaction.user;
            const currentStatus = getCurrentStatus(user.id);
            const wasAccepted = (currentStatus === 'accepted');

            // 0. Vérifier si déjà refusé/révoqué pour éviter les doublons
            if (currentStatus === 'declined' || currentStatus === 'revoked') {
                await clearPendingMessage(user.id);
                return interaction.editReply('❌ Ton refus est déjà enregistré ! Inutile de recommencer. 😊');
            }

            // 1. Supprimer le message DM de confirmation (avec les boutons)
            await clearPendingMessage(user.id);

            // 2. Enregistrer refus ou révocation
            const status = wasAccepted ? 'revoked' : 'declined';
            const actionAt = new Date();

            // 3. Générer le PDF de révocation (si c'était une révocation)
            let revokePdfPath = null;
            if (wasAccepted) {
                try {
                    revokePdfPath = await generateRgpdRevokePdf(user.id, user.username, actionAt);
                    const pdfFilename = require('path').basename(revokePdfPath);
                    recordConsent(user.id, user.username, status, pdfFilename);
                } catch (pdfErr) {
                    console.error('[RGPD] Erreur génération PDF révocation :', pdfErr);
                    recordConsent(user.id, user.username, status);
                }
            } else {
                recordConsent(user.id, user.username, status);
            }

            // 4. Envoyer DM adapté (avec PDF si révocation)
            try {
                const dmChannel = await user.createDM();
                const dmContent = wasAccepted ? DM_REVOKE() : DM_DECLINE();

                if (wasAccepted && revokePdfPath) {
                    const pdfFilename = require('path').basename(revokePdfPath);
                    const attachment = new AttachmentBuilder(revokePdfPath, { name: pdfFilename });
                    await dmChannel.send({ content: dmContent, files: [attachment] });
                } else {
                    await dmChannel.send({ content: dmContent });
                }
            } catch (dmErr) {
                console.warn('[RGPD] Impossible d\'envoyer le DM à', user.username, ':', dmErr.message);
            }

            // 5. Logger dans le salon de log
            const logChannelId = (process.env.RGPD_LOG_CHANNEL_ID || '').trim();
            if (!logChannelId) {
                console.warn('[RGPD] ⚠️ RGPD_LOG_CHANNEL_ID non configuré dans .env — log ignoré.');
            } else {
                console.log(`[RGPD] Tentative de log dans le salon : ${logChannelId}`);
                try {
                    const logChannel = await interaction.client.channels.fetch(logChannelId).catch(err => {
                        console.error(`[RGPD] Erreur fetch salon log (${logChannelId}) :`, err.message);
                        return null;
                    });

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle(wasAccepted ? '🔄 Révocation de consentement — Droit à l\'image' : '❌ Refus de consentement — Droit à l\'image')
                            .setColor(wasAccepted ? 0xFEE75C : 0xED4245)
                            .addFields(
                                { name: '👤 Utilisateur', value: `<@${user.id}> — \`${user.username}\``, inline: true },
                                { name: '🆔 ID Discord', value: `\`${user.id}\``, inline: true },
                                { name: '📅 Date', value: `<t:${Math.floor(actionAt.getTime() / 1000)}:F>`, inline: false },
                                { name: 'ℹ️ Statut', value: wasAccepted ? 'Consentement **révoqué**' : 'Consentement **refusé**', inline: false },
                            )
                            .setFooter({ text: 'RGPD • Droit à l\'image — Dionysos Bordeaux' })
                            .setTimestamp(actionAt);

                        if (revokePdfPath) {
                            const pdfFilename = require('path').basename(revokePdfPath);
                            const attachment = new AttachmentBuilder(revokePdfPath, { name: pdfFilename });
                            await logChannel.send({ embeds: [embed], files: [attachment] });
                        } else {
                            await logChannel.send({ embeds: [embed] });
                        }
                        console.log(`[RGPD] ${wasAccepted ? '🔄 Révocation' : '❌ Refus'} log envoyé pour ${user.username} dans #${logChannel.name}`);
                    } else {
                        console.error(`[RGPD] ❌ Salon de log introuvable ou inaccessible (ID: ${logChannelId})`);
                    }
                } catch (logErr) {
                    console.error('[RGPD] Erreur critique envoi log:', logErr);
                }
            }

            // 6. Confirmer à l'utilisateur
            const replyContent = wasAccepted
                ? '🔄 **Révocation enregistrée.** Tu ne fais plus partie du droit à l\'image. Un PDF de confirmation t\'a été envoyé en DM.'
                : '✅ **Refus enregistré.** Aucun contenu te concernant ne sera publié. Tu peux changer d\'avis à tout moment.';

            await interaction.editReply({ content: replyContent });

        } catch (err) {
            console.error('[RGPD] Erreur RgpdDecline:', err);
            try {
                if (interaction.deferred) {
                    await interaction.editReply('❌ Une erreur est survenue.');
                } else {
                    await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
                }
            } catch (_) { }
        }
    },
};
