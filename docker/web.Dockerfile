FROM node:24-alpine
WORKDIR /usr/src/app
COPY web/package*.json ./
RUN npm install
COPY web/public/ ./public/
COPY web/src/ ./src/
EXPOSE 8080
CMD ["npm", "start"]
