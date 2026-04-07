# Build a partir da pasta apps/api (defina como root no Railway/Fly, ou use -f apps/api/Dockerfile).
FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/
RUN npm install

COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

# SQLite: monte um volume em /data e use DATABASE_URL="file:/data/dev.db"
# Depois do primeiro deploy, rode o seed uma vez (Railway: npx prisma db seed).
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
