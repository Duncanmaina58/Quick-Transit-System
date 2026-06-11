FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY .next ./.next
COPY public ./public

RUN npm install --omit=dev

EXPOSE 3000
CMD ["npm", "start"]