const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getRgpdText, RGPD_PDF_PATH, EMOJI_ACCEPT, EMOJI_DECLINE } = require('../../RGPD/config');
const { logError } = require('../utils/logError');

// Rôles autorisés (admins uniquement)
const allowedRoleIds = [
    process.env.ROLE_ID_ADMIN1,
    process.env.ROLE_ID_ADMIN2,
    process.env.ROLE_ID_FONDATEURS,
    process.env.ROLE_ID_RESPONSABLES,
].filter(Boolean);

// Chemin vers le .env pour mise à jour automatique du RGPD_MESSAGE_ID
const ENV_PATH = path.join(__dirname, '..', '..', '.env');

/**
 * Met à jour une variable dans le fichier .env
 */
function updateEnvVariable(key, value) {
    try {
        let content = fs.readFileSync(ENV_PATH, 'utf-8');
        const regex = new RegExp(`^(${key}=).*$`, 'm');
        if (regex.test(content)) {
            content = content.replace(regex, `$1${value}`);
        } else {
            content += `\n${key}=${value}`;
        }
        fs.writeFileSync(ENV_PATH, content, 'utf-8');
        // Mettre à jour process.env en live
        process.env[key] = value;
        console.log(`[RGPD] .env mis à jour : ${key}=${value}`);
        return true;
    } catch (e) {
        console.error('[RGPD] Erreur mise à jour .env :', e.message);
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rgpd')
        .setDescription('Gestion du système droit à l\'image RGPD')
        .addSubcommand(sub =>
            sub
                .setName('setup')
                .setDescription('📸 Envoie le message de droit à l\'image dans le salon configuré')
                .addChannelOption(opt =>
                    opt.setName('salon')
                        .setDescription('Salon où envoyer le message (par défaut : RGPD_MESSAGE_CHANNEL_ID du .env)')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('stats')
                .setDescription('📊 Affiche les statistiques de consentement (acceptés / refusés / révoqués)')
        ),

    async execute(interaction) {
        // Recharger les variables d'environnement
        require('dotenv').config({ override: true });

        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ flags: 64 });
            }

            // Vérification des permissions
            const hasPermission =
                allowedRoleIds.length > 0 &&
                interaction.member.roles.cache.some(r => allowedRoleIds.includes(r.id));

            if (!hasPermission) {
                return interaction.editReply('❌ Vous n\'avez pas la permission d\'utiliser cette commande.');
            }

            const sub = interaction.options.getSubcommand();

            // ─────────────────────────────────────────────────────────
            // /rgpd setup
            // ─────────────────────────────────────────────────────────
            if (sub === 'setup') {
                // Déterminer le salon cible
                const channelOption = interaction.options.getChannel('salon');
                let targetChannel = channelOption;

                if (!targetChannel) {
                    const channelId = process.env.RGPD_MESSAGE_CHANNEL_ID;
                    if (!channelId) {
                        return interaction.editReply(
                            '❌ Aucun salon spécifié et `RGPD_MESSAGE_CHANNEL_ID` n\'est pas configuré dans le `.env`.\n' +
                            'Utilisez `/rgpd setup salon:#votre-salon` ou remplissez la variable.'
                        );
                    }
                    targetChannel = await interaction.guild.channels.fetch(channelId).catch(() => null);
                    if (!targetChannel) {
                        return interaction.editReply('❌ Salon configuré dans `.env` introuvable. Vérifiez `RGPD_MESSAGE_CHANNEL_ID`.');
                    }
                }

                // Vérifier que le fichier PDF source existe
                if (!fs.existsSync(RGPD_PDF_PATH)) {
                    return interaction.editReply(
                        `❌ Fichier PDF source introuvable : \`${RGPD_PDF_PATH}\`\n` +
                        'Vérifiez que le fichier est bien dans le dossier `RGPD/`.'
                    );
                }

                // Construire le message (Texte brut + PDF)
                const attachment = new AttachmentBuilder(RGPD_PDF_PATH, {
                    name: 'droit_image_Dionysos-Bordeaux.pdf',
                });

                // Envoyer dans le salon cible
                let sentMessage;
                try {
                    sentMessage = await targetChannel.send({
                        content: getRgpdText(),
                        files: [attachment],
                    });
                } catch (sendErr) {
                    console.error('[RGPD] Erreur envoi message :', sendErr);
                    return interaction.editReply(
                        `❌ Impossible d'envoyer le message dans <#${targetChannel.id}>.\n` +
                        'Vérifiez les permissions du bot (Envoyer des messages, Joindre des fichiers).'
                    );
                }

                // Ajouter les réactions ✅ et ❌
                try {
                    await sentMessage.react(EMOJI_ACCEPT);
                    await sentMessage.react(EMOJI_DECLINE);
                } catch (reactErr) {
                    console.warn('[RGPD] Impossible d\'ajouter les réactions :', reactErr.message);
                }

                // Sauvegarder l'ID du message dans le .env automatiquement
                const saved = updateEnvVariable('RGPD_MESSAGE_ID', sentMessage.id);

                // Mettre à jour RGPD_MESSAGE_CHANNEL_ID si le salon a été passé manuellement
                if (channelOption) {
                    updateEnvVariable('RGPD_MESSAGE_CHANNEL_ID', targetChannel.id);
                }

                const savedStatus = saved
                    ? '✅ `RGPD_MESSAGE_ID` mis à jour dans le `.env` automatiquement.'
                    : '⚠️ Impossible de mettre à jour le `.env` automatiquement (lecture seule ?). Copiez manuellement cet ID : `' + sentMessage.id + '`';

                const logChannelLink = process.env.RGPD_LOG_CHANNEL_ID ? `<#${process.env.RGPD_LOG_CHANNEL_ID}>` : '`NON CONFIGURÉ ❌`';

                await interaction.editReply(
                    `✅ **Message RGPD envoyé** dans <#${targetChannel.id}> avec succès !\n\n` +
                    `📌 ID du message : \`${sentMessage.id}\`\n` +
                    `📂 Salon de logs : ${logChannelLink}\n\n` +
                    savedStatus
                );

                console.log(`[RGPD] Message envoyé par ${interaction.user.username} dans #${targetChannel.name} — ID: ${sentMessage.id}`);
            }

            // /rgpd stats
            // ─────────────────────────────────────────────────────────
            if (sub === 'stats') {
                const { readLog } = require('../utils/rgpdConsentManager');
                const logs = readLog();

                if (!logs || logs.length === 0) {
                    return interaction.editReply('📊 **Journal vide.** Aucun mouvement enregistré pour le moment.');
                }

                // Calcul des stats (état actuel par utilisateur = dernière entrée)
                const latestByUser = new Map();
                for (const entry of logs) {
                    const existing = latestByUser.get(entry.userId);
                    if (!existing || entry.timestamp > existing.timestamp) {
                        latestByUser.set(entry.userId, entry);
                    }
                }

                const statuses = [...latestByUser.values()].map(e => e.status);
                const accepted = statuses.filter(s => s === 'accepted').length;
                const declined = statuses.filter(s => s === 'declined').length;
                const revoked = statuses.filter(s => s === 'revoked').length;
                const totalMembers = latestByUser.size;

                const responseEmbed = new EmbedBuilder()
                    .setTitle('📊 Statistiques RGPD — Droit à l\'image')
                    .setDescription(`Suivi du consentement sur le serveur **${interaction.guild.name}**`)
                    .setColor(0x5865F2)
                    .addFields(
                        { name: '✅ Consentements actifs', value: `**${accepted}**`, inline: true },
                        { name: '🔄 Révocations', value: `**${revoked}**`, inline: true },
                        { name: '❌ Refus directs', value: `**${declined}**`, inline: true },
                        { name: '👥 Membres uniques', value: `**${totalMembers}**`, inline: false },
                        { name: '📁 Total entrées journal', value: `**${logs.length}**`, inline: false }
                    )
                    .setFooter({ text: 'Dionysos Bordeaux • RGPD' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [responseEmbed] });
            }

        } catch (error) {
            console.error('[RGPD] Erreur commande /rgpd :', error);
            await logError(interaction.client, 'Erreur /rgpd', interaction.user, error);
            if (!interaction.replied) {
                await interaction.editReply('❌ Une erreur est survenue.').catch(() => { });
            }
        }
    },
};
