const { Events } = require('discord.js');
const logAction = require('../utils/actionLogger');

module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    if (newMember.guild.id !== process.env.GUILD_ID) return;

    const autobanRoleId = process.env.ROLE_ID_AUTOBAN;
    if (!autobanRoleId) return;

    const hadRole = oldMember.roles.cache.has(autobanRoleId);
    const hasRole = newMember.roles.cache.has(autobanRoleId);

    // Déclenché uniquement si l'utilisateur prend/reçoit le rôle autoban
    if (!hadRole && hasRole) {
      let banSuccess = false;
      let banError = null;

      try {
        if (newMember.bannable) {
          await newMember.ban({ reason: "Système automatique : Rôle autoban" });
          banSuccess = true;
        } else {
          // Si non bannable directement via newMember (problème hiérarchie), essayer via guild.members
          await newMember.guild.members.ban(newMember.id, { reason: "Système automatique : Rôle autoban" });
          banSuccess = true;
        }
      } catch (err) {
        // Essayer une dernière fois de forcer le ban via guild.members
        try {
          await newMember.guild.members.ban(newMember.id, { reason: "Système automatique : Rôle autoban" });
          banSuccess = true;
        } catch (banErr) {
          banError = banErr.message || banErr;
          console.error("[Autoban] Erreur lors du bannissement de l'utilisateur:", banErr);
        }
      }

      // Envoi du log d'action
      try {
        await logAction(
          newMember.client,
          `🚨 **Autoban déclenché par rôle**`,
          newMember.user,
          {
            roleId: autobanRoleId,
            roleName: newMember.guild.roles.cache.get(autobanRoleId)?.name || "Inconnu",
            bannissement: banSuccess ? "✅ Réussi" : `❌ Échoué : ${banError}`
          }
        );
      } catch (logErr) {
        console.error("[Autoban] Erreur d'enregistrement du log d'action:", logErr);
      }
    }
  },
};
