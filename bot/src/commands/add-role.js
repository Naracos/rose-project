const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { logError } = require('../utils/logError');

// Rôles autorisés à utiliser la commande (filtrer les undefined)
const allowedRoleIds = [
  // Rôles administrateurs
  process.env.ROLE_ID_ADMIN1,      // Clé fonda
  process.env.ROLE_ID_ADMIN2,      // Clé admin
  process.env.ROLE_ID_FONDATEURS,    // Rôle Fonda
    process.env.ROLE_ID_RESPONSABLES, // Rôle Responsable

  // Rôles bénévoles (tous peuvent ajouter le rôle "membre vérifié")
  process.env.ROLE_ID_WELCOMERS,    // Rôle Welcomer
  process.env.ROLE_ID_MODERATEURS,  // Rôle Médiation
  process.env.ROLE_ID_ANIMATEURS,   // Rôle Animateur/ice
  process.env.ROLE_ID_TECHNICIENS,   // Rôle Technicien
  process.env.ROLE_ID_PHOTOS,       // Rôle Vidéo / Photographe
  process.env.ROLE_ID_CM,           // Rôle Community Manager
  process.env.ROLE_ID_HELPERS,      // Rôle Helpers
  process.env.ROLE_ID_CONSULTANTS   // Rôle Consultant
].filter(id => id); // Filtre les valeurs undefined ou vides


// Rôles disponibles pour l'ajout (filtrer les undefined)
const addableRoles = {
  "membre vérifié": process.env.ROLE_ID_VERIFIED,
  "membre homme": process.env.ROLE_ID_MAN,
  "membre femme": process.env.ROLE_ID_WOMAN,
};

// Filtrer les rôles non configurés
Object.keys(addableRoles).forEach(key => {
  if (!addableRoles[key]) delete addableRoles[key];
});

const logChannelId = process.env.LOG_CHANNEL_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-role')
    .setDescription("Ajouter un ou plusieurs rôles à un membre")
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription("L'utilisateur auquel ajouter le/les rôle(s)")
        .setRequired(true))
    .addStringOption(option =>
      option.setName('rôle')
        .setDescription('Le rôle principal à ajouter (obligatoire)')
        .setRequired(true)
        .setChoices(
          Object.keys(addableRoles).map(key => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: key })),
        ))
    .addStringOption(option =>
      option.setName('genre')
        .setDescription('Optionnel : rôle de genre à ajouter')
        .setRequired(false)
        .setChoices(
          { name: 'Homme', value: 'membre homme' },
          { name: 'Femme', value: 'membre femme' },
        ))
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('La raison de l\'ajout du/des rôle(s)')
        .setRequired(false)),

  async execute(interaction) {
    console.log(`[add-role] Commande lancée par ${interaction.user.tag} (ID: ${interaction.user.id})`);

    try {
      await interaction.deferReply({ ephemeral: true });

      // Vérification des permissions
      const hasPermission = allowedRoleIds.length > 0 && interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));
      if (!hasPermission) {
        console.log("[add-role] Permission refusée : rôles autorisés =", allowedRoleIds);
        return interaction.editReply("❌ Vous n'avez pas la permission d'ajouter des rôles.");
      }

      const user = interaction.options.getUser('utilisateur');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        return interaction.editReply('❌ Utilisateur introuvable ou inaccessible.');
      }

      const mainRoleKey = interaction.options.getString('rôle');
      const mainRoleId = addableRoles[mainRoleKey];
      if (!mainRoleId) {
        return interaction.editReply('❌ Rôle principal invalide.');
      }

      const mainRole = await interaction.guild.roles.fetch(mainRoleId).catch(() => null);
      if (!mainRole) {
        return interaction.editReply('❌ Rôle principal introuvable sur le serveur.');
      }

      if (member.roles.cache.has(mainRoleId)) {
        return interaction.editReply(`⚠️ L'utilisateur ${member.user.tag} a déjà le rôle **${mainRole.name}**.`);
      }

      // Vérifier la hiérarchie des rôles
      const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
      if (mainRole.position >= botMember.roles.highest.position) {
        return interaction.editReply(`❌ Impossible d'ajouter le rôle **${mainRole.name}** car il est au-dessus de mon rôle le plus élevé.`);
      }

      // Rôle de genre (optionnel)
      let genderRole = null;
      const genderRoleKey = interaction.options.getString('genre');
      if (genderRoleKey) {
        const genderRoleId = addableRoles[genderRoleKey];
        if (!genderRoleId) {
          return interaction.editReply('❌ Rôle de genre invalide.');
        }
        genderRole = await interaction.guild.roles.fetch(genderRoleId).catch(() => null);
        if (!genderRole) {
          return interaction.editReply('❌ Rôle de genre introuvable sur le serveur.');
        }
        if (genderRole.position >= botMember.roles.highest.position) {
          return interaction.editReply(`❌ Impossible d'ajouter le rôle **${genderRole.name}** car il est au-dessus de mon rôle le plus élevé.`);
        }
      }

      // Ajout des rôles
      await member.roles.add(mainRoleId);
      if (genderRole) {
        await member.roles.add(genderRole.id);
      }

      // Logs
      const reason = interaction.options.getString('raison') || "Aucune raison spécifiée";
      if (logChannelId) {
        const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Rôle(s) ajouté(s)')
            .setDescription(`Le rôle **${mainRole.name}** a été ajouté à ${member.user.tag}` + (genderRole ? `\nLe rôle **${genderRole.name}** a également été ajouté.` : ''))
            .addFields(
              { name: 'Raison', value: reason, inline: false },
              { name: 'Ajouté par', value: interaction.user.tag, inline: true },
              { name: "ID de l'utilisateur", value: member.user.id, inline: true }
            )
            .setTimestamp();
          await logChannel.send({ embeds: [embed] }).catch(console.error);
        }
      }

      await interaction.editReply(
        `✅ Le rôle **${mainRole.name}** a été ajouté à ${member.user.tag}.` +
        (genderRole ? `\nLe rôle **${genderRole.name}** a également été ajouté.` : '') +
        `\nRaison : ${reason}`
      );
    } catch (error) {
      console.error("[add-role] Erreur :", error);
      await logError(interaction.client, `Erreur dans /add-role`, interaction.user, error);
      if (!interaction.replied) {
        await interaction.editReply({ content: "❌ Une erreur est survenue.", ephemeral: true }).catch(console.error);
      }
    }
  },
};
