const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const api = require('../../../services/apiClient');
const { checkCooldown } = require('../../../utils/pingParticipantsCooldown');

module.exports = {
  customId: 'ping_participants_',
  async execute(interaction) {
    try {
      // Extraire l'ID de la sortie depuis customId
      const sortieId = interaction.customId.replace('ping_participants_', '');
      console.log(`[DEBUG] Bouton Ping Participants cliqué pour sortie: ${sortieId}`);

      // Vérifier cooldown AVANT d'appeler l'API
      const remaining = checkCooldown(sortieId);
      if (remaining !== null) {
        console.log(`[DEBUG] Cooldown actif: ${remaining}s restantes`);
        return await interaction.reply({ 
          content: `⏳ Cooldown actif. Réessaye dans ${remaining}s.`, 
          flags: 64
        }).catch(() => {});
      }

      // Récupérer la sortie via l'API
      let sortie;
      try {
        sortie = await api.getSortieById(sortieId);
      } catch (err) {
        console.error('Erreur fetch sortie:', err.message);
        return await interaction.reply({ 
          content: '❌ Sortie introuvable.', 
          flags: 64
        }).catch(() => {});
      }

      if (!sortie) {
        return await interaction.reply({ 
          content: '❌ Sortie introuvable.', 
          flags: 64
        }).catch(() => {});
      }

      // Vérifier que l'utilisateur est l'organisateur
      if (interaction.user.id !== sortie.organizerId) {
        console.log(`[DEBUG] Accès refusé: user=${interaction.user.id}, org=${sortie.organizerId}`);
        return await interaction.reply({ 
          content: '❌ Seul l\'organisateur peut utiliser ce bouton.', 
          flags: 64
        }).catch(() => {});
      }

      // Vérifier qu'il y a des participants
      if (!sortie.participants || sortie.participants.length === 0) {
        console.log(`[DEBUG] Aucun participant pour sortie ${sortieId}`);
        return await interaction.reply({ 
          content: '❌ Aucun participant à notifier.', 
          flags: 64
        }).catch(() => {});
      }

      // Construire l'aperçu des participants
      const mentions = sortie.participants.map(id => `<@${id}>`).join(', ');

      const embed = new EmbedBuilder()
        .setColor(0x00AEFF)
        .setTitle('📢 Aperçu du ping participants')
        .setDescription(`**${sortie.participants.length} participant(s) seront notifié(s) :**\n\n${mentions}`)
        .setFooter({ text: 'Confirme pour envoyer le ping dans le thread' })
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`confirm_ping_${sortieId}`)
            .setLabel('✅ Confirmer')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`cancel_ping_${sortieId}`)
            .setLabel('❌ Annuler')
            .setStyle(ButtonStyle.Danger)
        );

      await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: 64
      });

      console.log(`[DEBUG] Aperçu ping envoyé pour sortie ${sortieId}`);
    } catch (err) {
      console.error('Erreur PingParticipants button:', err);
      try {
        await interaction.reply({ 
          content: '❌ Une erreur est survenue.', 
          flags: 64
        }).catch(() => {});
      } catch (e) {
        console.error('Erreur reply fallback:', e.message);
      }
    }
  }
};