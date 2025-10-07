// c:\Users\enzob\Desktop\Projet-perso\rose\deploy-commands.js
const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;
const clientId = process.env.CLIENT_ID;

if (!token || !guildId || !clientId) {
  console.error("Les variables d'environnement DISCORD_TOKEN, GUILD_ID, et CLIENT_ID sont requises.");
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Début du rafraîchissement des commandes slash.');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log('Commandes slash rafraîchies avec succès.');
  } catch (error) {
    console.error(error);
  }
})();
