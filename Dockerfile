FROM node:21-slim
WORKDIR /usr/src/app
COPY ./package.json ./
RUN npm install
COPY ./index.js ./
COPY ./events/* ./events/
COPY ./commands/utility/* ./commands/utility/
COPY ./library/* ./library/
CMD [ "node", "index.js" ]
