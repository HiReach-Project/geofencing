FROM node:12.18.0-alpine3.12

WORKDIR /var/www/data

COPY ./package.json .
COPY ./ecosystem.config.js .
COPY ./tsconfig.json .
COPY src ./src

RUN npm install --producton && npm install -g typescript pm2

EXPOSE 80

ENTRYPOINT npm run serve:prod
