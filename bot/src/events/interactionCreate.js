const { Events } = require('discord.js');
const { updateParticipantsList } = require('../handlers/reactions/sortieParticipants');
const logAction = require('../utils/actionLogger');
const path = require('path');
const fs = require('fs');

let buttons = new Map();

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      // Charger les boutons une seule fois (lazy load au premier besoin)
      if (buttons.size === 0) {
        const buttonsPath = path.join(__dirname, '..', 'handlers', 'interactions', 'buttons');
        if (fs.existsSync(buttonsPath)) {
          for (const file of fs.readdirSync(buttonsPath).filter(f => f.endsWith('.js'))) {
            try {
              const button = require(path.join(buttonsPath, file));
              if (button.customId) {
                buttons.set(button.customId, button);
                console.log(`[DEBUG] ✅ Bouton chargé: ${button.customId}`);
              }
            } catch (err) {
              console.error(`[ERROR] Erreur chargement bouton ${file}:`, err.message);
            }
          }
        }
      }

      // Slash commands
      if (interaction.isChatInputCommand()) {
        console.log(`[DEBUG] Commande reçue: ${interaction.commandName} par ${interaction.user.username}`);
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
          console.error(`[ERROR] Commande non trouvée: ${interaction.commandName}`);
          return;
        }
        await command.execute(interaction);
      }

      // Select menus
      if (interaction.isStringSelectMenu()) {
        console.log(`[DEBUG] Select menu: ${interaction.customId}`);
        const selectHandler = interaction.client.selectMenus?.get(interaction.customId);
        if (selectHandler) {
          await selectHandler.execute(interaction);
        }
      }

      // Buttons
      if (interaction.isButton()) {
        console.log(`[DEBUG] Bouton cliqué: ${interaction.customId}`);
        let handler = buttons.get(interaction.customId);
        if (!handler) {
          // Chercher par prefix
          for (const [key, btn] of buttons) {
            if (interaction.customId.startsWith(key)) {
              handler = btn;
              console.log(`[DEBUG] ✅ Bouton trouvé par prefix: ${key}`);
              break;
            }
          }
        }
        if (handler) {
          await handler.execute(interaction);
        } else {
          console.warn(`[WARN] Bouton non trouvé: ${interaction.customId} (boutons disponibles: ${Array.from(buttons.keys()).join(', ')})`);
        }
      }

      // Modal submissions
      if (interaction.isModalSubmit()) {
        console.log(`[DEBUG] Modal: ${interaction.customId}`);
        const modalHandler = interaction.client.modals?.get(interaction.customId);
        if (modalHandler) {
          await modalHandler.execute(interaction);
        }
      }
    } catch (error) {
      console.error('[ERROR] Erreur globale interactionCreate:', error);
    }
  }
};
