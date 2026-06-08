FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./

RUN npm install --network-timeout 300000

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
