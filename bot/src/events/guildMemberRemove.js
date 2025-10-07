// c:\Users\enzob\Desktop\Projet-perso\rose\events\guildMemberRemove.js
const { Events, EmbedBuilder } = require('discord.js');
const { logError } = require('../utils/logError');

const roleIdNew = process.env.ROLE_ID_NEW;
const logChannelId = process.env.LOG_CHANNEL_ID;

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    if (member.guild.id !== process.env.GUILD_ID) return;

    try {
      const role = member.guild.roles.cache.get(roleIdNew);
      if (role && member.roles.cache.has(roleIdNew)) {
        const logChannel = member.guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Membre quitté')
            .setDescription(`Le membre ${member.user.tag} a quitté le serveur et a perdu le rôle ${role.name}.`)
            .addFields(
              { name: 'ID utilisateur', value: member.user.id, inline: true },
              { name: 'Compte créé le', value: member.user.createdAt.toLocaleDateString(), inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();
          await logChannel.send({ embeds: [embed] });
        }
      }
    } catch (error) {
      console.error("Erreur lors du départ d'un membre:", error);
      await logError(member.client, "Erreur lors du départ d'un membre", member.user, error);
    }
  },
};
