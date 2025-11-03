const { Events } = require('discord.js');
const { updateParticipantsList } = require('../handlers/reactions/sortieParticipants');
const logAction = require('../utils/actionLogger');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                await logAction(reaction.client, 'Erreur lors du fetch de la réaction', user, { error: error.message });
                return;
            }
        }

        if (reaction.emoji.name === '✅') {
            await updateParticipantsList(reaction.message, reaction);
        }
    }
};