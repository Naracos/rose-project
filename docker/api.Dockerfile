FROM node:22-alpine
WORKDIR /usr/src/app

COPY api/package*.json ./
RUN npm ci --only=production

# Copier le serveur et le code
COPY api/server.js ./
COPY api/src/ ./src/
COPY api/.env ./

EXPOSE 3000
CMD ["npm", "start"]
