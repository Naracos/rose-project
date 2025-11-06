# 🌹 Rose - Bot Discord de Gestion de Sorties

Bot Discord complet pour gérer les sorties et événements d'une communauté, avec API REST, base de données MongoDB et interface Discord interactive.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Structure du projet](#-structure-du-projet)
- [Technologies](#-technologies)
- [Contribution](#-contribution)

## ✨ Fonctionnalités

### 🎪 Gestion des Sorties
- **Création automatique** : Détecte les threads dans les forums sorties
- **Participants** : Système de réactions (✅) pour s'inscrire
- **Ping participants** : Commande et bouton pour notifier les inscrits
- **Aperçu avant envoi** : Confirmation éphémère avec liste des participants
- **Cooldown** : Protection anti-spam (60s par défaut)
- **Sauvegarde** : Persistance dans MongoDB via API REST

### 🤖 Commandes
- `/ping` : Statut du bot, API Discord, MongoDB (bot et API)
- `/ping-participants` : Notifie les participants d'une sortie (avec confirmation)

### 🔘 Boutons Interactifs
- **Ping Participants** : Accessible uniquement à l'organisateur
- **Confirmation/Annulation** : Aperçu éphémère avant envoi

### 📊 Logs & Monitoring
- **Logs d'actions** : Toutes les actions importantes tracées
- **Logs d'erreurs** : Détection et rapport automatique
- **Santé de l'API** : Vérification connexion MongoDB

## 🏗️ Architecture

```
rose/
├── api/          # API REST (Express + MongoDB)
├── bot/          # Bot Discord (Discord.js)
└── README.md     # Documentation principale
```

### Flux de données

```
Discord Thread → Bot Discord → API REST → MongoDB
                       ↓
                  Réactions ✅
                       ↓
              Participants enregistrés
                       ↓
          Ping avec confirmation éphémère
```

## 🔧 Prérequis

- **Node.js** >= 18.x
- **MongoDB** >= 6.x (local ou Atlas)
- **npm** ou **yarn**
- **Bot Discord** configuré sur le [Developer Portal](https://discord.com/developers/applications)

### Permissions requises pour le bot

```
- Envoyer des messages
- Gérer les messages
- Épingler des messages
- Gérer les threads
- Ajouter des réactions
- Utiliser les commandes slash
- Lire l'historique des messages
```

## 📦 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-repo/rose.git
cd rose
```

### 2. Installer les dépendances

```bash
# API
cd api
npm install

# Bot
cd ../bot
npm install
```

### 3. Configurer MongoDB

**Option A : MongoDB local**
```bash
# Windows
mongod --dbpath C:\data\db

# Linux/Mac
mongod --dbpath /data/db
```

**Option B : MongoDB Atlas (cloud)**
1. Créer un compte sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un cluster gratuit
3. Obtenir la chaîne de connexion

## ⚙️ Configuration

### 1. Configurer l'API

```bash
cd api
cp .env.example .env
```

Éditer `api/.env` :
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/rose
NODE_ENV=development
```

### 2. Configurer le Bot

```bash
cd bot
cp .env.example .env
```

Éditer `bot/.env` :
```bash
# Discord
DISCORD_TOKEN=votre_token_ici
CLIENT_ID=votre_client_id
GUILD_ID=votre_guild_id

# API
MONGODB_URI=mongodb://localhost:27017/rose
API_URL=http://localhost:3000

# Salons
WELCOME_CHANNEL_ID=id_salon_bienvenue
ERROR_LOG_CHANNEL_ID=id_salon_erreurs
ACTION_LOG_CHANNEL_ID=id_salon_actions

# Forums
SORTIES_PONCTUELLES_ID=id_forum_sorties
SORTIES_RECURRENTES_ID=id_forum_recurrentes

# Rôles (optionnel)
ROLE_ID_ADMIN1=id_role_admin
ROLE_ID_VERIFIED=id_role_verifie
# ... voir .env.example pour la liste complète
```

## 🚀 Utilisation

### Démarrage en développement

**Terminal 1 - API**
```bash
cd api
npm run dev
```

**Terminal 2 - Bot**
```bash
cd bot
npm run dev
```

### Démarrage en production

```bash
# API
cd api
npm start

# Bot
cd bot
npm start
```

### Utilisation Discord

1. **Créer une sortie** : Créer un thread dans le forum sorties
2. **S'inscrire** : Réagir avec ✅ sur le message épinglé
3. **Ping participants** : 
   - Commande : `/ping-participants`
   - Bouton : Cliquer sur "📢 Ping Participants"
4. **Confirmer** : Valider l'aperçu éphémère avec ✅

## 📁 Structure du projet

### API (`/api`)

```
api/
├── src/
│   ├── app.js                    # Configuration Express
│   ├── controllers/
│   │   └── sortiesController.js  # Logique CRUD sorties
│   ├── models/
│   │   └── Sortie.js             # Modèle MongoDB
│   ├── routes/
│   │   └── sorties.js            # Routes API
│   └── services/
│       └── apiClient.js          # Client HTTP (utilisé par bot)
├── server.js                     # Point d'entrée
├── .env                          # Configuration (ignoré par git)
├── .env.example                  # Template configuration
└── package.json
```

**Endpoints disponibles :**
- `GET /api/health` : Santé de l'API
- `GET /status` : Statut MongoDB
- `POST /api/sorties` : Créer une sortie
- `GET /api/sorties/:id` : Récupérer par ID
- `GET /api/sorties/message/:messageId` : Récupérer par messageId
- `PATCH /api/sorties/:id` : Mettre à jour
- `PATCH /api/sorties/:id/participants` : Mettre à jour participants

### Bot (`/bot`)

```
bot/
├── src/
│   ├── commands/
│   │   ├── ping.js                       # Commande /ping
│   │   └── ping-participants.js          # Commande /ping-participants
│   ├── events/
│   │   ├── ready.js                      # Bot prêt
│   │   ├── threadCreate.js               # Création thread
│   │   ├── messageReactionAdd.js         # Réaction ajoutée
│   │   └── messageReactionRemove.js      # Réaction retirée
│   ├── handlers/
│   │   ├── interactions/
│   │   │   └── buttons/
│   │   │       ├── PingParticipants.js   # Bouton ping
│   │   │       ├── ConfirmPing.js        # Confirmer ping
│   │   │       └── CancelPing.js         # Annuler ping
│   │   ├── messages/
│   │   │   └── commands/
│   │   │       └── ping.js               # Commande !ping (legacy)
│   │   └── reactions/
│   │       └── sortieParticipants.js     # Gestion participants
│   ├── services/
│   │   └── apiClient.js                  # Client API REST
│   ├── utils/
│   │   ├── actionLogger.js               # Logs actions
│   │   ├── logError.js                   # Logs erreurs
│   │   ├── registerCommands.js           # Enregistrement commandes
│   │   └── pingParticipantsCooldown.js   # Gestion cooldown
│   └── index.js                          # Point d'entrée
├── .env                                  # Configuration (ignoré par git)
├── .env.example                          # Template configuration
└── package.json
```

## 🛠️ Technologies

### Backend (API)
- **Express.js** 4.x - Framework web
- **Mongoose** 7.x - ODM MongoDB
- **CORS** - Gestion CORS
- **dotenv** - Variables d'environnement

### Bot Discord
- **Discord.js** 14.x - Bibliothèque Discord
- **Mongoose** 7.x - Connexion MongoDB
- **node-fetch** - Client HTTP
- **dotenv** - Variables d'environnement

### Base de données
- **MongoDB** 6.x - Base NoSQL

## 📝 Modèle de données

### Sortie (MongoDB)

```javascript
{
  _id: ObjectId,
  title: String,
  organizerId: String,
  messageId: String,
  channelId: String,
  guildId: String,
  participants: [String],
  organizerDmMessageId: String,
  organizerDmChannelId: String,
  tableMessageId: String,
  tableChannelId: String,
  sortieUrl: String,
  meta: Object,
  saved: Boolean,
  savedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🐛 Débogage

### Logs du bot
```bash
[DEBUG] Bouton Ping Participants cliqué pour sortie: 690caba0579409889aaff132
[DEBUG] Aperçu ping envoyé pour sortie 690caba0579409889aaff132
[DEBUG] ✅ Ping confirmé et envoyé: sortie=690caba0579409889aaff132, count=5
```

### Logs de l'API
```bash
[DEBUG] POST /api/sorties { "title": "Sortie test", ... }
[DEBUG] Sortie créée: 690caba0579409889aaff132
[DEBUG] GET /api/sorties/690caba0579409889aaff132
[DEBUG] Sortie trouvée: Sortie test
```

### Vérifier la santé

```bash
# Bot : commande Discord
/ping

# API : requête HTTP
curl http://localhost:3000/status
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📜 Licence

MIT License - voir [LICENSE](LICENSE)

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/votre-repo/rose/issues)
- **Discord** : [Votre serveur Discord](#)

---

**Développé avec ❤️ pour la communauté Rose**

