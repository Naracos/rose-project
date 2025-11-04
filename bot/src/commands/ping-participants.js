// bot/src/commands/ping-participants.js
const { SlashCommandBuilder } = require('discord.js');
const { logError } = require('../utils/logError');
const logAction = require('../utils/actionLogger');

// Cooldown en secondes (par message de sortie)
const COOLDOWN_SECONDS = 60;
const cooldowns = new Map(); // key: messageId -> timestamp (ms)

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping-participants')
        .setDescription('Mentionne tous les membres ayant cliqué sur la réaction ✅ d’un post de sortie.')
        .addStringOption(opt =>
            opt.setName('message')
               .setDescription('ID du message ou lien (optionnel).')
               .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const input = interaction.options.getString('message')?.trim();

            await logAction(interaction.client, 'Commande /ping-participants lancée', interaction.user, {
                input,
                channelId: interaction.channelId
            });

            let channel = await interaction.client.channels.fetch(interaction.channelId);
            if (!channel) {
                await logAction(interaction.client, 'Impossible de récupérer le canal lors de /ping-participants', interaction.user, { channelId: interaction.channelId });
                return interaction.reply({ content: "Impossible de récupérer le canal.", ephemeral: true });
            }

            // Si option fournie, tenter d'extraire channelId/messageId depuis le lien ou "channel:message"
            let messageId = null;
            if (input) {
                let tempChannelId = channel.id;
                const linkMatch = input.match(/\/channels\/(\d+)\/(\d+)\/(\d+)/);
                if (linkMatch) {
                    tempChannelId = linkMatch[2];
                    messageId = linkMatch[3];
                } else {
                    const parts = input.split(/[\/:]/).filter(Boolean);
                    if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
                        tempChannelId = parts[0];
                        messageId = parts[1];
                    } else if (/^\d+$/.test(input)) {
                        messageId = input;
                    }
                }
                if (tempChannelId !== channel.id) {
                    channel = await interaction.client.channels.fetch(tempChannelId).catch(() => null) || channel;
                }
            }

            // Si pas d'ID fourni et qu'on est dans un thread, utiliser le message de base (starter message)
            let msg = null;
            if (!messageId && channel.isThread?.()) {
                msg = await channel.fetchStarterMessage().catch(() => null);
            }

            // Si on a un messageId (fourni ou extrait), récupérer ce message
            if (!msg && messageId) {
                msg = await channel.messages.fetch(messageId).catch(() => null);
            }

            if (!msg) {
                await logAction(interaction.client, 'Message introuvable pour /ping-participants', interaction.user, { input, channelId: channel?.id });
                return interaction.reply({ content: "Message introuvable. Fournissez un lien/ID ou exécutez la commande depuis le thread du post.", ephemeral: true });
            }

            // Vérifier que l'utilisateur est l'organisateur (auteur du message)
            const organizerId = msg.author?.id;
            if (!organizerId) {
                await logAction(interaction.client, 'Impossible de déterminer l\'organisateur du post', interaction.user, { messageId: msg.id });
                return interaction.reply({ content: "Impossible de déterminer l'organisateur du post.", ephemeral: true });
            }
            if (interaction.user.id !== organizerId) {
                await logAction(interaction.client, 'Accès refusé à /ping-participants (non-organisateur)', interaction.user, { messageId: msg.id, organizerId });
                return interaction.reply({ content: "Seul l'organisateur du post peut utiliser cette commande.", ephemeral: true });
            }

            // Antispam / cooldown par message
            const now = Date.now();
            const last = cooldowns.get(msg.id) || 0;
            const elapsed = (now - last) / 1000;
            if (elapsed < COOLDOWN_SECONDS) {
                const remaining = Math.ceil(COOLDOWN_SECONDS - elapsed);
                await logAction(interaction.client, 'Tentative /ping-participants bloquée par cooldown', interaction.user, { messageId: msg.id, remaining });
                return interaction.reply({ content: `Veuillez attendre ${remaining}s avant de relancer la commande pour ce post.`, ephemeral: true });
            }
            // enregistrer l'utilisation
            cooldowns.set(msg.id, now);

            // Optionnel: nettoyer les entrées trop vieilles (pour éviter mémoire infinie)
            // (simple balayage périodique)
            for (const [key, ts] of cooldowns) {
                if ((now - ts) / 1000 > COOLDOWN_SECONDS * 5) { // garder 5x le TTL
                    cooldowns.delete(key);
                }
            }

            // Trouver la réaction ✅
            const reaction = msg.reactions.cache.get('✅') || msg.reactions.cache.find(r => r.emoji?.name === '✅');
            if (!reaction) {
                await logAction(interaction.client, 'Aucune réaction ✅ trouvée pour /ping-participants', interaction.user, { messageId: msg.id });
                return interaction.reply({ content: "Aucune réaction ✅ trouvée sur ce message.", ephemeral: true });
            }

            // Récupérer les utilisateurs ayant réagi
            const users = await reaction.users.fetch();
            const nonBotUsers = users.filter(u => !u.bot);
            if (nonBotUsers.size === 0) {
                await logAction(interaction.client, 'Aucun participant (hors bots) pour /ping-participants', interaction.user, { messageId: msg.id });
                return interaction.reply({ content: "Aucun participant (hors bots) n'a réagi avec ✅.", ephemeral: true });
            }

            const userIds = nonBotUsers.map(u => u.id);
            const mentions = nonBotUsers.map(u => `<@${u.id}>`).join(' ');
            await interaction.reply({
                content: `Participants (${userIds.length}) :\n${mentions}`,
                allowedMentions: { users: userIds }
            });

            await logAction(interaction.client, 'Ping participants envoyé', interaction.user, {
                messageId: msg.id,
                channelId: channel.id,
                count: userIds.length
            });
        } catch (err) {
            // logError attend (client, message, user, error) selon utils/logError.js
            try {
                await logError(interaction.client, `Erreur commande /ping-participants`, interaction.user, err);
            } catch (e) {
                console.error('Erreur lors de logError:', e);
            }
            await logAction(interaction.client, 'Erreur lors de /ping-participants', interaction.user, { error: err.message });
            try { await interaction.reply({ content: "Une erreur est survenue lors de l'exécution de la commande.", ephemeral: true }); } catch {}
        }
    }
};
