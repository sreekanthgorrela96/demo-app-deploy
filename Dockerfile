FROM node:20-alpine AS test
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY tests ./tests
RUN npm test

FROM node:20-alpine
WORKDIR /app
RUN apk upgrade --no-cache && \
    addgroup -S app && adduser -S app -G app && \
    rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /opt/yarn-* && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY package.json ./
COPY src ./src
USER app
EXPOSE 8080
ENV PORT=8080
CMD ["node", "src/server.js"]
