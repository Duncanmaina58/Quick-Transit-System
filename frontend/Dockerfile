FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY .next ./.next
COPY public ./public

EXPOSE 3000

CMD ["npm", "start"]
