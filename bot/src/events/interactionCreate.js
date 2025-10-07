const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Gestion des boutons
    if (interaction.isButton()) {
      const buttonsPath = path.join(__dirname, '../handlers/interactions/buttons');
      const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));
      for (const file of buttonFiles) {
        const buttonHandler = require(path.join(buttonsPath, file));
        try {
          if (interaction.customId === buttonHandler.customId) {
            await buttonHandler.execute(interaction);
            break; // Arrête après avoir trouvé le bon gestionnaire
          }
        } catch (error) {
          console.error(`Erreur dans le bouton ${file}:`, error);
        }
      }
    }
    // Gestion des commandes slash
    else if (interaction.isCommand()) {
      const slashCommandsPath = path.join(__dirname, '../handlers/interactions/slashCommands');
      const commandFile = path.join(slashCommandsPath, `${interaction.commandName}.js`);
      if (fs.existsSync(commandFile)) {
        const command = require(commandFile);
        try {
          await command.execute(interaction);
        } catch (error) {
          console.error(`Erreur dans la commande slash ${interaction.commandName}:`, error);
        }
      }
    }
  }
};
