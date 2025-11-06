# 🔌 Rose API - Backend REST

API REST pour la gestion des sorties du bot Discord Rose. Fournit les endpoints CRUD pour les sorties et la connexion MongoDB.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Endpoints](#-endpoints)
- [Modèle de données](#-modèle-de-données)
- [Développement](#-développement)

## ✨ Fonctionnalités

- ✅ **CRUD complet** pour les sorties
- ✅ **Recherche par ID** et **par messageId**
- ✅ **Validation automatique** avec Mongoose
- ✅ **Logs détaillés** pour debugging
- ✅ **Santé de l'API** (`/status`, `/api/health`)
- ✅ **Gestion d'erreurs** centralisée
- ✅ **CORS activé** pour développement

## 📦 Installation

```bash
cd api
npm install
```

## ⚙️ Configuration

Créer un fichier `.env` :

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/rose
NODE_ENV=development
```

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur | `3000` |
| `MONGODB_URI` | URI MongoDB | `mongodb://localhost:27017/rose` |
| `NODE_ENV` | Environnement | `development` |

## 🚀 Démarrage

### Développement (avec nodemon)

```bash
npm run dev
```

### Production

```bash
npm start
```

### Logs de démarrage

```bash
[DEBUG] Chargement des routes...
[DEBUG] Chargement de sortiesController...
[DEBUG] ✅ sortiesController chargé
[DEBUG] Chargement du router /api/sorties...
[DEBUG] ✅ Router /api/sorties configuré avec 5 routes
[DEBUG] ✅ Routes /api/sorties enregistrées
[DEBUG] Tentative connexion MongoDB: mongodb://localhost:27017/rose
[DEBUG] ✅ Connecté à MongoDB
[DEBUG] ✅ API démarrée sur http://localhost:3000
```

## 🔌 Endpoints

### Santé de l'API

#### `GET /status`

Vérifie le statut de l'API et MongoDB.

**Réponse :**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "mongodb": {
    "connected": true,
    "state": 1,
    "ping": 5
  }
}
```

**États MongoDB :**
- `0` : Déconnecté
- `1` : Connecté
- `2` : En cours de connexion
- `3` : En cours de déconnexion

#### `GET /api/health`

Version simplifiée du statut.

**Réponse :**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "mongodb": {
    "connected": true
  }
}
```

### Sorties

#### `POST /api/sorties`

Crée une nouvelle sortie.

**Body :**
```json
{
  "title": "Sortie au parc",
  "organizerId": "123456789012345678",
  "messageId": "987654321098765432",
  "channelId": "111222333444555666",
  "guildId": "777888999000111222",
  "participants": ["123456789012345678"]
}
```

**Réponse (201) :**
```json
{
  "_id": "690caba0579409889aaff132",
  "title": "Sortie au parc",
  "organizerId": "123456789012345678",
  "messageId": "987654321098765432",
  "channelId": "111222333444555666",
  "guildId": "777888999000111222",
  "participants": ["123456789012345678"],
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

#### `GET /api/sorties/:id`

Récupère une sortie par son ID MongoDB.

**Paramètres :**
- `id` : ID MongoDB de la sortie

**Réponse (200) :**
```json
{
  "_id": "690caba0579409889aaff132",
  "title": "Sortie au parc",
  "organizerId": "123456789012345678",
  "participants": ["123456789012345678", "111111111111111111"],
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Erreurs :**
- `404` : Sortie introuvable
- `500` : Erreur serveur

#### `GET /api/sorties/message/:messageId`

Récupère une sortie par son messageId Discord.

**Paramètres :**
- `messageId` : ID du message Discord

**Réponse (200) :**
```json
{
  "_id": "690caba0579409889aaff132",
  "messageId": "987654321098765432",
  "title": "Sortie au parc",
  "participants": ["123456789012345678"]
}
```

#### `PATCH /api/sorties/:id`

Met à jour certains champs d'une sortie.

**Champs autorisés :**
- `organizerDmMessageId`
- `organizerDmChannelId`
- `tableMessageId`
- `tableChannelId`
- `sortieUrl`
- `title`
- `meta`
- `saved`
- `savedAt`
- `participants`

**Body :**
```json
{
  "title": "Nouveau titre",
  "participants": ["123", "456", "789"]
}
```

**Réponse (200) :**
```json
{
  "_id": "690caba0579409889aaff132",
  "title": "Nouveau titre",
  "participants": ["123", "456", "789"],
  "updatedAt": "2024-01-01T12:05:00.000Z"
}
```

#### `PATCH /api/sorties/:id/participants`

Met à jour uniquement les participants.

**Body :**
```json
{
  "participants": ["123", "456"]
}
```

**Réponse (200) :**
```json
{
  "_id": "690caba0579409889aaff132",
  "participants": ["123", "456"],
  "updatedAt": "2024-01-01T12:10:00.000Z"
}
```

## 📊 Modèle de données

### Sortie (Schema Mongoose)

```javascript
{
  title: {
    type: String,
    required: false
  },
  organizerId: {
    type: String,
    required: true,
    index: true
  },
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  channelId: {
    type: String,
    required: true
  },
  guildId: {
    type: String,
    required: true
  },
  participants: {
    type: [String],
    default: []
  },
  organizerDmMessageId: String,
  organizerDmChannelId: String,
  tableMessageId: String,
  tableChannelId: String,
  sortieUrl: String,
  meta: {
    type: Object,
    default: {}
  },
  saved: {
    type: Boolean,
    default: false
  },
  savedAt: Date
}
```

**Timestamps automatiques :**
- `createdAt` : Date de création
- `updatedAt` : Date de dernière modification

**Index :**
- `messageId` : Unique
- `organizerId` : Standard

## 🛠️ Structure du code

```
api/
├── src/
│   ├── app.js                    # Configuration Express
│   ├── controllers/
│   │   └── sortiesController.js  # CRUD sorties
│   ├── models/
│   │   └── Sortie.js             # Schema Mongoose
│   ├── routes/
│   │   └── sorties.js            # Routes sorties
│   └── services/
│       └── apiClient.js          # Client HTTP (pour tests)
├── server.js                     # Point d'entrée
├── .env                          # Config (git ignoré)
├── .env.example                  # Template
└── package.json
```

## 🐛 Débogage

### Logs automatiques

Tous les appels API sont loggés :

```bash
[DEBUG] POST /api/sorties { "title": "Test", ... }
[DEBUG] Sortie créée: 690caba0579409889aaff132

[DEBUG] GET /api/sorties/690caba0579409889aaff132
[DEBUG] Sortie trouvée: Test

[DEBUG] PATCH /api/sorties/690caba0579409889aaff132 { "title": "Nouveau" }
[DEBUG] Sortie mise à jour: 690caba0579409889aaff132
```

### Tester l'API

**Avec curl :**

```bash
# Santé
curl http://localhost:3000/status

# Créer une sortie
curl -X POST http://localhost:3000/api/sorties \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","organizerId":"123","messageId":"456","channelId":"789","guildId":"000"}'

# Récupérer par ID
curl http://localhost:3000/api/sorties/690caba0579409889aaff132

# Récupérer par messageId
curl http://localhost:3000/api/sorties/message/987654321098765432
```

**Avec Postman/Insomnia :**
Importer la collection JSON (à créer).

## 📈 Performance

- **Cache** : Pas de cache pour l'instant (données temps réel)
- **Index MongoDB** : `messageId` (unique), `organizerId`
- **Pagination** : Pas implémentée (à ajouter si >1000 sorties)

## 🔒 Sécurité

⚠️ **Actuellement aucune authentification** : l'API est ouverte.

**À implémenter pour production :**
- JWT ou API Key
- Rate limiting
- Validation stricte des entrées
- HTTPS obligatoire

## 🚀 Améliorations futures

- [ ] Authentification JWT
- [ ] Pagination des résultats
- [ ] Filtres de recherche avancés
- [ ] Cache Redis
- [ ] Tests unitaires
- [ ] Documentation Swagger/OpenAPI
- [ ] Rate limiting
- [ ] Monitoring (Prometheus/Grafana)

## 📜 Licence

MIT License

---

**API développée pour le bot Discord Rose**