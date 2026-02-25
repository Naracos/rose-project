FROM node:20-slim
WORKDIR /usr/src/app

COPY api/package*.json ./
RUN npm config set fetch-retry-maxtimeout 600000 && \
    npm install --omit=dev --no-audit --no-fund

# Copier le serveur et le code
COPY api/server.js ./
COPY api/src/ ./src/
COPY api/.env ./

EXPOSE 3000
CMD ["npm", "start"]
