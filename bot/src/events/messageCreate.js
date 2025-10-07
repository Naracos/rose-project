const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

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
