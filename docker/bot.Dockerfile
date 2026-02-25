FROM node:22-alpine
WORKDIR /usr/src/app

# Installer les dépendances
COPY bot/package*.json ./
RUN npm ci --only=production

# Copier le code et les dossiers vitaux
COPY bot/src/ ./src/
COPY bot/RGPD/ ./RGPD/
COPY bot/.env ./

CMD ["npm", "start"]
