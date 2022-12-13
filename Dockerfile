FROM node:16-alpine

RUN apk add --update bash

WORKDIR /app

COPY . .

EXPOSE 8000

RUN npm install --silent

RUN cp .env.example .env

CMD ["npm", "start"]