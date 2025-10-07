// c:\Users\enzob\Desktop\Projet-perso\rose\events\guildMemberAdd.js
const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { logError } = require('../utils/logError');

const roleIdNew = process.env.ROLE_ID_NEW;
const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
const logChannelId = process.env.LOG_CHANNEL_ID;
const welcomers = process.env.ROLE_ID_WELCOMERS

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (member.guild.id !== process.env.GUILD_ID) return;

    try {
      const role = member.guild.roles.cache.get(roleIdNew);
      if (role) {
        await member.roles.add(role);
      }

      const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
      if (welcomeChannel) {
        await welcomeChannel.send(`Salut à toi ${member} ! 🫶\nIci, c’est le point de départ pour bien t’intégrer au serveur. Que tu sois là pour découvrir, discuter, sortir ou simplement te faire de nouveaux potes, tu es au bon endroit !\nPense à lire les règles du serveur pour que tout se passe bien.\nOn a hâte d’échanger avec toi, alors installe-toi bien et fais comme chez toi ! ☺️\n\nSi besoin les <@&${welcomers}> sont là !`);
      }
      

      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Nouveau Membre')
        .setDescription(`Bienvenue à ${member.user.tag}!`)
        .addFields(
          { name: 'ID utilisateur', value: member.user.id, inline: true },
          { name: 'Compte créé le', value: member.user.createdAt.toLocaleDateString(), inline: true },
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`remove_role_${member.id}`)
            .setLabel('Retirer le rôle')
            .setStyle(ButtonStyle.Danger)
        );

      const logChannel = member.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        await logChannel.send({ embeds: [embed], components: [row] });
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout d'un membre:", error);
      await logError(member.client, "Erreur lors de l'ajout d'un membre", member.user, error);
    }
  },
};
