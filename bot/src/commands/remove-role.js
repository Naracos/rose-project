const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { logError } = require('../utils/logError');

// Rôles autorisés à utiliser la commande (filtrer les undefined)
const allowedRoleIds = [
  process.env.ROLE_ID_WELCOMERS,
  process.env.ROLE_ID_ADMIN,
].filter(id => id);

// Rôles disponibles pour le retrait (filtrer les undefined)
const removableRoles = {
  "new": process.env.ROLE_ID_NEW,
  "membre vérifié": process.env.ROLE_ID_VERIFIED,
};

// Filtrer les rôles non configurés
Object.keys(removableRoles).forEach(key => {
  if (!removableRoles[key]) delete removableRoles[key];
});

const logChannelId = process.env.LOG_CHANNEL_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-role')
    .setDescription("Retirer un rôle spécifique à un membre")
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription("L'utilisateur auquel retirer le rôle")
        .setRequired(true))
    .addStringOption(option =>
      option.setName('rôle')
        .setDescription('Le rôle à retirer')
        .setRequired(true)
        .setChoices(
          Object.keys(removableRoles).map(key => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: key })),
        ))
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('La raison du retrait du rôle')
        .setRequired(true)),

  async execute(interaction) {
    console.log(`[remove-role] Commande lancée par ${interaction.user.tag} (ID: ${interaction.user.id})`);

    try {
      await interaction.deferReply({ ephemeral: true });

      // Vérification des permissions
      const hasPermission = allowedRoleIds.length > 0 && interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));
      if (!hasPermission) {
        console.log("[remove-role] Permission refusée : rôles autorisés =", allowedRoleIds);
        return interaction.editReply("❌ Vous n'avez pas la permission de retirer des rôles.");
      }

      const user = interaction.options.getUser('utilisateur');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        return interaction.editReply('❌ Utilisateur introuvable ou inaccessible.');
      }

      const roleKey = interaction.options.getString('rôle');
      const reason = interaction.options.getString('raison');
      const roleId = removableRoles[roleKey];
      if (!roleId) {
        return interaction.editReply('❌ Rôle spécifié introuvable.');
      }

      const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
      if (!role) {
        return interaction.editReply('❌ Rôle introuvable sur le serveur.');
      }

      if (!member.roles.cache.has(roleId)) {
        return interaction.editReply(`⚠️ L'utilisateur ${member.user.tag} n'a pas le rôle **${role.name}**.`);
      }

      // Vérifier la hiérarchie des rôles
      const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
      if (role.position >= botMember.roles.highest.position) {
        return interaction.editReply(`❌ Impossible de retirer le rôle **${role.name}** car il est au-dessus de mon rôle le plus élevé.`);
      }

      // Retrait du rôle
      await member.roles.remove(roleId);

      // Logs
      if (logChannelId) {
        const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('✅ Rôle retiré')
            .setDescription(`Le rôle **${role.name}** a été retiré à ${member.user.tag}`)
            .addFields(
              { name: 'Raison', value: reason, inline: false },
              { name: 'Retiré par', value: interaction.user.tag, inline: true },
              { name: "ID de l'utilisateur", value: member.user.id, inline: true }
            )
            .setTimestamp();
          await logChannel.send({ embeds: [embed] }).catch(console.error);
        }
      }

      await interaction.editReply(`✅ Le rôle **${role.name}** a été retiré à ${member.user.tag}. Raison : ${reason}`);
    } catch (error) {
      console.error("[remove-role] Erreur :", error);
      await logError(interaction.client, `Erreur dans /remove-role`, interaction.user, error);
      if (!interaction.replied) {
        await interaction.editReply({ content: "❌ Une erreur est survenue.", ephemeral: true }).catch(console.error);
      }
    }
  },
};
