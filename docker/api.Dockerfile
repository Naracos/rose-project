FROM node:20
WORKDIR /usr/src/app

COPY api/package*.json ./
RUN npm install

COPY api/server.js ./
COPY api/src/ ./src/
COPY api/.env ./

EXPOSE 3000
CMD ["npm", "start"]
