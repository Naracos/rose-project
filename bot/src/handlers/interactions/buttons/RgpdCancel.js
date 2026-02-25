const { clearPendingMessage } = require('../../../utils/rgpdPendingMessages');

module.exports = {
    customId: 'rgpd_cancel_confirm',
    async execute(interaction) {
        try {
            // Supprimer le message DM de confirmation (avec les boutons)
            await clearPendingMessage(interaction.user.id);

            // Acquitter l'interaction (Discord exige une réponse)
            await interaction.reply({
                content: '↩️ **Action annulée.** Ton choix reste inchangé.',
                flags: 64,
            });
        } catch (err) {
            console.error('[RGPD] Erreur RgpdCancel:', err);
            try {
                await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
            } catch (_) { }
        }
    },
};
