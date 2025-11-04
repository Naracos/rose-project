const { Events } = require('discord.js');
const { updateParticipantsList } = require('../handlers/reactions/sortieParticipants');
const logAction = require('../utils/actionLogger');

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        if (reaction.partial) await reaction.fetch();
        let message = reaction.message;
        if (message.partial) message = await message.fetch();

        if (reaction.emoji?.name !== '✅') return;

        const channel = await reaction.client.channels.fetch(message.channelId).catch(() => null);
        if (!channel?.isThread?.()) return;

        const starter = await channel.fetchStarterMessage().catch(() => null);
        if (!starter || starter.id !== message.id) return;

        try {
            await updateParticipantsList(starter);
        } catch (e) {
            console.error('Erreur updateParticipants (add):', e);
        }
    }
};