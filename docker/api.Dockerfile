FROM node:24-alpine
WORKDIR /usr/src/app

COPY api/package*.json ./
RUN npm install

# Copier le fichier d'entrée server.js (corrige MODULE_NOT_FOUND)
COPY api/server.js ./

COPY api/.env ./
COPY api/src/ ./src/
EXPOSE 3000
CMD ["npm", "start"]
