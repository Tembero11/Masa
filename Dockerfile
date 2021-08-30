FROM node:15.8.0

WORKDIR /bot

COPY package.json ./

RUN npm i

COPY ./ ./

CMD npm start