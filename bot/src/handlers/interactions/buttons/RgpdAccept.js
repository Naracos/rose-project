const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { generateRgpdPdf, generateFusedRgpdPdf } = require('../../../utils/generateRgpdPdf');
const { recordConsent, hasActiveConsent } = require('../../../utils/rgpdConsentManager');
const { clearPendingMessage } = require('../../../utils/rgpdPendingMessages');
const { DM_ACCEPT } = require('../../../../RGPD/config');

module.exports = {
    customId: 'rgpd_accept_confirm',
    async execute(interaction) {
        // Recharger les variables d'environnement au cas où le .env a été modifié
        require('dotenv').config({ override: true });

        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ flags: 64 });
            }

            const user = interaction.user;
            const acceptedAt = new Date();

            // 0. Vérifier si déjà accepté pour éviter les doublons
            if (hasActiveConsent(user.id)) {
                await clearPendingMessage(user.id);
                return interaction.editReply('✅ Tu as déjà validé ton consentement ! Inutile de recommencer. 😊');
            }

            // 1. Supprimer le message DM de confirmation (avec les boutons)
            await clearPendingMessage(user.id);

            // 2. Générer les PDFs
            let sigPath;     // Signature seule (pour les logs)
            let fusedPath;   // Signature + Document de base (pour le membre)

            try {
                // On génère d'abord la signature seule
                sigPath = await generateRgpdPdf(user.id, user.username, acceptedAt);
                // Puis la version fusionnée pour l'utilisateur
                fusedPath = await generateFusedRgpdPdf(user.id, user.username, acceptedAt);
            } catch (pdfErr) {
                console.error('[RGPD] Erreur génération PDF :', pdfErr);
                return interaction.editReply('❌ Erreur lors de la génération du PDF. Contacte un admin.');
            }

            // 3. Enregistrer dans consent_log.json
            const sigFilename = require('path').basename(sigPath);
            recordConsent(user.id, user.username, 'accepted', sigFilename);

            // 4. Envoyer le PDF fusionné en DM
            try {
                const dmChannel = await user.createDM();
                const fusedFilename = require('path').basename(fusedPath);
                const attachment = new AttachmentBuilder(fusedPath, { name: fusedFilename });
                await dmChannel.send({
                    content: DM_ACCEPT(user.username),
                    files: [attachment],
                });
            } catch (dmErr) {
                console.warn('[RGPD] Impossible d\'envoyer le PDF en DM à', user.username, ':', dmErr.message);
            }

            // 5. Logger dans le salon de log (signature seule, pas besoin de la fusion ici)
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
                            .setTitle('✅ Nouveau consentement — Droit à l\'image')
                            .setColor(0x57F287)
                            .addFields(
                                { name: '👤 Utilisateur', value: `<@${user.id}> — \`${user.username}\``, inline: true },
                                { name: '🆔 ID Discord', value: `\`${user.id}\``, inline: true },
                                { name: '📅 Date', value: `<t:${Math.floor(acceptedAt.getTime() / 1000)}:F>`, inline: false },
                                { name: '📄 Signature', value: `\`${sigFilename}\``, inline: false },
                            )
                            .setFooter({ text: 'RGPD • Droit à l\'image — Dionysos Bordeaux' })
                            .setTimestamp(acceptedAt);

                        const logAttachment = new AttachmentBuilder(sigPath, { name: sigFilename });
                        await logChannel.send({ embeds: [embed], files: [logAttachment] });
                        console.log(`[RGPD] ✅ Log acceptation envoyé pour ${user.username} dans #${logChannel.name}`);
                    } else {
                        console.error(`[RGPD] ❌ Salon de log introuvable ou inaccessible (ID: ${logChannelId})`);
                    }
                } catch (logErr) {
                    console.error('[RGPD] Erreur critique envoi log acceptation:', logErr);
                }
            }

            // 6. Confirmer à l'utilisateur
            await interaction.editReply(
                '✅ **Accord enregistré !** Tu vas recevoir ton PDF signé en message privé.\n' +
                'Merci pour ta confiance. Tu peux retirer ton accord à tout moment. 🍇'
            );

        } catch (err) {
            console.error('[RGPD] Erreur RgpdAccept:', err);
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
