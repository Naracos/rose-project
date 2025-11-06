/**
 * Récupère une sortie par son ID
 */
async function getSortieById(sortieId) {
  return request(`/sorties/${sortieId}`);
}

/**
 * Récupère une sortie par son messageId
 */
async function getSortieByMessageId(messageId) {
  return request(`/sorties/message/${messageId}`);
}

module.exports = {
  getSortieById,
  getSortieByMessageId,
  // ... autres exports
};