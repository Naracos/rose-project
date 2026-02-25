FROM node:20
WORKDIR /usr/src/app

COPY bot/package*.json ./
RUN npm install

COPY bot/src/ ./src/
COPY bot/RGPD/ ./RGPD/
COPY bot/.env ./

CMD ["npm", "start"]
