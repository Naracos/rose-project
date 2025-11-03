// bot/src/events/forumSaverReaction.js
const { Events } = require('discord.js');
const { logError } = require('../utils/logError');

module.exports = {
  name: Events.MessageReactionAdd,

  async execute(reaction, user) {
    // Ignore les réactions des bots et les messages qui ne sont pas dans le forum spécifié
    if (user.bot) return;

    const forumChannelId = process.env.CHANNEL_ID_SORTIES_PONCTUELLES;
    if (!forumChannelId) {
      console.error("CHANNEL_ID_SORTIES_PONCTUELLES non configuré");
      return;
    }
        if (!forumChannelId) {
      console.error("CHANNEL_ID_SORTIES_REC non configuré");
      return;
    }

    // Vérifie que la réaction est dans un thread du forum spécifié
    if (reaction.message.channel.parentId !== forumChannelId) return;
    if (reaction.message.channel.parentId !== forumChannelId) return;

    // Vérifie que la réaction est ✅
    if (reaction.emoji.name !== '✅') return;

    try {
      const thread = reaction.message.channel;

      // Récupère les messages du thread pour trouver le dernier message du bot
      const messages = await thread.messages.fetch({ limit: 5 });
      const botMessages = messages.filter(m => m.author.id === reaction.client.user.id && m.content.includes('a cliqué sur ✅'));

      let botMessage = botMessages.first();

      if (botMessage) {
        // Si un message du bot existe déjà, on le met à jour
        const currentContent = botMessage.content;
        const users = currentContent.match(/<@!\d+>/g) || [];

        // Vérifie si l'utilisateur est déjà mentionné
        if (!users.includes(`<@!${user.id}>`)) {
          const updatedContent = `${currentContent}\n<@!${user.id}> a cliqué sur ✅`;
          await botMessage.edit(updatedContent);
          console.log(`Message mis à jour dans ${thread.name} (ID: ${thread.id})`);
        }
      } else {
        // Sinon, envoie un nouveau message
        const message = await thread.send(`<@!${user.id}> a cliqué sur ✅`);
        console.log(`Nouveau message envoyé dans ${thread.name} (ID: ${thread.id})`);
      }
    } catch (error) {
      console.error("Erreur dans forumSaverReaction:", error);
      await logError(reaction.client, "Erreur dans forumSaverReaction", user, error);
    }
  }
};
