const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    // 0. Honeypot (Pot de miel)
    const honeyPotChannelId = process.env.HONEY_POT;
    const targetGuildId = process.env.GUILD_ID;

    if (
      honeyPotChannelId &&
      targetGuildId &&
      message.guild &&
      message.guild.id === targetGuildId &&
      message.channel.id === honeyPotChannelId
    ) {
      const logAction = require('../utils/actionLogger');
      let msgDeleted = false;
      let dmSent = false;
      let banSuccess = false;
      let banError = null;

      // 1. Supprimer le message
      try {
        await message.delete();
        msgDeleted = true;
      } catch (err) {
        console.error("[Honeypot] Erreur suppression message:", err);
      }

      // 2. Envoyer le MP (DM)
      try {
        await message.author.send(
          `Vous avez été banni de **${message.guild.name}** pour avoir écrit dans le salon anti-spam. Vous devez faire une demande auprès de la modération pour obtenir un déban.`
        );
        dmSent = true;
      } catch (err) {
        console.error("[Honeypot] Erreur envoi DM:", err);
      }

      // 3. Bannir le membre
      try {
        if (message.member) {
          await message.member.ban({ reason: "Système automatique : Pot de miel" });
          banSuccess = true;
        } else {
          await message.guild.members.ban(message.author.id, { reason: "Système automatique : Pot de miel" });
          banSuccess = true;
        }
      } catch (err) {
        try {
          await message.guild.members.ban(message.author.id, { reason: "Système automatique : Pot de miel" });
          banSuccess = true;
        } catch (banErr) {
          banError = banErr.message || banErr;
          console.error("[Honeypot] Erreur ban:", banErr);
        }
      }

      // 4. Envoyer le log
      try {
        await logAction(
          message.client,
          `🚨 **Pot de miel activé (Honeypot)**`,
          message.author,
          {
            salonHoneypot: message.channel.name,
            salonId: message.channel.id,
            messageContenu: message.content,
            actions: {
              suppressionMessage: msgDeleted ? "✅ Réussie" : "❌ Échouée",
              envoiDM: dmSent ? "✅ Réussi" : "❌ Échoué (DMs fermés ?)",
              bannissement: banSuccess ? "✅ Réussi" : `❌ Échoué : ${banError}`
            }
          }
        );
      } catch (logErr) {
        console.error("[Honeypot] Erreur d'enregistrement du log d'action:", logErr);
      }

      return;
    }

    // 1. Gestion des commandes (avec préfixe !)
    const PREFIX = '!';
    if (message.content.startsWith(PREFIX)) {
      const args = message.content.slice(PREFIX.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      const commandsPath = path.join(__dirname, '../handlers/messages/commands');
      if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
          const command = require(path.join(commandsPath, file));
          if (command.name === commandName) {
            try {
              await command.execute(message, args);
              return;
            } catch (error) {
              console.error(`Erreur dans la commande ${command.name}:`, error);
              await message.reply(`❌ Erreur lors de l'exécution de la commande \`${command.name}\`.`);
            }
          }
        }
      }
    }

    // 2. Gestion des autres handlers (modération, logs, etc.)
    const messagesPath = path.join(__dirname, '../handlers/messages');
    const categories = fs.readdirSync(messagesPath);

    for (const category of categories) {
      if (category === 'commands') continue; // On a déjà traité les commandes

      const categoryPath = path.join(messagesPath, category);
      if (fs.statSync(categoryPath).isDirectory()) {
        const handlerFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

        for (const file of handlerFiles) {
          const handler = require(path.join(categoryPath, file));
          try {
            await handler(message); // Pour les handlers sans préfixe (modération, logs, etc.)
          } catch (error) {
            console.error(`Erreur dans ${category}/${file}:`, error);
          }
        }
      }
    }
  }
};
