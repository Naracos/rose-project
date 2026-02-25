FROM node:20-slim
WORKDIR /usr/src/app

COPY bot/package*.json ./
RUN npm install --omit=dev

COPY bot/src/ ./src/
COPY bot/RGPD/ ./RGPD/
COPY bot/.env ./

CMD ["npm", "start"]
