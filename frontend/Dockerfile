FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
COPY node_modules ./node_modules
COPY .next ./.next
COPY public ./public

EXPOSE 3000

CMD ["npm", "start"]
