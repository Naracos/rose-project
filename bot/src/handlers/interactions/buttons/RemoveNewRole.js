// c:\Users\enzob\Desktop\Projet-perso\rose\events\interactionCreate.js
const { Events, InteractionType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { logError } = require('../../../utils/logError');

const roleIdWelcomers = process.env.ROLE_ID_WELCOMERS;
const roleIdNew = process.env.ROLE_ID_NEW;
const logChannelId = process.env.LOG_CHANNEL_ID;

module.exports = {
  name: "RemoveNewRole",
  description: "Supprime le rôle New au membre",
  async execute(interaction) {
    // Gérer les commandes Slash
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await logError(interaction.client, `Erreur lors de l'exécution de la commande /${interaction.commandName}`, interaction.user, error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: "Une erreur s'est produite lors de l'exécution de cette commande !", ephemeral: true });
        } else {
          await interaction.reply({ content: "Une erreur s'est produite lors de l'exécution de cette commande !", ephemeral: true });
        }
      }
      return;
    }

    // Gérer les boutons
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('remove_role_')) {
        try {
          if (!interaction.member.roles.cache.has(roleIdWelcomers)) {
            await interaction.reply({ content: "Vous n'avez pas la permission de retirer des rôles.", ephemeral: true });
            return;
          }

          const memberId = interaction.customId.split('_')[2];
          const modal = new ModalBuilder()
            .setCustomId(`reasonModal_${memberId}`)
            .setTitle('Retirer le rôle');

          const reasonInput = new TextInputBuilder()
            .setCustomId('reasonInput')
            .setLabel('Raison du retrait du rôle')
            .setStyle(TextInputStyle.Paragraph);

          const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
          modal.addComponents(firstActionRow);

          await interaction.showModal(modal);

        } catch (error) {
          console.error('Erreur lors de la gestion du bouton :', error);
          await logError(interaction.client, 'Erreur lors de la gestion du bouton', interaction.user, error);
        }
      }
      return;
    }

    // Gérer les modales
    if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId.startsWith('reasonModal_')) {
        try {
          const memberId = interaction.customId.split('_')[1];
          const reason = interaction.fields.getTextInputValue('reasonInput');
          const member = await interaction.guild.members.fetch(memberId).catch(() => null);

          if (!member) {
            return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });
          }

          const role = interaction.guild.roles.cache.get(roleIdNew);
          if (!role) {
            return interaction.reply({ content: 'Rôle introuvable.', ephemeral: true });
          }

          if (!member.roles.cache.has(roleIdNew)) {
            return interaction.reply({ content: `L'utilisateur ${member.user.tag} n'a pas le rôle ${role.name}.`, ephemeral: true });
          }

          await member.roles.remove(role);

          const logChannel = interaction.guild.channels.cache.get(logChannelId);
          if (logChannel) {
            const embed = new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle('Rôle retiré')
              .setDescription(`Le rôle ${role.name} a été retiré à ${member.user.tag}`)
              .addFields(
                { name: 'Raison', value: reason, inline: false },
                { name: 'Retiré par', value: interaction.user.tag, inline: true },
                { name: "ID de l'utilisateur", value: member.user.id, inline: true }
              )
              .setTimestamp();
            await logChannel.send({ embeds: [embed] });
          }
          
          // Désactiver le bouton sur le message original
          const originalMessage = interaction.message;
          if (originalMessage && originalMessage.components.length > 0) {
            const row = ActionRowBuilder.from(originalMessage.components[0]);
            row.components[0].setDisabled(true);
            await originalMessage.edit({ components: [row] }).catch(e => console.error("Impossible de désactiver le bouton:", e));
          }

          await interaction.reply({ content: `Le rôle a été retiré à ${member.user.tag}. Raison : ${reason}`, ephemeral: true });
        } catch (error) {
          console.error('Erreur lors de la soumission de la modal :', error);
          await logError(interaction.client, 'Erreur lors de la soumission de la modal', interaction.user, error);
          if (!interaction.replied) {
            await interaction.reply({ content: 'Une erreur est survenue lors du traitement de la modal.', ephemeral: true });
          }
        }
      }
    }
  },
};
