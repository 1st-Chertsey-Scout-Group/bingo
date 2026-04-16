#!/bin/sh
set -e
npx prisma db push
npx prisma db seed
exec "$@"
