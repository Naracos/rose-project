module.exports = {
  customId: 'cancel_ping_',
  async execute(interaction) {
    try {
      const sortieId = interaction.customId.replace('cancel_ping_', '');
      console.log(`[DEBUG] Annulation ping pour sortie: ${sortieId}`);

      await interaction.update({
        content: '❌ Ping annulé.',
        embeds: [],
        components: []
      });

      console.log(`[DEBUG] Ping annulé pour sortie ${sortieId}`);
    } catch (err) {
      console.error('Erreur CancelPing button:', err);
      try {
        await interaction.update({ 
          content: '❌ Une erreur est survenue.', 
          embeds: [],
          components: []
        }).catch(() => {});
      } catch (e) {
        console.error('Erreur update fallback:', e.message);
      }
    }
  }
};