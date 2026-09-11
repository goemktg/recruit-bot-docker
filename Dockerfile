FROM node:22-alpine AS build
WORKDIR /usr/src/app
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm ci
COPY ./src ./src
COPY ./tsconfig.json ./
RUN npm run build

FROM node:22-alpine AS install
WORKDIR /usr/src/app
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm ci --omit=dev

FROM gcr.io/distroless/nodejs22-debian12:latest AS runtime
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/dist/ ./
COPY --from=install /usr/src/app/node_modules ./node_modules

CMD [ "index.js" ]