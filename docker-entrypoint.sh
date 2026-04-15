#!/bin/sh
if [ ! -f /app/data/scout-bingo.db ]; then
  npx prisma db push
  npx prisma db seed
fi
exec "$@"
