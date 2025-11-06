const BASE_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * Effectue une requête HTTP vers l'API
 */
async function request(endpoint, options = {}) {
  // S'assurer que l'endpoint commence par /api si ce n'est pas déjà le cas
  const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  const url = `${BASE_URL}${normalizedEndpoint}`;
  
  console.log(`[DEBUG] API request: ${options.method || 'GET'} ${url}`);
  
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[DEBUG] API error ${response.status}: ${text}`);
    const error = new Error(text);
    error.status = response.status;
    error.body = text;
    throw error;
  }

  return response.json();
}

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

/**
 * Crée une sortie
 */
async function createSortie(payload) {
  return request('/sorties', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Met à jour une sortie
 */
async function updateSortie(sortieId, payload) {
  return request(`/sorties/${sortieId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

/**
 * Met à jour les participants d'une sortie
 */
async function updateParticipants(sortieId, participants) {
  return request(`/sorties/${sortieId}`, {
    method: 'PATCH',
    body: JSON.stringify({ participants })
  });
}

module.exports = {
  request,
  getSortieById,
  getSortieByMessageId,
  createSortie,
  updateSortie,
  updateParticipants
};