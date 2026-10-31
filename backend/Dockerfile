# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos e instalar dependencias (incluyendo devDeps para el build)
COPY package*.json ./
RUN npm ci

# Copiar fuentes y compilar
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar artefactos del builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

ENV NODE_ENV=production

EXPOSE 3000

# Ejecutar migraciones y arrancar
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

