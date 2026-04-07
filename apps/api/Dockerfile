# Build a partir da pasta apps/api (defina como root no Railway/Fly, ou use -f apps/api/Dockerfile).
FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/
RUN npm install

COPY tsconfig.json ./
COPY src ./src/
COPY scripts/docker-start.sh ./scripts/docker-start.sh
RUN chmod +x ./scripts/docker-start.sh

RUN npm run build

ENV NODE_ENV=production
# Padrão seguro em container: sempre gravável (com ou sem volume em /data).
ENV DATABASE_URL="file:/data/dev.db"

EXPOSE 4000

# SQLite: volume em /data na Railway mantém dados entre deploys.
# Seed (uma vez): Railway → Run npx prisma db seed
CMD ["./scripts/docker-start.sh"]
