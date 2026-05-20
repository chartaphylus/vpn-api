# ===== Build Stage =====
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# ===== Production Stage =====
FROM node:20-alpine AS runner

RUN apk add --no-cache wireguard-tools

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/index.js ./index.js
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "index.js"]
