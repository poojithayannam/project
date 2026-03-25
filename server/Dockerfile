# Build Stage
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Production Stage
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy essentially required components from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/server.js ./
COPY --from=builder /usr/src/app/models ./models
COPY --from=builder /usr/src/app/controllers ./controllers
COPY --from=builder /usr/src/app/routes ./routes
COPY --from=builder /usr/src/app/middleware ./middleware
COPY --from=builder /usr/src/app/services ./services
COPY --from=builder /usr/src/app/utils ./utils

EXPOSE 5000

ENV NODE_ENV=production

# Graceful degradation failovers rely on memory arrays if Mongo is offline
CMD ["npm", "start"]
