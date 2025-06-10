FROM node:18.20.8-alpine
WORKDIR /app
COPY package*.json ./
RUN npm cache clean --force && npm install && npm install --save-dev autoprefixer
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npx", "http-server", "dist", "-p", "8080"]
