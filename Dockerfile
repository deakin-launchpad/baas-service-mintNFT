FROM node:18-alpine

WORKDIR /usr/src/app

COPY . .

RUN npm install
RUN cp .env.example .env
EXPOSE 8080

CMD ["npm", "start"]
