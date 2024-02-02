FROM node:latest
WORKDIR /usr/src/app
COPY ./package.json ./
RUN npm install
COPY ./*.js ./
COPY ./events/* ./events/
CMD [ "node", "index.js" ]
