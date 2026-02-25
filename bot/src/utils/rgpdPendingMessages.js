// ================================================================
//  src/utils/rgpdPendingMessages.js
//  Gestionnaire des messages DM de confirmation RGPD en attente.
//  Permet l'anti-spam, l'auto-delete et la suppression sur action.
// ================================================================

// Délai avant suppression automatique du message de confirmation (ms)
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// Map : userId → { message: DM Message, timeoutHandle: NodeJS.Timeout }
const pending = new Map();
// Simple lock pour éviter les accès concurrents lors de la création/suppression
const locks = new Set();

/**
 * Enregistre un nouveau message DM de confirmation pour un utilisateur.
 * Si un message précédent existe, il est annulé et supprimé.
 */
async function setPendingMessage(userId, dmMessage) {
    if (locks.has(userId)) return;
    locks.add(userId);

    try {
        // Annuler et supprimer l'éventuel message précédent
        await clearPendingMessage(userId);

        // Programmer l'auto-suppression
        const timeoutHandle = setTimeout(async () => {
            try { await dmMessage.delete(); } catch (_) { }
            pending.delete(userId);
            console.log(`[RGPD] Message de confirmation expiré pour ${userId}`);
        }, TIMEOUT_MS);

        pending.set(userId, { message: dmMessage, timeoutHandle });
    } finally {
        locks.delete(userId);
    }
}

/**
 * Annule le timer et supprime le message DM en attente d'un utilisateur.
 */
async function clearPendingMessage(userId) {
    const entry = pending.get(userId);
    if (!entry) return;

    clearTimeout(entry.timeoutHandle);
    try {
        await entry.message.delete();
        console.log(`[RGPD] Message DM précédent supprimé pour ${userId}`);
    } catch (_) { }
    pending.delete(userId);
}

/**
 * Vérifie si un message en attente existe pour l'utilisateur.
 * @param {string} userId
 * @returns {boolean}
 */
function hasPendingMessage(userId) {
    return pending.has(userId);
}

module.exports = { setPendingMessage, clearPendingMessage, hasPendingMessage, TIMEOUT_MS };
