# CI/CD Pipeline

Morren uses GitHub Actions for validation and production deployment to a DigitalOcean Droplet.

## Continuous integration

`.github/workflows/ci.yml` runs for pull requests and pushes to `main` or `develop`.
It performs:

- Frontend dependency installation, TypeScript checking, tests, and Next.js production build.
- Backend dependency installation and TypeScript production build.

## Continuous delivery

`.github/workflows/cd.yml` runs after pushes to `main` and can also be started manually from the GitHub Actions tab.

Create a GitHub Environment named `production`, then add these environment secrets:

- `DIGITALOCEAN_HOST` — Droplet IP address or hostname.
- `DIGITALOCEAN_USER` — SSH deployment user, normally `morren`.
- `DIGITALOCEAN_SSH_KEY` — private key for that user.
- `DIGITALOCEAN_KNOWN_HOSTS` — the pinned `known_hosts` entry for the Droplet.
- `DIGITALOCEAN_PORT` — optional; defaults to `22`.

The workflow connects to the Droplet over SSH and runs `/opt/morren/deploy/deploy.sh` (or the configured app directory). That existing script creates a pre-deployment database backup, pulls `origin/main`, installs backend dependencies, builds TypeScript, runs migrations, reloads PM2, checks `/health`, and rolls back the application if the health check fails.

Add these optional production variables for post-deployment smoke tests and custom paths:

- `DIGITALOCEAN_APP_DIR`, defaults to `/opt/morren`.
- `DIGITALOCEAN_HEALTH_URL`, for example `https://api.example.com/health`.

If the DigitalOcean secrets are not configured, deployment is skipped with a clear message. This keeps pull requests and initial repository setup safe while making the pipeline ready for production once the environment is configured.

## Recommended protection

Configure the `production` environment with required reviewers and restrict deployments to `main`. Keep all provider tokens in GitHub Actions secrets; never commit them to the repository.
