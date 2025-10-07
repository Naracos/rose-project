// bot/src/commands/ping-sortie.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logError } = require('../utils/logError');

// Rôles autorisés à utiliser la commande (à configurer dans ton .env)
const allowedRoleIds = [
  process.env.ROLE_ID_ADMIN,
  process.env.ROLE_ID_MODERATOR,
  process.env.ROLE_ID_ORGANIZER
].filter(id => id);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping-sortie')
    .setDescription("Ping les utilisateurs ayant réagi à une sortie avec un emoji spécifique")
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('Emoji pour filtrer les réactions (ex: ✅)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message-id')
        .setDescription('ID du message principal de la sortie')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      // 1. Vérification des permissions
      const hasPermission = allowedRoleIds.length > 0 &&
                          interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));

      if (!hasPermission) {
        return interaction.editReply("❌ Vous n'avez pas la permission d'utiliser cette commande.");
      }

      // 2. Récupération des paramètres
      const messageId = interaction.options.getString('message-id');
      const emojiInput = interaction.options.getString('emoji');

      // 3. Récupération du message principal
      const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
      if (!message) {
        return interaction.editReply("❌ Message introuvable. Vérifiez l'ID du message.");
      }

      // 4. Vérification que l'utilisateur est l'OP ou a les permissions
      const isOP = message.author.id === interaction.user.id;
      if (!isOP && !hasPermission) {
        return interaction.editReply("❌ Vous devez être l'auteur du message ou avoir les permissions requises.");
      }

      // 5. Trouver l'emoji (peut être un emoji standard ou personnalisé)
      let emojiToFind;
      try {
        // Essaye de trouver l'emoji dans le cache ou par son nom
        emojiToFind = emojiInput.match(/<a?:[a-zA-Z0-9_]+:(\d+)>/)
          ? emojiInput.match(/<a?:[a-zA-Z0-9_]+:(\d+)>/)[0]  // Emoji personnalisé
          : emojiInput;  // Emoji standard
      } catch (e) {
        return interaction.editReply("❌ Format d'emoji invalide. Utilisez un emoji standard (ex: ✅) ou un emoji personnalisé (ex: <:nom:123456789>).");
      }

      // 6. Récupération des réactions avec l'emoji spécifié
      const reaction = message.reactions.cache.find(r =>
        r.emoji.name === emojiToFind ||
        r.emoji.id === emojiToFind.replace(/<a?:[a-zA-Z0-9_]+:(\d+)>/g, '$1')
      );

      if (!reaction) {
        return interaction.editReply(`❌ Aucun utilisateur n'a réagi avec ${emojiInput} à ce message.`);
      }

      // 7. Récupération des utilisateurs ayant réagi
      const users = await reaction.users.fetch();
      const userIds = users.filter(user => !user.bot).map(user => user.id);

      if (userIds.length === 0) {
        return interaction.editReply(`❌ Aucun utilisateur (non-bot) n'a réagi avec ${emojiInput}.`);
      }

      // 8. Envoi du ping
      const pingMessage = await interaction.channel.send({
        content: `${userIds.map(id => `<@${id}>`).join(' ')}\n\n` +
                 `🔔 **Rappel pour la sortie** : ${message.content.substring(0, 150)}${message.content.length > 150 ? '...' : ''}\n` +
                 `(Réaction: ${emojiInput})\n` +
                 `[Voir le message original](${message.url})`,
        allowedMentions: { users: userIds }
      });

      // 9. Confirmation
      await interaction.editReply({
        content: `✅ ${userIds.length} utilisateur(s) notifié(s) avec succès !`,
        ephemeral: true
      });

      // 10. Logs (optionnel)
      if (process.env.LOG_CHANNEL_ID) {
        const logChannel = await interaction.guild.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🔔 Notification de sortie')
            .setDescription(`**${interaction.user.tag}** a notifié ${userIds.length} participant(s)`)
            .addFields(
              { name: 'Message original', value: `[Aller au message](${message.url})`, inline: false },
              { name: 'Emoji', value: emojiInput, inline: true },
              { name: 'Salon', value: interaction.channel.toString(), inline: true },
              { name: 'Utilisateurs notifiés', value: userIds.length.toString(), inline: true }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [embed] }).catch(console.error);
        }
      }

    } catch (error) {
      console.error("[ping-sortie] Erreur:", error);
      await logError(interaction.client, `Erreur dans /ping-sortie`, interaction.user, error);
      if (!interaction.replied) {
        await interaction.editReply({ content: "❌ Une erreur est survenue.", ephemeral: true }).catch(console.error);
      }
    }
  }
};
