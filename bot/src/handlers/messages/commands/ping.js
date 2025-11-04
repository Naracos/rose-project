const { EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const axios = require('axios');

module.exports = {
  name: "ping",
  description: "Affiche la latence du bot, de l'API Discord, de MongoDB et de l'API interne.",

  async execute(message) {
    const sent = await message.channel.send("🏓 Calcul du ping...");

    // === Mesure des latences ===
    const botLatency = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = Math.max(0, Math.round(message.client.ws.ping)); // évite le -1

    // === Ping MongoDB ===
    let mongoPing;
    const startMongo = Date.now();

    try {
      if (mongoose.connection.readyState === 1) { // connecté
        await mongoose.connection.db.admin().ping();
        mongoPing = `✅ ${Date.now() - startMongo} ms`;
      } else {
        mongoPing = "❌ Non connecté";
      }
    } catch (err) {
      mongoPing = "❌ Injoignable";
    }

    // === Ping API interne ===
    let internalPing;
    const startApi = Date.now();

    try {
      const apiUrl = (process.env.API_URL || "http://localhost:3000") + "/status";
      const response = await axios.get(apiUrl, { timeout: 2000 });

      if (response.status === 200) {
        internalPing = `✅ ${Date.now() - startApi} ms`;
      } else {
        internalPing = `⚠️ Code ${response.status}`;
      }
    } catch (err) {
      internalPing = "❌ Injoignable";
    }

    // === Création de l'embed ===
    const embed = new EmbedBuilder()
      .setColor(0x00AEFF)
      .setTitle("🏓 Statut du Bot et Services")
      .addFields(
        { name: "🤖 Latence du bot", value: `\`${botLatency} ms\``, inline: true },
        { name: "🌐 Latence API Discord", value: `\`${apiLatency} ms\``, inline: true },
        { name: "🗄️ MongoDB", value: `\`${mongoPing}\``, inline: true },
        { name: "🔗 API interne", value: `\`${internalPing}\``, inline: true },
      )
      .setFooter({ text: `Demandé par ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    await sent.edit({ content: null, embeds: [embed] });
  }
};
