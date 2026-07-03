FROM node:20-alpine AS test
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY tests ./tests
RUN npm test

FROM node:20-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY package.json ./
COPY src ./src
USER app
EXPOSE 8080
ENV PORT=8080
CMD ["node", "src/server.js"]
