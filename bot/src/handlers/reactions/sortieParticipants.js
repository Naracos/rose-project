const logAction = require('../../utils/actionLogger');

async function updateParticipantsList(message, reaction) {
    try {
        // Vérifier si c'est le message initial d'une sortie
        if (!message.thread || message.thread.parentId !== process.env.SORTIES_FORUM_ID) return;
        if (message.id !== message.thread.id) return; // uniquement le message initial

        const organizer = message.author;
        if (!organizer) return;

        // Récupérer tous les participants
        const participants = await reaction.users.fetch();
        const participantsList = participants
            .filter(user => !user.bot)
            .map(user => `- ${user.tag}`);

        // Mettre à jour le MP à l'organisateur
        const dmChannel = await organizer.createDM();
        const dmMessages = await dmChannel.messages.fetch({ limit: 10 });
        const existingDM = dmMessages.find(m => 
            m.author.bot && 
            m.content.includes(`"${message.thread.name}"`) &&
            m.content.includes('Liste des participants')
        );

        const newContent = `🎉 **Sortie : "${message.thread.name}"**\n\n**Liste des participants** (${participantsList.length}) :\n${participantsList.length ? participantsList.join('\n') : '*(aucun participant)*'}\n\n*Liste mise à jour automatiquement*`;

        if (existingDM) {
            await existingDM.edit(newContent);
        } else {
            await organizer.send(newContent);
        }

        await logAction(message.client, 'Liste des participants mise à jour', organizer, {
            threadId: message.thread.id,
            participantsCount: participantsList.length
        });

    } catch (error) {
        await logAction(message.client, 'Erreur lors de la mise à jour des participants', null, {
            messageId: message?.id,
            error: error.message
        });
    }
}

module.exports = { updateParticipantsList };