# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos e instalar dependencias (incluyendo devDeps para el build)
COPY package*.json ./
RUN npm i

# Copiar fuentes y compilar
ARG DATABASE_URL
COPY . .
RUN npx prisma generate DATABASE_URL=$DATABASE_URL

RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Solo dependencias de producción
COPY package*.json ./
RUN npm i --omit=dev

# Copiar artefactos del builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

ENV NODE_ENV=production

EXPOSE 3000

# Ejecutar migraciones y arrancar
CMD ["sh", "-c", "npx prisma db push && node dist/main"]

