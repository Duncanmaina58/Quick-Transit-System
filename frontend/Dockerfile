FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY .next ./.next
COPY public ./public
COPY node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]