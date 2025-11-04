const rawUrl = process.env.API_URL || 'http://localhost:3000';
const API_TOKEN = process.env.API_TOKEN || '';

const API_BASE = (() => {
  const u = rawUrl.replace(/\/+$/, '');
  return u.endsWith('/api') ? u : `${u}/api`;
})();

async function request(path, options = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = { 'Content-Type': 'application/json', ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}) };
  const res = await fetch(url, { headers, ...options });
  const text = await res.text().catch(() => '');
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const err = new Error(`API ${res.status} ${res.statusText}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
    err.status = res.status; err.body = body; throw err;
  }
  return body;
}

module.exports = {
  request,
  createSortie: (payload) => request('/sorties', { method: 'POST', body: JSON.stringify(payload) }),
  getSortieByMessageId: (messageId) => request(`/sorties/message/${encodeURIComponent(messageId)}`),
  updateParticipants: (sortieId, participants) =>
    request(`/sorties/${encodeURIComponent(sortieId)}/participants`, { method: 'PATCH', body: JSON.stringify({ participants }) }),
  syncFromBot: (messageId, participants) =>
    request('/sorties/sync', { method: 'POST', body: JSON.stringify({ messageId, participants }) }),
  saveSortie: (id, meta) => request(`/sorties/${encodeURIComponent(id)}/save`, { method: 'POST', body: JSON.stringify({ meta }) }),
  // nouveau : patch partiel
  updateSortie: (id, fields) => request(`/sorties/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(fields) }),

  findOrCreateByMessageId: async (messageId, payload) => {
    try { return await module.exports.getSortieByMessageId(messageId); }
    catch (e) {
      if (e.status === 404) return module.exports.createSortie(payload);
      throw e;
    }
  }
};