FROM node:16-alpine

WORKDIR /usr/src/app

COPY . .

RUN npm install

RUN cp .env.example .env

ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
