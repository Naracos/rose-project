const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { REST, Routes } = require('discord.js'); // Ajout pour l'enregistrement des commandes
require('dotenv').config();
const { logError } = require('./utils/logError');
const cron = require('node-cron');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

console.log('[DEBUG] Démarrage du bot...');


// Planifie le nettoyage tous les jours à 3h du matin
cron.schedule('0 22 04 * *', () => {
  const event = require('./utils/cleanOldForumPosts');
  event.execute(client);
}, {
  scheduled: true,
  timezone: "Europe/Paris"
});

console.log("⏰ Tâche de nettoyage des posts du forum planifiée (tous les jours à 3h).");

// Vérifications préliminaires
if (!token || !clientId || !guildId) {
  console.error('[DEBUG] Variables manquantes dans .env : DISCORD_TOKEN, CLIENT_ID ou GUILD_ID');
  process.exit(1);
} else {
  console.log('[DEBUG] Token et IDs chargés avec succès.');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildMembers
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.ThreadMember,
        Partials.GuildMember
    ]
});

client.commands = new Collection();

// Chargement des commandes
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

if (commandFiles.length > 0) {
  console.log('[DEBUG] Commandes détectées :');
  console.table(commandFiles.map(file => ({ Fichier: file })));

  // Charger les commandes dans la collection
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`[DEBUG] Commande chargée : ${command.data.name}`);
    } else {
      console.log(`[DEBUG] ⚠️ La commande ${file} est manquante "data" ou "execute"`);
    }
  }
} else {
  console.log('[DEBUG] Aucune commande détectée.');
}

// Enregistrement des commandes auprès de Discord
const commands = [];
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('[DEBUG] Enregistrement des commandes auprès de Discord...');
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );
    console.log('[DEBUG] ✅ Commandes enregistrées avec succès');
  } catch (error) {
    console.error('[DEBUG] ❌ Erreur lors de l\'enregistrement des commandes :', error);
  }
})();

// Chargement des événements
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

if (eventFiles.length > 0) {
  console.log('[DEBUG] Événements détectés :');
  console.table(eventFiles.map(file => ({ Fichier: file, Événement: require(path.join(eventsPath, file)).name || 'Non spécifié' })));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
} else {
  console.log('[DEBUG] Aucun événement détecté.');
}

// Écouteur pour les interactions (ajouté)
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.log(`[DEBUG] ⚠️ Commande introuvable : ${interaction.commandName}`);
    return;
  }

  try {
    console.log(`[DEBUG] Exécution de la commande : ${interaction.commandName} par ${interaction.user.tag}`);
    await command.execute(interaction);
  } catch (error) {
    console.error(`[DEBUG] ❌ Erreur lors de l'exécution de ${interaction.commandName} :`, error);
    await logError(client, `Erreur dans la commande ${interaction.commandName}`, interaction.user, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Une erreur est survenue lors de l\'exécution de cette commande.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Une erreur est survenue lors de l\'exécution de cette commande.', ephemeral: true });
    }
  }
});

// Écouteur pour l'événement "clientReady")
client.once('clientReady', (c) => {
  console.log(`[DEBUG] Bot connecté en tant que ${c.user.tag}`);
});

// Écouteur pour les erreurs globales
client.on('error', async error => {
  console.error('[DEBUG] Erreur globale du client :', error);
  await logError(client, 'Erreur globale du client', null, error);
});

// Écouteur pour les erreurs non capturées
process.on('uncaughtException', async error => {
  console.error('[DEBUG] Erreur non capturée :', error);
  await logError(client, 'Erreur non capturée', null, error);
});

// Écouteur pour les rejets de promesses non gérés
process.on('unhandledRejection', async (reason, promise) => {
  console.error('[DEBUG] Rejet de promesse non géré à :', promise, 'raison :', reason);
  await logError(client, 'Rejet de promesse non géré', null, reason);
});

console.log('[DEBUG] Tentative de connexion au client Discord...');
client.login(token)
  .then(() => console.log('[DEBUG] client.login() appelé avec succès.'))
  .catch(async error => {
    console.error('[DEBUG] Échec de client.login() :', error);
    await logError(client, 'Erreur de connexion', null, error);
  });
