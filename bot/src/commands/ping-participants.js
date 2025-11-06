// bot/src/commands/ping-participants.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { logError } = require('../utils/logError');
const api = require('../services/apiClient');
const { checkCooldown } = require('../utils/pingParticipantsCooldown');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping-participants')
    .setDescription('Mentionne tous les membres ayant cliqué sur la réaction ✅ d\'un post de sortie.')
    .addStringOption(opt =>
      opt.setName('message')
        .setDescription('ID du message ou lien (optionnel).')
        .setRequired(false)
    ),
  async execute(interaction) {
    try {
      console.log(`[DEBUG] Exécution de la commande : ping-participants par ${interaction.user.username}`);

      // Vérifier que c'est utilisé dans un thread
      if (!interaction.channel?.isThread?.()) {
        console.log(`[DEBUG] Commande utilisée hors thread`);
        return await interaction.reply({
          content: '❌ Cette commande doit être utilisée dans un thread de sortie.',
          flags: 64
        }).catch(err => {
          console.error('Erreur reply:', err.message);
        });
      }

      // Récupérer le message initial du thread
      const starterMessage = await interaction.channel.fetchStarterMessage().catch(() => null);
      if (!starterMessage) {
        return await interaction.reply({
          content: '❌ Impossible de récupérer le message initial du thread.',
          flags: 64
        }).catch(err => {
          console.error('Erreur reply:', err.message);
        });
      }

      // Vérifier cooldown AVANT l'appel API
      const tempKey = `msg_${starterMessage.id}`;
      const remaining = checkCooldown(tempKey);
      if (remaining !== null) {
        console.log(`[DEBUG] Cooldown actif: ${remaining}s restantes`);
        return await interaction.reply({
          content: `⏳ Cooldown actif. Réessaye dans ${remaining}s.`,
          flags: 64
        }).catch(err => {
          console.error('Erreur reply:', err.message);
        });
      }

      // Récupérer la sortie via l'API
      let sortie;
      try {
        sortie = await api.getSortieByMessageId(starterMessage.id);
      } catch (err) {
        console.error('Erreur fetch sortie:', err.message);
        return await interaction.reply({
          content: '❌ Sortie introuvable.',
          flags: 64
        }).catch(err => {
          console.error('Erreur reply:', err.message);
        });
      }

      // Vérifier que l'utilisateur est l'organisateur
      if (interaction.user.id !== sortie.organizerId) {
        console.log(`[DEBUG] Accès refusé: user=${interaction.user.id}, org=${sortie.organizerId}`);
        return await interaction.reply({
          content: '❌ Seul l\'organisateur peut utiliser cette commande.',
          flags: 64
        }).catch(err => {
          console.error('Erreur reply:', err.message);
        });
      }

      // Vérifier qu'il y a des participants
      if (!sortie.participants || sortie.participants.length === 0) {
        console.log(`[DEBUG] Aucun participant pour sortie ${sortie._id}`);
        return await interaction.reply({
          content: '❌ Aucun participant à notifier.',
          flags: 64
        }).catch(err => {
          console.error('Erreur reply:', err.message);
        });
      }

      // Construire l'aperçu des participants
      const mentions = sortie.participants.map(id => `<@${id}>`).join(', ');
      const sortieId = sortie._id || sortie.id;

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
      console.error(`[ERROR] ❌ Erreur lors de l'exécution de ping-participants :`, err);
      try {
        await interaction.reply({
          content: '❌ Une erreur est survenue.',
          flags: 64
        }).catch(() => {});
      } catch (e) {
        console.error('Erreur reply fallback:', e.message);
      }
      try {
        await logError(interaction.client, 'Erreur commande ping-participants', interaction.user, err);
      } catch (e) {
        console.error('Erreur logError:', e.message);
      }
    }
  }
};
