# Step 151: Create Docker Entrypoint Script

## Description

Create the entrypoint script that runs before the main server process. It checks if the SQLite database exists and initializes it on first container start. This provides zero-config database setup for fresh deployments.

## Requirements

- Create `docker-entrypoint.sh` at the project root
- Exact contents:
  ```bash
  #!/bin/sh
  if [ ! -f /app/data/scout-bingo.db ]; then
    npx prisma db push
    npx prisma db seed
  fi
  exec "$@"
  ```
- Script behaviour:
  1. Check if `/app/data/scout-bingo.db` exists
  2. If the file does NOT exist (first run):
     - Run `npx prisma db push` to create the database schema from the Prisma schema
     - Run `npx prisma db seed` to seed initial data (template items, default values)
  3. If the file already exists (subsequent runs): skip initialization
  4. `exec "$@"` hands off to the CMD defined in the Dockerfile (`node dist/server.js`)
- The script uses `/bin/sh` (not bash) since Alpine does not include bash by default
- The file must be executable — the Dockerfile runs `chmod +x docker-entrypoint.sh` but also set the executable bit in git: `git update-index --chmod=+x docker-entrypoint.sh`
- The `/app/data` directory is backed by the Docker volume, so the database persists across container restarts

## Files to Create/Modify

- `docker-entrypoint.sh` — Create the entrypoint script at the project root

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: On first container start (empty volume), database is created and seeded — check container logs for Prisma output
- **Check**: On subsequent container starts (database exists), Prisma commands are skipped — container starts faster
- **Check**: The server process starts successfully after the entrypoint script completes
- **Check**: Script is executable: `ls -la docker-entrypoint.sh` shows `-rwxr-xr-x`
- **Command**: `docker compose up --build` — watch logs for first-run initialization
- **Command**: `docker compose restart` — watch logs to confirm Prisma commands are skipped

## Commit

`feat(docker): create entrypoint script for automatic database initialization`
