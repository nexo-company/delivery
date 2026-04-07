#!/bin/sh
set -e
# Diretório gravável para SQLite em file:/data/dev.db (volume opcional na Railway).
mkdir -p /data

echo "[start] PORT=${PORT:-4000}"
if [ -z "${DATABASE_URL:-}" ]; then
  echo "[start] DATABASE_URL vazio — usando file:/data/dev.db"
  export DATABASE_URL="file:/data/dev.db"
fi

echo "[start] prisma db push…"
npx prisma db push

echo "[start] node dist/index.js"
exec node dist/index.js
