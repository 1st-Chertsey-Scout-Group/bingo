# Step 153: Set Up Production Environment

> **MANUAL STEP** — requires human action.

## Description
Configure the production environment variables and deploy the app via Coolify on the Hetzner VPS. This is the final deployment step that makes the app accessible to users.

## Requirements
- Create or configure the `.env` file on the production server (or set environment variables in Coolify's UI):
  ```
  DATABASE_URL=file:/app/data/scout-bingo.db
  AWS_ACCESS_KEY_ID=<your-aws-access-key>
  AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
  AWS_REGION=<your-aws-region>
  S3_BUCKET_NAME=<your-s3-bucket-name>
  ADMIN_PIN=<chosen-admin-pin>
  NODE_ENV=production
  PORT=3000
  ```
- Environment variable details:
  - `DATABASE_URL` — Points to the SQLite file inside the Docker volume at `/app/data/scout-bingo.db`
  - `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` — IAM credentials with permission to generate presigned URLs and upload to the S3 bucket
  - `AWS_REGION` — The AWS region where the S3 bucket is hosted (e.g. `eu-west-2`)
  - `S3_BUCKET_NAME` — The name of the S3 bucket for photo uploads
  - `ADMIN_PIN` — The PIN used to access the admin/game-creation interface
  - `NODE_ENV` — Must be `production` for optimized builds and service worker registration
  - `PORT` — The port the server listens on inside the container (3000)
- Deployment steps:
  1. Push the code to the git repository connected to Coolify
  2. In Coolify, configure the project to use Docker Compose (`docker-compose.yml`)
  3. Set all environment variables in Coolify's environment configuration (or ensure `.env` is available)
  4. Trigger a deployment in Coolify
  5. Verify the container starts and the app is accessible via the configured domain
- Security considerations:
  - Never commit `.env` to git — it contains secrets
  - Use strong, unique values for `ADMIN_PIN`
  - Restrict the IAM user's permissions to only the S3 bucket needed
  - Ensure HTTPS is configured (Coolify/Caddy handles this with Let's Encrypt)

## Files to Create/Modify
- `.env` on the production server (NOT committed to git) — Set all environment variables
- Coolify project configuration — Configure Docker Compose deployment

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Container starts without errors — `docker compose logs app` shows no crashes
- **Check**: App is accessible at the production URL over HTTPS
- **Check**: Database is created on first start (check container logs for Prisma output)
- **Check**: Admin can create a game using the configured ADMIN_PIN
- **Check**: Photo uploads work (presigned URLs generated, photos uploaded to S3)
- **Check**: Service worker is registered (DevTools > Application > Service Workers)
- **Check**: PWA is installable (DevTools > Application > Manifest shows no errors)
- **Command**: `curl -I https://your-domain.com` — should return 200 OK

## Commit
`chore(deploy): document production environment setup and deployment process`
