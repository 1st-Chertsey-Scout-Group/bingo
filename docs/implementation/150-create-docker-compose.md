# Step 150: Create Docker Compose Configuration

## Description
Create a `docker-compose.yml` that defines the single-service deployment with a persistent SQLite volume. This is the primary deployment method used by Coolify on the Hetzner VPS.

## Requirements
- Create `docker-compose.yml` at the project root
- Exact contents:
  ```yaml
  services:
    app:
      build: .
      ports:
        - "3000:3000"
      volumes:
        - sqlite-data:/app/data
      environment:
        - DATABASE_URL=file:/app/data/scout-bingo.db
        - NODE_ENV=production
      env_file: .env

  volumes:
    sqlite-data:
  ```
- Single service `app`:
  - Builds from the Dockerfile in the current directory
  - Maps port 3000 on host to port 3000 in container
  - Mounts a named volume `sqlite-data` to `/app/data` inside the container for persistent SQLite storage
  - Sets `DATABASE_URL` to point to the SQLite file inside the volume
  - Sets `NODE_ENV=production`
  - Loads additional environment variables (AWS credentials, ADMIN_PIN, etc.) from `.env` file
- Named volume `sqlite-data` persists across container restarts and rebuilds
- The `.env` file is NOT committed to git — it contains secrets (AWS keys, admin PIN)

## Files to Create/Modify
- `docker-compose.yml` — Create the Docker Compose configuration

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: `docker compose config` validates the file without errors
- **Check**: `docker compose up --build` builds the image and starts the container
- **Check**: SQLite database is created inside the volume at `/app/data/scout-bingo.db`
- **Check**: Container restarts preserve the database (data persists)
- **Command**: `docker compose config`
- **Command**: `docker compose up --build -d && docker compose logs -f app`

## Commit
`feat(docker): create docker-compose.yml with SQLite volume and env configuration`
