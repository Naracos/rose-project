module.exports = {
  name: "ping",  // Nom de la commande (sans le préfixe !)
  description: "Répond Pong",

  async execute(message) {
    if (message.content.toLowerCase() === '!ping') {
      await message.reply('Pong !');
    }
  }
};
