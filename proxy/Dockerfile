FROM node:18.20.8-alpine
WORKDIR /app
COPY package*.json ./
RUN npm cache clean --force && npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
