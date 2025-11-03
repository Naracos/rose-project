const { EmbedBuilder } = require('discord.js');

/**
 * logAction(client, titre, user?, extra?)
 * - client : Client discord
 * - titre  : texte court décrivant l'action
 * - user   : (optionnel) User object
 * - extra  : (optionnel) objet avec détails (channelId, options, messageId, etc.)
 */
async function logAction(client, titre, user = null, extra = {}) {
  try {
    if (!client || !client.isReady?.()) {
      console.log('[actionLogger] client non prêt —', titre, user?.id ?? '');
      return;
    }

    const guildId = process.env.GUILD_ID;
    const channelId = process.env.ACTION_LOG_CHANNEL_ID;
    if (!channelId) {
      console.warn('[actionLogger] ACTION_LOG_CHANNEL_ID non défini');
      return;
    }

    // essayer récupérer le channel via la guilde puis fallback sur client.channels
    let channel;
    if (guildId) {
      const guild = client.guilds.cache.get(guildId);
      channel = guild?.channels.cache.get(channelId);
    }
    channel = channel || client.channels.cache.get(channelId);
    if (!channel) {
      console.error('[actionLogger] salon de log introuvable:', channelId);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('Log d’action')
      .setDescription(titre)
      .setColor(0x00A5FF)
      .setTimestamp();

    if (user) {
      embed.addFields({ name: 'Utilisateur', value: `${user.tag} (ID: ${user.id})`, inline: true });
    }

    if (extra && Object.keys(extra).length) {
      let json = JSON.stringify(extra, null, 2);
      if (json.length > 1000) json = json.substring(0, 1000) + '...';
      embed.addFields({ name: 'Détails', value: `\`\`\`json\n${json}\n\`\`\`` });
    }

    await channel.send({ embeds: [embed] }).catch(err => console.error('[actionLogger] send fail', err));
  } catch (err) {
    console.error('[actionLogger] erreur', err);
  }
}

module.exports = logAction;