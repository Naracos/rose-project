const path = require('path');
const fs = require('fs');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

// ================================================================
//  📁 RGPD/config.js — Configuration du système droit à l'image
//  Modifiez ce fichier pour personnaliser les messages et l'embed.
// ================================================================

// Emojis de consentement
const EMOJI_ACCEPT = '✅';
const EMOJI_DECLINE = '❌';

// Chemin vers les fichiers
const RGPD_PDF_PATH = path.join(__dirname, 'droit_image_Dionysos-Bordeaux.pdf');
const RGPD_ASSETS_DIR = path.join(__dirname, 'assets');

// Créer le dossier assets s'il n'existe pas
if (!fs.existsSync(RGPD_ASSETS_DIR)) {
    fs.mkdirSync(RGPD_ASSETS_DIR, { recursive: true });
}

const HELP_IMAGES = {
    step1: path.join(RGPD_ASSETS_DIR, 'help_dm_1.png'),
    step2: path.join(RGPD_ASSETS_DIR, 'help_dm_2.png'),
    step3: path.join(RGPD_ASSETS_DIR, 'help_dm_3.png'),
};

/**
 * Retourne les messages pour la commande /rgpd setup
 * Chaque objet contient le content et optionnellement les files et si c'est le message interactif.
 */
function getRgpdSetupMessages() {
    return [
        // Message 1 : Intro + Ce que tu dois savoir + Comment donner son accord & Image 1
        {
            content:
                '# 📸 SOUVENIRS & DROIT À L\'IMAGE\n\n' +
                'Pour partager des photos/vidéos de nos sorties (sur ce serveur Discord, notre Instagram ou nos affiches), ' +
                'on applique une règle simple : **on diffuse une personne identifiable uniquement si elle a donné son accord explicite** (un acte positif clair).\n\n' +

                '### 📄 **CE QUE TU DOIS SAVOIR**\n' +
                'Le document PDF détaillé précisément :\n' +
                '- Les supports autorisés (Discord, Instagram, communication interne).\n' +
                '- L\'interdiction totale d\'usage commercial (on ne vend pas tes photos).\n' +
                '- Ton droit de retirer ton accord à tout moment, simplement.\n\n' +

                '### ✅ **COMMENT DONNER TON ACCORD ?**\n' +
                'C\'est très simple et ça prend une seconde :\n\n' +
                '1. **Lis le document PDF** ci-dessous pour être informé·e.\n' +
                '2. **Clique sur la réaction** ✅ en bas de ce message.\n\n' +
                '> **En cliquant sur ✅, tu confirmes avoir lu le document et tu autorises Dionysos à utiliser ton image selon les conditions décrites.** [CNIL](https://www.cnil.fr/fr/les-bases-legales/consentement)\n\n' +
                '💡 **Note importante :** Si tu reçois ce message :\n' +
                '*(Voir Image 1 ci-dessous)*',
            files: [
                { path: HELP_IMAGES.step1, name: 'help_dm_1.png' }
            ].filter(f => fs.existsSync(f.path)).map(f => new AttachmentBuilder(f.path, { name: f.name }))
        },

        // Message 2 : Aide DM & Images 2 et 3
        {
            content:
                'Pense à autoriser les DM et à désactiver les "demandes de message" pour ce serveur (clique sur le nom du serveur en haut de la liste des salons > **Paramètres de confidentialité**). En cas de souci, ouvre un ticket dans <#1329530277923393666> !\n' +
                '*(Voir Image 2 et 3 ci-dessous)*',
            files: [
                { path: HELP_IMAGES.step2, name: 'help_dm_2.png' },
                { path: HELP_IMAGES.step3, name: 'help_dm_3.png' }
            ].filter(f => fs.existsSync(f.path)).map(f => new AttachmentBuilder(f.path, { name: f.name }))
        },

        // Message 3 : Non-réponse, Changement d'avis & INTERACTIF
        {
            content:
                '### 🙈 **ET SI TU NE RÉAGIS PAS ? (NON-RÉPONSE = PAS D\'ACCORD)**\n' +
                'Si tu ne réagis pas (ou si tu ne veux pas donner ton accord), aucun souci :\n' +
                '- **Tu peux participer aux sorties normalement.**\n' +
                '- Si tu es identifiable sur une photo/vidéo, **tu seras flouté·e** avant toute publication ' +
                '(ou le contenu ne sera pas publié/sera recadré si le floutage n\'est pas possible).\n\n' +

                '### 🔁 **TU CHANGES D\'AVIS ?**\n' +
                'Tu peux retirer ton accord **à tout moment** (retire ta réaction ✅ ou contacte un/une modo) : ' +
                'le retrait doit être aussi simple que l\'accord.',
            files: [
                { path: RGPD_PDF_PATH, name: 'droit_image_Dionysos-Bordeaux.pdf' }
            ].filter(f => fs.existsSync(f.path)).map(f => new AttachmentBuilder(f.path, { name: f.name })),
            isInteractive: true
        }
    ];
}

// Garder l'ancienne fonction pour compatibilité si besoin, mais elle ne sera plus utilisée par /rgpd setup
function getRgpdText() {
    const msgs = getRgpdSetupMessages();
    return msgs.map(m => m.content).join('\n\n---\n\n');
}

// ----------------------------------------------------------------
// Message DM envoyé lors de l'ACCEPTATION (avec le PDF signé)
// ----------------------------------------------------------------
const DM_ACCEPT = (username) =>
    `Bonjour **${username}** ! 🎉\n\n` +
    `Nous avons bien enregistré votre consentement au droit à l\'image pour **Dionysos Bordeaux**.\n\n` +
    `📄 Vous trouverez ci-joint votre document signé électroniquement, conservez-le précieusement.\n\n` +
    `Merci de votre confiance et à bientôt lors de nos événements ! 🍷`;

// ----------------------------------------------------------------
// Message DM envoyé lors d'un REFUS (n'avait jamais accepté)
// ----------------------------------------------------------------
const DM_DECLINE = () =>
    `🖐️ **C'est noté !**\n` +
    `Ton refus a bien été enregistré.\n\n` +
    `- Tu peux participer à toutes les sorties normalement.\n` +
    `- Le staff fera de son mieux pour ne pas te prendre en photo ou te flouter ` +
    `(n'hésite pas à le signaler si tu es contre).\n` +
    `- ⚠️ **Si tu avais précédemment accepté** et que tu souhaites faire retirer des photos ` +
    `déjà publiées sur nos réseaux, merci de contacter le staff dès maintenant via un ticket dans <#1329530277923393666>.`;

// ----------------------------------------------------------------
// Message DM envoyé lors d'une RÉVOCATION (avait déjà accepté)
// ----------------------------------------------------------------
const DM_REVOKE = () =>
    `🖐️ **C'est noté !**\n` +
    `Ta révocation a bien été enregistrée.\n\n` +
    `- Tu peux participer à toutes les sorties normalement.\n` +
    `- Le staff fera de son mieux pour ne pas te prendre en photo ou te flouter ` +
    `(n'hésite pas à le signaler si tu es contre).\n` +
    `- ⚠️ **Attention :** si tu souhaites faire retirer des photos déjà publiées sur nos réseaux, ` +
    `merci de contacter le staff dès maintenant via un ticket dans <#1329530277923393666>.`;

module.exports = {
    EMOJI_ACCEPT,
    EMOJI_DECLINE,
    RGPD_PDF_PATH,
    getRgpdText,
    getRgpdSetupMessages,
    DM_ACCEPT,
    DM_DECLINE,
    DM_REVOKE,
};

