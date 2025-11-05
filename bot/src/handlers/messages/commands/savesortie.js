// bot/src/commands/savesortie.js
const { PermissionsBitField } = require('discord.js');
const { saveChannelToForum } = require('../../../utils/forumSaver');

module.exports = {
  name: "savesortie",
  description: "Enregistre une sortie via l'API",
  async execute(message, args) {
    return message.reply("🚫 La commande `savesortie` est actuellement désactivée.");
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("❌ Permission refusée.");
    }

    if (!message.guild) {
      return message.reply("❌ Cette commande ne fonctionne que sur un serveur.");
    }

    try {
      await message.reply(`🔄 Enregistrement en cours via l'API...`);
      const title = args.join(' ') || `Sortie du ${new Date().toLocaleDateString()}`;
      const response = await saveChannelToForum(message.channel, title);
      await message.reply(response);
    } catch (error) {
      console.error("Erreur:", error);
      await message.reply(`❌ Erreur: ${error.message}`);
    }
  }
};
