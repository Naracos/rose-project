// bot/src/events/cleanOldForumPosts.js
const { Events, EmbedBuilder } = require('discord.js');
const { logError } = require('./logError');

module.exports = {
  name: 'cleanOldForumPosts', // Nom personnalisé pour l'événement
  async execute(client) {
    if (!process.env.CHANNEL_ID_SORTIES_PONCTUELLES) {
      console.log("⚠️ CHANNEL_ID_SORTIES_PONCTUELLES non configuré. Annulation du nettoyage.");
      return;
    }

    try {
      console.log("🧹 Début du nettoyage des posts du forum...");

      // Récupère le salon du forum
      const guild = await client.guilds.fetch(process.env.GUILD_ID);
      const forumChannel = await guild.channels.fetch(process.env.CHANNEL_ID_SORTIES_PONCTUELLES);

      if (!forumChannel || forumChannel.type !== 15) { // 15 = CHANNEL_TYPE_GUILD_FORUM
        console.log("⚠️ Le salon spécifié n'est pas un forum. Annulation.");
        return;
      }

      // Récupère tous les posts du forum
      const threads = await forumChannel.threads.fetch();
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 jours en millisecondes

      let deletedCount = 0;
      let keptCount = 0;

      // Parcourt chaque post du forum
      for (const [threadId, thread] of threads.threads) {
        try {
          // Récupère le dernier message du post
          const lastMessage = await thread.fetchStarterMessage().catch(() => null);
          if (!lastMessage) continue;

          // Vérifie si le dernier message a plus de 7 jours
          if (lastMessage.createdAt < sevenDaysAgo) {
            // Supprime le post
            await thread.delete("Post du forum inactif depuis plus de 7 jours");
            deletedCount++;
            console.log(`✅ Post supprimé: ${thread.name} (ID: ${threadId})`);
          } else {
            keptCount++;
          }
        } catch (error) {
          console.error(`❌ Erreur lors du traitement du post ${threadId}:`, error);
        }
      }

      // Envoie un rapport dans le salon de logs
      if (process.env.LOG_CHANNEL_ID) {
        const logChannel = await guild.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🧹 Nettoyage des posts du forum')
            .setDescription(`Nettoyage automatique des posts inactifs depuis plus de 7 jours`)
            .addFields(
              { name: 'Posts supprimés', value: deletedCount.toString(), inline: true },
              { name: 'Posts conservés', value: keptCount.toString(), inline: true },
              { name: 'Salon concerné', value: `<#${process.env.CHANNEL_ID_SORTIES_PONCTUELLES}>`, inline: true }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [embed] });
        }
      }

      console.log(`🧹 Nettoyage terminé: ${deletedCount} posts supprimés, ${keptCount} conservés.`);
    } catch (error) {
      console.error("❌ Erreur lors du nettoyage des posts du forum:", error);
      await logError(client, "Erreur lors du nettoyage des posts du forum", null, error);
    }
  },
};
