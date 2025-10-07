// c:\Users\enzob\Desktop\Projet-perso\rose\events\ready.js
const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(clientReady) {
    console.log(`Connecté en tant que ${clientReady.user.tag}!`);
  },
};
