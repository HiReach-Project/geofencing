FROM node:12.18.0-alpine3.12

WORKDIR /var/www/data

COPY ./package.json .
COPY ./ecosystem.config.js .
COPY ./tsconfig.json .
COPY src ./src

RUN npm install --producton &&\
    npm install -g typescript pm2 &&\
    npm run tsc

EXPOSE 80

CMD pm2-runtime ecosystem.config.js --env production