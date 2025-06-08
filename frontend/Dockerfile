FROM node:18.20.8-alpine
WORKDIR /app
COPY package*.json ./
RUN npm cache clean --force && npm install
COPY . .
EXPOSE 8080
CMD ["npx", "http-server", ".", "-p", "8080"]
