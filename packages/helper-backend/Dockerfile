FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy over the source
COPY . .
RUN npm install && \
    npm run build

FROM node:22-alpine AS prod

WORKDIR /usr/src/app

# Copy over build code
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json

# Install production requirements
RUN npm install --omit=dev

# Expore the default port
EXPOSE 3001

CMD ["npm", "run", "start:prod"]
