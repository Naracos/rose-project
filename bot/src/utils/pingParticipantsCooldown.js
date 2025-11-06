/**
 * Gestion du cooldown pour le ping des participants
 * Partagé entre la commande /ping-participants et le bouton ping_participants_
 */

const COOLDOWN_SECONDS = 60;
const cooldowns = new Map(); // key: sortieId -> timestamp (ms)

/**
 * Vérifie si le cooldown est actif pour une sortie
 * @param {string} sortieId - ID de la sortie
 * @returns {number|null} - Temps restant en secondes ou null si pas de cooldown
 */
function checkCooldown(sortieId) {
  const now = Date.now();
  
  if (cooldowns.has(sortieId)) {
    const expirationTime = cooldowns.get(sortieId) + COOLDOWN_SECONDS * 1000;
    if (now < expirationTime) {
      const remaining = Math.ceil((expirationTime - now) / 1000);
      return remaining;
    }
  }
  
  return null;
}

/**
 * Enregistre un cooldown pour une sortie
 * @param {string} sortieId - ID de la sortie
 */
function setCooldown(sortieId) {
  const now = Date.now();
  cooldowns.set(sortieId, now);
  console.log(`[DEBUG] Cooldown enregistré pour sortie ${sortieId} (${COOLDOWN_SECONDS}s)`);
}

/**
 * Nettoie les cooldowns expirés (optionnel, pour éviter les fuites mémoire)
 */
function cleanExpiredCooldowns() {
  const now = Date.now();
  for (const [sortieId, timestamp] of cooldowns.entries()) {
    if (now > timestamp + COOLDOWN_SECONDS * 1000) {
      cooldowns.delete(sortieId);
      console.log(`[DEBUG] Cooldown expiré supprimé: ${sortieId}`);
    }
  }
}

// Nettoyer les cooldowns expirés toutes les 5 minutes
setInterval(cleanExpiredCooldowns, 5 * 60 * 1000);

module.exports = {
  checkCooldown,
  setCooldown,
  COOLDOWN_SECONDS
};