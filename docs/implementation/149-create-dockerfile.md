# Step 149: Create Dockerfile

## Description

Create a multi-stage Dockerfile using Alpine-based Node images to produce a small, production-ready container. The builder stage compiles the app; the runner stage contains only what is needed to serve it.

## Requirements

- Create `Dockerfile` at the project root
- Multi-stage build with two stages:

**Stage 1: Builder**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
```

**Stage 2: Runner**

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
```

- Builder stage:
  - Uses `node:20-alpine` for small image size
  - Copies `package*.json` first for Docker layer caching (deps only re-install when lockfile changes)
  - `npm ci` for deterministic installs
  - `npx prisma generate` to generate the Prisma client
  - `npm run build` to build both Next.js frontend and custom server
- Runner stage:
  - Fresh `node:20-alpine` (no build tools, source code, or dev dependencies in final image)
  - Copies only production artifacts: `.next`, `dist`, `public`, `node_modules`, `package.json`, `prisma`, entrypoint script
  - Entrypoint is `docker-entrypoint.sh` (created in step 151) for database initialization
  - Default command is `node dist/server.js`
- Add a `.dockerignore` file to exclude: `node_modules`, `.next`, `dist`, `.env`, `.git`, `data`

## Files to Create/Modify

- `Dockerfile` — Create the multi-stage build file
- `.dockerignore` — Create to exclude unnecessary files from build context

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: `docker build -t scout-bingo .` completes successfully
- **Check**: Final image size is reasonable (< 500MB)
- **Check**: Running the container starts the Node.js server on port 3000
- **Command**: `docker build -t scout-bingo .`
- **Command**: `docker images scout-bingo` — check image size

## Commit

`feat(docker): create multi-stage Alpine Dockerfile for production build`
