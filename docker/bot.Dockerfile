FROM node:24-alpine
WORKDIR /usr/src/app
COPY bot/package*.json ./
RUN npm install
COPY bot/.env ./
COPY bot/src/ ./src/
CMD ["npm", "start"]
