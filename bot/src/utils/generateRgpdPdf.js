const PDFDocument = require('pdfkit');
const { PDFDocument: PDFLibDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const PDF_OUTPUT_DIR = path.join(__dirname, '..', '..', 'RGPD', 'data', 'pdf');

/**
 * Génère un PDF de consentement au droit à l'image.
 * @param {string} userId     - ID Discord de l'utilisateur
 * @param {string} username   - Nom d'utilisateur Discord (ex: pseudo#0000 ou pseudo)
 * @param {Date}   acceptedAt - Date/heure d'acceptation
 * @returns {Promise<string>} - Chemin absolu du PDF généré
 */
async function generateRgpdPdf(userId, username, acceptedAt) {
    // Assure que le dossier de sortie existe
    if (!fs.existsSync(PDF_OUTPUT_DIR)) {
        fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
    }

    const timestamp = acceptedAt.getTime();
    const filename = `rgpd_${userId}_${timestamp}.pdf`;
    const outputPath = path.join(PDF_OUTPUT_DIR, filename);

    // Signature électronique : hash lisible basé sur les données
    const signatureRaw = `${username}|${userId}|${timestamp}`;
    const signatureHash = Buffer.from(signatureRaw).toString('base64').replace(/=/g, '').substring(0, 40);
    const signatureDisplay = `${signatureHash.substring(0, 10)}-${signatureHash.substring(10, 20)}-${signatureHash.substring(20, 30)}-${signatureHash.substring(30, 40)}`;

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 60 });
        const writeStream = fs.createWriteStream(outputPath);

        doc.pipe(writeStream);

        // ─── EN-TÊTE ───────────────────────────────────────────────
        doc
            .fillColor('#5865F2')
            .font('Helvetica-Bold')
            .fontSize(20)
            .text('Dionysos Bordeaux', { align: 'center' });

        doc
            .fillColor('#333333')
            .font('Helvetica')
            .fontSize(13)
            .text('Association de sorties et événements', { align: 'center' });

        doc.moveDown(0.5);

        // Ligne de séparation
        doc
            .strokeColor('#5865F2')
            .lineWidth(2)
            .moveTo(60, doc.y)
            .lineTo(535, doc.y)
            .stroke();

        doc.moveDown(1);

        // ─── TITRE ─────────────────────────────────────────────────
        doc
            .fillColor('#222222')
            .font('Helvetica-Bold')
            .fontSize(16)
            .text('FORMULAIRE DE CONSENTEMENT — DROIT À L\'IMAGE', { align: 'center' });

        doc.moveDown(1.5);

        // ─── CORPS ─────────────────────────────────────────────────
        doc
            .font('Helvetica')
            .fontSize(11)
            .fillColor('#333333')
            .text(
                'Je soussigné(e), membre de l\'association Dionysos Bordeaux, ' +
                'consens expressément à ce que des photographies, vidéos ou tout autre ' +
                'support audiovisuel me représentant soient réalisés lors des activités et ' +
                'événements organisés par l\'association.',
                { align: 'justify' }
            );

        doc.moveDown(0.8);

        doc.text(
            'Ces images pourront être utilisées par Dionysos Bordeaux à des fins de : ' +
            'communication interne, publication sur les réseaux sociaux de l\'association, ' +
            'promotion des activités, et archivage. Aucune utilisation commerciale ne sera faite ' +
            'sans accord explicite supplémentaire.',
            { align: 'justify' }
        );

        doc.moveDown(0.8);

        doc.text(
            'Ce consentement est donné librement et peut être révoqué à tout moment en ' +
            'contactant les responsables de l\'association ou via le système de gestion ' +
            'du serveur Discord.',
            { align: 'justify' }
        );

        doc.moveDown(2);

        // ─── INFORMATIONS D'IDENTIFICATION ─────────────────────────
        doc
            .strokeColor('#cccccc')
            .lineWidth(1)
            .rect(60, doc.y, 475, 120)
            .stroke();

        const boxTop = doc.y + 12;

        doc
            .fillColor('#5865F2')
            .font('Helvetica-Bold')
            .fontSize(11)
            .text('IDENTIFICATION', 72, boxTop);

        doc
            .fillColor('#333333')
            .font('Helvetica')
            .fontSize(10)
            .text(`Utilisateur Discord :`, 72, boxTop + 22)
            .font('Helvetica-Bold')
            .text(username, 200, boxTop + 22);

        doc
            .font('Helvetica')
            .text(`Identifiant Discord :`, 72, boxTop + 40)
            .font('Helvetica-Bold')
            .text(userId, 200, boxTop + 40);

        doc
            .font('Helvetica')
            .text(`Date d\'acceptation :`, 72, boxTop + 58)
            .font('Helvetica-Bold')
            .text(
                acceptedAt.toLocaleDateString('fr-FR', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                }) + ' à ' +
                acceptedAt.toLocaleTimeString('fr-FR', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                    timeZoneName: 'short'
                }),
                200, boxTop + 58
            );

        doc.moveDown(0.5);
        doc.y = boxTop + 132;

        doc.moveDown(2);

        // ─── SIGNATURE ÉLECTRONIQUE ────────────────────────────────
        const sigBoxTop = doc.y;

        doc
            .strokeColor('#5865F2')
            .lineWidth(1.5)
            .rect(60, sigBoxTop, 475, 90)
            .stroke();

        doc
            .fillColor('#5865F2')
            .font('Helvetica-Bold')
            .fontSize(11)
            .text('SIGNATURE ÉLECTRONIQUE', 72, sigBoxTop + 12);

        doc
            .fillColor('#555555')
            .font('Helvetica')
            .fontSize(8.5)
            .text('Empreinte cryptographique générée à partir des données d\'identification :', 72, sigBoxTop + 30);

        doc
            .fillColor('#222222')
            .font('Courier-Bold')
            .fontSize(10)
            .text(signatureDisplay, 72, sigBoxTop + 46, { characterSpacing: 1 });

        doc
            .fillColor('#888888')
            .font('Helvetica')
            .fontSize(7.5)
            .text(
                `Généré le ${acceptedAt.toISOString()} — Données : ${signatureRaw}`,
                72, sigBoxTop + 68,
                { ellipsis: true, width: 460 }
            );

        doc.y = sigBoxTop + 100;

        // ─── PIED DE PAGE ──────────────────────────────────────────
        doc.moveDown(2);

        doc
            .strokeColor('#5865F2')
            .lineWidth(1)
            .moveTo(60, doc.y)
            .lineTo(535, doc.y)
            .stroke();

        doc.moveDown(0.5);

        doc
            .fillColor('#888888')
            .font('Helvetica')
            .fontSize(8)
            .text(
                'Document généré automatiquement par le système de gestion RGPD de Dionysos Bordeaux. ' +
                'Ce document a valeur de preuve électronique de consentement.',
                { align: 'center' }
            );

        doc.end();

        writeStream.on('finish', () => resolve(outputPath));
        writeStream.on('error', reject);
    });
}

module.exports = { generateRgpdPdf, generateRgpdRevokePdf, generateFusedRgpdPdf };

/**
 * Génère un PDF de RÉVOCATION du consentement au droit à l'image.
 * @param {string} userId    - ID Discord de l'utilisateur
 * @param {string} username  - Nom d'utilisateur Discord
 * @param {Date}   revokedAt - Date/heure de révocation
 * @returns {Promise<string>} - Chemin absolu du PDF généré
 */
async function generateRgpdRevokePdf(userId, username, revokedAt) {
    if (!fs.existsSync(PDF_OUTPUT_DIR)) {
        fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
    }

    const timestamp = revokedAt.getTime();
    const filename = `rgpd_revoke_${userId}_${timestamp}.pdf`;
    const outputPath = path.join(PDF_OUTPUT_DIR, filename);

    const signatureRaw = `REVOKE|${username}|${userId}|${timestamp}`;
    const signatureHash = Buffer.from(signatureRaw).toString('base64').replace(/=/g, '').substring(0, 40);
    const signatureDisplay = `${signatureHash.substring(0, 10)}-${signatureHash.substring(10, 20)}-${signatureHash.substring(20, 30)}-${signatureHash.substring(30, 40)}`;

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 60 });
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);

        // ─── EN-TÊTE ───────────────────────────────────────────────
        doc
            .fillColor('#E67E22')
            .font('Helvetica-Bold')
            .fontSize(20)
            .text('Dionysos Bordeaux', { align: 'center' });

        doc
            .fillColor('#333333')
            .font('Helvetica')
            .fontSize(13)
            .text('Association de sorties et événements', { align: 'center' });

        doc.moveDown(0.5);

        doc
            .strokeColor('#E67E22')
            .lineWidth(2)
            .moveTo(60, doc.y)
            .lineTo(535, doc.y)
            .stroke();

        doc.moveDown(1);

        // ─── TITRE ─────────────────────────────────────────────────
        doc
            .fillColor('#333333')
            .font('Helvetica-Bold')
            .fontSize(16)
            .text('DÉCLARATION DE RÉVOCATION — DROIT À L\'IMAGE', { align: 'center' });

        doc.moveDown(1.5);

        // ─── CORPS ─────────────────────────────────────────────────
        doc
            .font('Helvetica')
            .fontSize(11)
            .fillColor('#333333')
            .text(
                'Je soussigné(e), membre de l\'association Dionysos Bordeaux, déclare par la présente ' +
                'révoquer expressément mon consentement précédemment accordé au droit à l\'image.',
                { align: 'justify' }
            );

        doc.moveDown(0.8);

        doc.text(
            'À compter de la date et heure indiquées ci-dessous, je retire mon autorisation à ' +
            'l\'association Dionysos Bordeaux d\'utiliser des photographies, vidéos ou tout autre ' +
            'support audiovisuel me représentant dans le cadre de ses activités.',
            { align: 'justify' }
        );

        doc.moveDown(0.8);

        doc.text(
            'Cette révocation concerne toutes les utilisations futures. Pour le retrait des contenus ' +
            'déjà publiés, je m\'engage à contacter le staff de l\'association via le système de ticket.',
            { align: 'justify' }
        );

        doc.moveDown(2);

        // ─── INFORMATIONS D'IDENTIFICATION ─────────────────────────
        doc
            .strokeColor('#cccccc')
            .lineWidth(1)
            .rect(60, doc.y, 475, 120)
            .stroke();

        const boxTop = doc.y + 12;

        doc
            .fillColor('#E67E22')
            .font('Helvetica-Bold')
            .fontSize(11)
            .text('IDENTIFICATION', 72, boxTop);

        doc
            .fillColor('#333333')
            .font('Helvetica')
            .fontSize(10)
            .text('Utilisateur Discord :', 72, boxTop + 22)
            .font('Helvetica-Bold')
            .text(username, 200, boxTop + 22);

        doc
            .font('Helvetica')
            .text('Identifiant Discord :', 72, boxTop + 40)
            .font('Helvetica-Bold')
            .text(userId, 200, boxTop + 40);

        doc
            .font('Helvetica')
            .text('Date de révocation :', 72, boxTop + 58)
            .font('Helvetica-Bold')
            .text(
                revokedAt.toLocaleDateString('fr-FR', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                }) + ' à ' +
                revokedAt.toLocaleTimeString('fr-FR', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                    timeZoneName: 'short'
                }),
                200, boxTop + 58
            );

        doc.y = boxTop + 132;
        doc.moveDown(2);

        // ─── SIGNATURE ÉLECTRONIQUE ────────────────────────────────
        const sigBoxTop = doc.y;

        doc
            .strokeColor('#E67E22')
            .lineWidth(1.5)
            .rect(60, sigBoxTop, 475, 90)
            .stroke();

        doc
            .fillColor('#E67E22')
            .font('Helvetica-Bold')
            .fontSize(11)
            .text('SIGNATURE ÉLECTRONIQUE — RÉVOCATION', 72, sigBoxTop + 12);

        doc
            .fillColor('#555555')
            .font('Helvetica')
            .fontSize(8.5)
            .text('Empreinte cryptographique de révocation :', 72, sigBoxTop + 30);

        doc
            .fillColor('#222222')
            .font('Courier-Bold')
            .fontSize(10)
            .text(signatureDisplay, 72, sigBoxTop + 46, { characterSpacing: 1 });

        doc
            .fillColor('#888888')
            .font('Helvetica')
            .fontSize(7.5)
            .text(
                `Révoqué le ${revokedAt.toISOString()} — Données : ${signatureRaw}`,
                72, sigBoxTop + 68,
                { ellipsis: true, width: 460 }
            );

        doc.y = sigBoxTop + 100;

        // ─── PIED DE PAGE ──────────────────────────────────────────
        doc.moveDown(2);

        doc
            .strokeColor('#E67E22')
            .lineWidth(1)
            .moveTo(60, doc.y)
            .lineTo(535, doc.y)
            .stroke();

        doc.moveDown(0.5);

        doc
            .fillColor('#888888')
            .font('Helvetica')
            .fontSize(8)
            .text(
                'Document généré automatiquement par le système de gestion RGPD de Dionysos Bordeaux. ' +
                'Ce document constitue une preuve électronique de révocation de consentement au sens du RGPD.',
                { align: 'center' }
            );

        doc.end();

        writeStream.on('finish', () => resolve(outputPath));
        writeStream.on('error', reject);
    });
}

/**
 * Génère un PDF fusionné : Document de base + Page de signature.
 * @param {string} userId
 * @param {string} username
 * @param {Date}   acceptedAt
 * @returns {Promise<string>} - Chemin du PDF fusionné
 */
async function generateFusedRgpdPdf(userId, username, acceptedAt) {
    const { RGPD_PDF_PATH } = require('../../RGPD/config');

    // 1. Générer la page de signature seule (via generateRgpdPdf existant)
    const signaturePagePath = await generateRgpdPdf(userId, username, acceptedAt);

    // 2. Vérifier si le document de base existe
    if (!fs.existsSync(RGPD_PDF_PATH)) {
        console.warn('[RGPD] PDF source introuvable pour la fusion, envoi de la signature seule.');
        return signaturePagePath;
    }

    try {
        const timestamp = acceptedAt.getTime();
        const fusedFilename = `rgpd_fused_${userId}_${timestamp}.pdf`;
        const fusedPath = path.join(PDF_OUTPUT_DIR, fusedFilename);

        // Charger les deux PDFs
        const basePdfBytes = fs.readFileSync(RGPD_PDF_PATH);
        const sigPdfBytes = fs.readFileSync(signaturePagePath);

        const basePdf = await PDFLibDocument.load(basePdfBytes);
        const sigPdf = await PDFLibDocument.load(sigPdfBytes);

        // Créer un nouveau document
        const mergedPdf = await PDFLibDocument.create();

        // Copier les pages du document de base
        const basePages = await mergedPdf.copyPages(basePdf, basePdf.getPageIndices());
        basePages.forEach(page => mergedPdf.addPage(page));

        // Copier les pages de la signature (normalement 1 seule)
        const sigPages = await mergedPdf.copyPages(sigPdf, sigPdf.getPageIndices());
        sigPages.forEach(page => mergedPdf.addPage(page));

        // Sauvegarder
        const mergedPdfBytes = await mergedPdf.save();
        fs.writeFileSync(fusedPath, mergedPdfBytes);

        return fusedPath;
    } catch (err) {
        console.error('[RGPD] Erreur fusion PDF :', err);
        return signaturePagePath; // Rollback sur la signature seule en cas d'erreur
    }
}
