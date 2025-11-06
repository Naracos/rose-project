const api = require('../../../services/apiClient');
const logAction = require('../../../utils/actionLogger');
const { setCooldown } = require('../../../utils/pingParticipantsCooldown');

module.exports = {
  customId: 'confirm_ping_',
  async execute(interaction) {
    try {
      const sortieId = interaction.customId.replace('confirm_ping_', '');
      console.log(`[DEBUG] Confirmation ping pour sortie: ${sortieId}`);

      // Récupérer la sortie
      let sortie;
      try {
        sortie = await api.getSortieById(sortieId);
      } catch (err) {
        console.error('Erreur fetch sortie:', err.message);
        return await interaction.update({ 
          content: '❌ Sortie introuvable.', 
          embeds: [],
          components: [],
          flags: 64
        }).catch(() => {});
      }

      // Vérifier organisateur
      if (interaction.user.id !== sortie.organizerId) {
        return await interaction.update({ 
          content: '❌ Seul l\'organisateur peut confirmer.', 
          embeds: [],
          components: [],
          flags: 64
        }).catch(() => {});
      }

      // Vérifier participants
      if (!sortie.participants || sortie.participants.length === 0) {
        return await interaction.update({ 
          content: '❌ Aucun participant à notifier.', 
          embeds: [],
          components: [],
          flags: 64
        }).catch(() => {});
      }

      // Envoyer le ping dans le channel (pas ephemeral)
      const mentions = sortie.participants.map(id => `<@${id}>`).join(' ');
      await interaction.channel.send({
        content: `📢 Participants (${sortie.participants.length}) :\n${mentions}`,
        allowedMentions: { users: sortie.participants }
      });

      // Mettre à jour le message de confirmation
      await interaction.update({
        content: '✅ Ping envoyé avec succès !',
        embeds: [],
        components: []
      });

      // Enregistrer le cooldown
      setCooldown(sortieId);
      setCooldown(`msg_${sortie.messageId}`);

      console.log(`[DEBUG] ✅ Ping confirmé et envoyé: sortie=${sortieId}, count=${sortie.participants.length}`);

      await logAction(interaction.client, 'Ping participants confirmé', interaction.user, {
        sortieId: sortieId,
        count: sortie.participants.length
      });
    } catch (err) {
      console.error('Erreur ConfirmPing button:', err);
      try {
        await interaction.update({ 
          content: '❌ Une erreur est survenue.', 
          embeds: [],
          components: []
        }).catch(() => {});
      } catch (e) {
        console.error('Erreur update fallback:', e.message);
      }
    }
  }
};