# 🤖 Rose Bot - Client Discord

Bot Discord pour la gestion interactive des sorties et événements de la communauté Rose.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Commandes](#-commandes)
- [Events](#-events)
- [Développement](#-développement)

## ✨ Fonctionnalités

### 🎪 Gestion des sorties

- **Détection automatique** des threads dans les forums sorties
- **Message épinglé** avec réactions (✅ = participer)
- **Bouton "Ping Participants"** (réservé à l'organisateur)
- **Aperçu avant ping** avec confirmation éphémère
- **Cooldown anti-spam** (60s par défaut)
- **Synchronisation MongoDB** via API REST

### 📢 Commandes slash

| Commande | Description | Permissions |
|----------|-------------|-------------|
| `/ping` | Statut du bot, Discord API, MongoDB (bot + API) | Tous |
| `/ping-participants` | Notifie les participants avec aperçu | Organisateur |

### 🔘 Boutons interactifs

| Bouton | Action | Permissions |
|--------|--------|-------------|
| 📢 Ping Participants | Aperçu des participants | Organisateur |
| ✅ Confirmer | Envoie le ping | Organisateur |
| ❌ Annuler | Annule le ping | Organisateur |

### 📊 Logs & Monitoring

- **Logs d'actions** : Envoyés dans le salon configuré
- **Logs d'erreurs** : Détection automatique avec stack trace
- **Santé système** : Commande `/ping` avec statuts détaillés

## 📦 Installation

```bash
cd bot
npm install
```

## ⚙️ Configuration

### 1. Créer le fichier `.env`

```bash
cp .env.example .env
```

### 2. Remplir les variables

```bash
# ============================================
# 🤖 CONFIGURATION DISCORD BOT
# ============================================
DISCORD_TOKEN=votre_token_ici
CLIENT_ID=votre_client_id
GUILD_ID=votre_guild_id

# ============================================
# 🗄️ BASE DE DONNÉES & API
# ============================================
MONGODB_URI=mongodb://localhost:27017/rose
API_URL=http://localhost:3000

# ============================================
# 📢 SALONS SYSTÈME
# ============================================
WELCOME_CHANNEL_ID=id_salon_bienvenue
ERROR_LOG_CHANNEL_ID=id_salon_erreurs
ACTION_LOG_CHANNEL_ID=id_salon_actions

# ============================================
# 🎪 FORUMS SORTIES
# ============================================
SORTIES_PONCTUELLES_ID=id_forum_sorties
SORTIES_RECURRENTES_ID=id_forum_recurrentes

# ============================================
# 👑 RÔLES ÉQUIPE (STAFF)
# ============================================
ROLE_ID_ADMIN1=                              # Clé Fonda
ROLE_ID_ADMIN2=                              # Clé Admin
ROLE_ID_WELCOMERS=                           # Welcomers
ROLE_ID_ANIMATEURS=                          # Animateur/ice

# ============================================
# 👥 RÔLES MEMBRES
# ============================================
ROLE_ID_VERIFIED=                            # Membre vérifié
ROLE_ID_MAN=                                 # Homme
ROLE_ID_WOMAN=                               # Femme
ROLE_ID_NEW=                                 # Nouveau membre
```

### Variables obligatoires

| Variable | Description | Où trouver |
|----------|-------------|------------|
| `DISCORD_TOKEN` | Token du bot | [Discord Developer Portal](https://discord.com/developers/applications) → Bot → Token |
| `CLIENT_ID` | ID du bot | Developer Portal → Application ID |
| `GUILD_ID` | ID du serveur | Clic droit serveur → Copier l'ID (mode développeur activé) |
| `SORTIES_PONCTUELLES_ID` | ID forum sorties | Clic droit forum → Copier l'ID |

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
[DEBUG] Tentative de connexion au client Discord...
[DEBUG] ✅ Commandes enregistrées avec succès
[DEBUG] client.login() appelé avec succès.
Connecté en tant que BB-8#9381!
```

## 📝 Commandes

### `/ping`

Affiche le statut complet du bot et des services.

**Exemple de sortie :**

```
🏓 Statut du Bot et Services
🤖 Latence du bot: 120 ms
🌐 Latence API Discord: 85 ms
🗄️ MongoDB (Bot): ✅ 15 ms
🔗 API interne: ✅ 10 ms
🗄️ MongoDB (API): ✅ Connecté
```

**Permissions :** Aucune

### `/ping-participants`

Mentionne les participants d'une sortie avec aperçu éphémère.

**Utilisation :**
1. Taper `/ping-participants` dans un thread de sortie
2. Un message éphémère (visible uniquement par vous) s'affiche avec :
   - Liste des participants
   - Boutons **Confirmer** / **Annuler**
3. Cliquer sur **✅ Confirmer** pour envoyer le ping

**Permissions :** Organisateur de la sortie uniquement

**Cooldown :** 60 secondes

**Exemple d'aperçu :**

```
📢 Aperçu du ping participants

5 participant(s) seront notifié(s) :

@User1, @User2, @User3, @User4, @User5

[✅ Confirmer] [❌ Annuler]
```

## 🎯 Events

### `threadCreate`

Déclenché à la création d'un thread dans un forum sorties.

**Actions :**
1. Vérifie que c'est dans un forum configuré
2. Crée un message épinglé avec réaction ✅
3. Ajoute un bouton "📢 Ping Participants"
4. Enregistre la sortie via l'API

**Logs :**
```bash
✅ Message épinglé dans le thread Sortie au parc
[DEBUG] API request: POST http://localhost:3000/api/sorties
```

### `messageReactionAdd`

Déclenché quand un utilisateur réagit avec ✅.

**Actions :**
1. Vérifie que c'est le message épinglé
2. Ajoute l'utilisateur aux participants via API
3. Met à jour le message épinglé

**Logs :**
```bash
[DEBUG] Réaction ajoutée par User#1234
[DEBUG] API request: PATCH http://localhost:3000/api/sorties/690caba0579409889aaff132
```

### `messageReactionRemove`

Déclenché quand un utilisateur retire sa réaction ✅.

**Actions :**
1. Retire l'utilisateur des participants via API
2. Met à jour le message épinglé

### `interactionCreate`

Gère les commandes slash et boutons.

**Commandes slash :**
- `/ping`
- `/ping-participants`

**Boutons :**
- `ping_participants_*` → Aperçu
- `confirm_ping_*` → Confirmer
- `cancel_ping_*` → Annuler

## 🛠️ Structure du code

```
bot/
├── src/
│   ├── commands/                          # Commandes slash
│   │   ├── ping.js                        # /ping
│   │   └── ping-participants.js           # /ping-participants
│   │
│   ├── events/                            # Événements Discord
│   │   ├── ready.js                       # Bot prêt
│   │   ├── threadCreate.js                # Création thread
│   │   ├── messageReactionAdd.js          # Réaction ajoutée
│   │   ├── messageReactionRemove.js       # Réaction retirée
│   │   └── interactionCreate.js           # Interactions (slash + boutons)
│   │
│   ├── handlers/                          # Gestionnaires
│   │   ├── interactions/buttons/
│   │   │   ├── PingParticipants.js        # Bouton aperçu
│   │   │   ├── ConfirmPing.js             # Confirmer ping
│   │   │   └── CancelPing.js              # Annuler ping
│   │   ├── messages/commands/
│   │   │   └── ping.js                    # Commande !ping (legacy)
│   │   └── reactions/
│   │       └── sortieParticipants.js      # Gestion participants
│   │
│   ├── services/
│   │   └── apiClient.js                   # Client API REST
│   │
│   ├── utils/
│   │   ├── actionLogger.js                # Logs d'actions
│   │   ├── logError.js                    # Logs d'erreurs
│   │   ├── registerCommands.js            # Enregistrement commandes
│   │   └── pingParticipantsCooldown.js    # Gestion cooldown
│   │
│   └── index.js                           # Point d'entrée
│
├── .env                                   # Config (git ignoré)
├── .env.example                           # Template
└── package.json
```

## 🔧 Développement

### Ajouter une commande slash

1. **Créer le fichier** `src/commands/ma-commande.js` :

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ma-commande')
    .setDescription('Description de ma commande'),
  
  async execute(interaction) {
    await interaction.reply('Réponse de ma commande');
  }
};
```

2. **Redémarrer le bot** → La commande est auto-enregistrée

### Ajouter un bouton

1. **Créer le fichier** `src/handlers/interactions/buttons/MonBouton.js` :

```javascript
module.exports = {
  customId: 'mon_bouton_',  // Préfixe du customId
  
  async execute(interaction) {
    // Extraire les données du customId
    const data = interaction.customId.replace('mon_bouton_', '');
    
    await interaction.reply({
      content: `Bouton cliqué : ${data}`,
      flags: 64  // Ephemeral
    });
  }
};
```

2. **Utiliser le bouton** :

```javascript
const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

const button = new ButtonBuilder()
  .setCustomId('mon_bouton_123')
  .setLabel('Mon Bouton')
  .setStyle(ButtonStyle.Primary);

const row = new ActionRowBuilder().addComponents(button);

await channel.send({
  content: 'Message avec bouton',
  components: [row]
});
```

### Ajouter un event

1. **Créer le fichier** `src/events/monEvent.js` :

```javascript
module.exports = {
  name: 'messageCreate',  // Nom de l'event Discord.js
  once: false,            // false = plusieurs fois, true = une fois
  
  async execute(message, client) {
    console.log(`Message reçu: ${message.content}`);
  }
};
```

2. **Redémarrer le bot** → L'event est auto-enregistré

## 🐛 Débogage

### Activer le mode debug

```bash
# .env
DEBUG_MODE=true
```

### Logs détaillés

Tous les logs importants sont préfixés `[DEBUG]` :

```bash
[DEBUG] Bouton Ping Participants cliqué pour sortie: 690caba0579409889aaff132
[DEBUG] Cooldown actif: 45s restantes
[DEBUG] Aperçu ping envoyé pour sortie 690caba0579409889aaff132
[DEBUG] ✅ Ping confirmé et envoyé: sortie=690caba0579409889aaff132, count=5
```

### Tester localement

1. Créer un serveur Discord de test
2. Inviter le bot avec ce lien :

```
https://discord.com/api/oauth2/authorize?client_id=VOTRE_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

3. Configurer `.env` avec l'ID du serveur test

## 📊 Permissions requises

Le bot nécessite ces permissions Discord :

```
Administrator (8)  # Pour simplifier, ou ces permissions spécifiques :

- View Channels (1024)
- Send Messages (2048)
- Manage Messages (8192)
- Embed Links (16384)
- Attach Files (32768)
- Read Message History (65536)
- Add Reactions (64)
- Use Slash Commands (2147483648)
- Manage Threads (34359738368)
- Create Public Threads (34359738368)
```

**Lien d'invitation avec permissions :**
```
https://discord.com/api/oauth2/authorize?client_id=VOTRE_CLIENT_ID&permissions=1099780063296&scope=bot%20applications.commands
```

## 🚀 Améliorations futures

- [ ] Commande `/sortie create` pour créer manuellement
- [ ] Commande `/sortie edit` pour modifier
- [ ] Système de rappels avant la sortie
- [ ] Export Excel des participants
- [ ] Statistiques des sorties
- [ ] Système de notation post-sortie
- [ ] Multi-serveurs
- [ ] Dashboard web

## 📜 Licence

MIT License

---

**Bot développé pour la communauté Rose**