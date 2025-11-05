// Serveur web avec proxy simple vers l'API (réécrit /sorties -> /api/sorties)
const express = require('express');
const path = require('path');
require('dotenv').config();

const rawApiUrl = 'http://127.0.0.1:3000';

// Normalise l'URL et s'assure d'utiliser le préfixe /api
const API_BASE = (() => {
  const u = rawApiUrl.replace(/\/+$/, '');
  return u.endsWith('/api') ? u : `${u}/api`;
})();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 8080;

// Serve static files (public/)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Proxy minimal pour /sorties -> {API_BASE}/sorties
app.get('/sorties', async (req, res) => {
  try {
    const url = new URL(`${API_BASE}/sorties`);
    Object.entries(req.query || {}).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach(val => url.searchParams.append(k, String(val)));
      else url.searchParams.append(k, String(v));
    });

    console.log(`Proxy vers: ${url.toString()}`);

    const apiRes = await fetch(url.toString(), { method: 'GET', headers: { Accept: 'application/json' } });
    const text = await apiRes.text().catch(() => '');

    // si HTML (ex: AdGuard ou mauvaise route), log et renvoyer message clair
    if (text && text.trim().startsWith('<')) {
      console.error('Erreur proxy API (HTML reçu) :', text.slice(0, 400));
      return res.status(apiRes.status || 502).json({ error: 'api_returned_html', details: 'Vérifier API_URL et proxy; AdGuard peut injecter du HTML pour localhost.' });
    }

    // sinon tenter JSON
    try {
      const json = text ? JSON.parse(text) : {};
      res.json(json);
    } catch (e) {
      console.error('Erreur parse JSON proxy:', e);
      res.status(502).json({ error: 'invalid_json_from_api', details: text });
    }
  } catch (err) {
    console.error('Erreur proxy interne:', err);
    res.status(500).json({ error: 'proxy_error', details: String(err.message || err) });
  }
});

// Proxy pour une sortie spécifique (optionnel)
app.get('/sorties/:id', async (req, res) => {
  try {
    const url = new URL(`${API_BASE}/sorties/${encodeURIComponent(req.params.id)}`);
    console.log(`Proxy vers: ${url.toString()}`);
    const apiRes = await fetch(url.toString(), { method: 'GET', headers: { Accept: 'application/json' } });
    const text = await apiRes.text().catch(() => '');
    if (!apiRes.ok) { console.error('Erreur proxy API:', text); res.status(apiRes.status).send(text); return; }
    try { res.json(JSON.parse(text)); } catch { res.send(text); }
  } catch (err) {
    console.error('Erreur proxy interne:', err);
    res.status(500).json({ error: 'proxy_error', details: String(err.message || err) });
  }
});

// Alternative robuste : middleware catch-all
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Serveur web démarré sur http://localhost:${port}`);
  console.log(`Proxy vers: ${API_BASE}/sorties`);
});
