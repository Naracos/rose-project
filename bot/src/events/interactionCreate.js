const { Events } = require('discord.js');
const { updateParticipantsList } = require('../handlers/reactions/sortieParticipants');
const logAction = require('../utils/actionLogger');
const path = require('path');
const fs = require('fs');

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
          // Appel safe : le handler doit early-return s'il n'est pas concerné par ce customId
          await buttonHandler.execute(interaction);
          // Ne pas break : on laisse le handler décider s'il gère ou non (handlers existants retournent vite si non concernés)
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

          // log: succès
          await logAction(interaction.client, `Commande /${interaction.commandName} exécutée avec succès`, interaction.user, {
            channelId: interaction.channelId
          });
        } catch (error) {
          // log l'erreur d'exécution (non bloquant)
          await logAction(interaction.client, `Erreur lors de /${interaction.commandName}`, interaction.user, {
            channelId: interaction.channelId,
            error: error.message
          }).catch(() => {});
          // réenvoyer l'erreur à ton logger d'erreurs si nécessaire
          // si tu as un utilitaire logError acceptant (client, message, user, error) :
          // const { logError } = require('../utils/logError');
          // await logError(interaction.client, `Erreur commande /${interaction.commandName}`, interaction.user, err);
          throw error;
        }
      }
    }
  }
};
