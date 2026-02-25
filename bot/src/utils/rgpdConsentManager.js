const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '..', '..', 'RGPD', 'data', 'consent_log.json');

/**
 * Lit le fichier de log JSON.
 * @returns {Array} tableau des entrées de consentement
 */
function readLog() {
    try {
        if (!fs.existsSync(LOG_PATH)) {
            fs.writeFileSync(LOG_PATH, '[]', 'utf-8');
        }
        return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
    } catch (e) {
        console.error('[RGPD] Erreur lecture consent_log.json:', e.message);
        return [];
    }
}

/**
 * Écrit le tableau dans le fichier de log JSON.
 * @param {Array} data
 */
function writeLog(data) {
    fs.writeFileSync(LOG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Récupère l'entrée d'un utilisateur (la plus récente).
 * @param {string} userId
 * @returns {object|null}
 */
function getUserEntry(userId) {
    const logs = readLog();
    // La plus récente en premier
    const sorted = logs.filter(e => e.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0] || null;
}

/**
 * Récupère le statut actuel d'un utilisateur.
 * @param {string} userId
 * @returns {'accepted'|'declined'|'revoked'|'none'}
 */
function getCurrentStatus(userId) {
    const entry = getUserEntry(userId);
    return entry ? entry.status : 'none';
}

/**
 * Vérifie si un utilisateur a un consentement actif (status === 'accepted').
 * @param {string} userId
 * @returns {boolean}
 */
function hasActiveConsent(userId) {
    return getCurrentStatus(userId) === 'accepted';
}

/**
 * Enregistre un consentement (acceptation, refus ou révocation).
 * @param {string} userId
 * @param {string} username
 * @param {'accepted'|'declined'|'revoked'} status
 * @param {string|null} pdfFile - nom du fichier PDF (si acceptation)
 */
function recordConsent(userId, username, status, pdfFile = null) {
    const logs = readLog();
    const entry = {
        userId,
        username,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        status,
    };
    if (pdfFile) entry.pdfFile = pdfFile;
    logs.push(entry);
    writeLog(logs);
    console.log(`[RGPD] Consentement enregistré: ${username} (${userId}) → ${status}`);
    return entry;
}

module.exports = { readLog, getUserEntry, getCurrentStatus, hasActiveConsent, recordConsent };
