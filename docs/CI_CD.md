# CI/CD Pipeline

Morren uses GitHub Actions for validation and production deployment.

## Continuous integration

`.github/workflows/ci.yml` runs for pull requests and pushes to `main` or `develop`.
It performs:

- Frontend dependency installation, TypeScript checking, tests, and Next.js production build.
- Backend dependency installation and TypeScript production build.

## Continuous delivery

`.github/workflows/cd.yml` runs after pushes to `main` and can also be started manually from the GitHub Actions tab.

Create a GitHub Environment named `production`, then add these environment secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `RAILWAY_DEPLOY_HOOK_URL`

The Vercel steps deploy a prebuilt production artifact. The Railway step calls the project’s deploy hook, allowing Railway to build and deploy the backend using `backend/railway.json`.

Add these optional environment variables for post-deployment smoke tests:

- `FRONTEND_URL`, for example `https://your-frontend.vercel.app`
- `BACKEND_HEALTHCHECK_URL`, for example `https://your-backend.up.railway.app/health`

If a provider’s secrets are not configured, that provider’s deployment is skipped with a clear message. This keeps pull requests and initial repository setup safe while still making the pipeline ready for production once the environment is configured.

## Recommended protection

Configure the `production` environment with required reviewers and restrict deployments to `main`. Keep all provider tokens in GitHub Actions secrets; never commit them to the repository.
