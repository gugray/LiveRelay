FROM node:alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY src-server ./src-server

CMD ["node", "src-server/server.js"]
