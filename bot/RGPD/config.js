const path = require('path');
const { EmbedBuilder } = require('discord.js');

// ================================================================
//  📁 RGPD/config.js — Configuration du système droit à l'image
//  Modifiez ce fichier pour personnaliser les messages et l'embed.
// ================================================================

// Emojis de consentement
const EMOJI_ACCEPT = '✅';
const EMOJI_DECLINE = '❌';

// Chemin vers le PDF source joint au message RGPD
const RGPD_PDF_PATH = path.join(__dirname, 'droit_image_Dionysos-Bordeaux.pdf');

// ----------------------------------------------------------------
// Texte du message envoyé dans le salon RGPD (pas d'embed)
// ----------------------------------------------------------------
function getRgpdText() {
    return (
        '# 📸 SOUVENIRS & DROIT À L\'IMAGE\n\n' +
        'Chez **Dionysos**, on vit des moments incroyables et on adore en garder des souvenirs ! 🍇\n\n' +
        'Pour partager des photos/vidéos de nos sorties (sur ce serveur Discord, notre Instagram ou nos affiches), ' +
        'on applique une règle simple : **on diffuse une personne identifiable uniquement si elle a donné son accord explicite** (un acte positif clair).\n\n' +

        '### 📄 **CE QUE TU DOIS SAVOIR**\n' +
        'Le document PDF ci-joint détaille précisément :\n' +
        '- Les supports autorisés (Discord, Instagram, communication interne).\n' +
        '- L\'interdiction totale d\'usage commercial (on ne vend pas tes photos).\n' +
        '- Ton droit de retirer ton accord à tout moment, simplement.\n\n' +

        '### ✅ **COMMENT DONNER TON ACCORD ?**\n' +
        'C\'est très simple et ça prend une seconde :\n\n' +
        '1. **Lis le document PDF** ci-dessous pour être informé·e.\n' +
        '2. **Clique sur la réaction** ✅ en bas de ce message.\n\n' +
        '> **En cliquant sur ✅, tu confirmes avoir lu le document et tu autorises Dionysos à utiliser ton image selon les conditions décrites.** [CNIL](https://www.cnil.fr/fr/les-bases-legales/consentement)\n\n' +

        '### 🙈 **ET SI TU NE RÉAGIS PAS ? (NON-RÉPONSE = PAS D\'ACCORD)**\n' +
        'Si tu ne réagis pas (ou si tu ne veux pas donner ton accord), aucun souci :\n' +
        '- **Tu peux participer aux sorties normalement.**\n' +
        '- Si tu es identifiable sur une photo/vidéo, **tu seras flouté·e** avant toute publication ' +
        '(ou le contenu ne sera pas publié/sera recadré si le floutage n\'est pas possible).\n\n' +

        '### 🔁 **TU CHANGES D\'AVIS ?**\n' +
        'Tu peux retirer ton accord **à tout moment** (retire ta réaction ✅ ou contacte un/une modo) : ' +
        'le retrait doit être aussi simple que l\'accord.'
    );
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
    `déjà publiées sur nos réseaux, merci de contacter le staff dès maintenant via le système de ticket.`;

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
    `merci de contacter le staff dès maintenant via le système de ticket.`;

module.exports = {
    EMOJI_ACCEPT,
    EMOJI_DECLINE,
    RGPD_PDF_PATH,
    getRgpdText,
    DM_ACCEPT,
    DM_DECLINE,
    DM_REVOKE,
};
