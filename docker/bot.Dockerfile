FROM node:20-slim
WORKDIR /usr/src/app

# Installer les dépendances avec des réglages de résilience
COPY bot/package*.json ./
RUN npm config set fetch-retry-maxtimeout 600000 && \
    npm install --omit=dev --no-audit --no-fund

# Copier le code et les dossiers vitaux
COPY bot/src/ ./src/
COPY bot/RGPD/ ./RGPD/
COPY bot/.env ./

CMD ["npm", "start"]
