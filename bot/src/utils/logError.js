// c:\Users\enzob\Desktop\Projet-perso\rose\utils\logError.js
const { EmbedBuilder } = require('discord.js');

async function logError(client, errorMessage, user, error) {
  const guildId = process.env.GUILD_ID;
  const errorLogChannelId = process.env.ERROR_LOG_CHANNEL_ID;

  if (!client || !client.isReady()) {
    console.error("Client non prêt, impossible de logger l'erreur sur Discord.", { errorMessage, user, error });
    return;
  }

  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      console.error('Guild non trouvée pour le logging d\'erreur.');
      return;
    }

    const errorLogChannel = guild.channels.cache.get(errorLogChannelId);
    if (!errorLogChannel) {
      console.error('Salon de logs d\'erreur non trouvé.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF0000) // Rouge pour les erreurs
      .setTitle('Erreur détectée')
      .setDescription(errorMessage)
      .setTimestamp();

    if (user) {
      embed.addFields(
        { name: 'Utilisateur', value: `${user.tag} (ID: ${user.id})`, inline: true }
      );
    } 

    if (error) {
      const errorMessageText = error.message ? error.message.substring(0, 1000) : 'Aucun message d\'erreur';
      const stackTraceText = error.stack ? error.stack.substring(0, 1000) : 'Aucune stack trace';

      embed.addFields(
        { name: 'Message d\'erreur', value: `\`\`\`${errorMessageText}\`\`\``, inline: false },
        { name: 'Stack Trace', value: `\`\`\`${stackTraceText}\`\`\``, inline: false }
      );
    }

    await errorLogChannel.send({ embeds: [embed] });
  } catch (logErr) {
    console.error('Erreur lors de l\'envoi du log d\'erreur :', logErr);
  }
}

module.exports = { logError };
