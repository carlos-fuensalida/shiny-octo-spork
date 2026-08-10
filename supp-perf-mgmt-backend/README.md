# Supplier Performance Management System — Data API (Backend A)

Backend A for the Supplier Performance Management System (SPMS) — the primary Data API the frontend calls for KPI data, authentication, saved filters, and supplier signed-URL access. Built with NestJS (TypeScript), targeting deployment on Google Cloud Run.

## What this service does

- Serves aggregated KPI data (Quality, Delivery) from a centralized BigQuery layer
- Handles Google Workspace SSO and session management (cookie-based)
- Generates and validates supplier signed URLs for the external supplier-facing limited view
- Persists saved filters and user preferences in Cloud SQL

Chat is a separate service (Backend B) and is never routed through this API.

## Getting started

Requires Node.js 22.x (see `.nvmrc`). If using `nvm`, run `nvm use` first.

```bash
npm install
npm run start:dev
```

Runs locally on `http://localhost:3000` by default (override with the `PORT` env var).

## Scripts

| Command | Purpose |
|---|---|
| `npm run start:dev` | Run locally with file-watch reload |
| `npm run build` | Compile for production |
| `npm run test` | Unit tests |
| `npm run test:e2e` | End-to-end tests |
| `npm run lint` | Lint and auto-fix |

## Specs

Full product and API specifications live in [`specs/`](./specs) — start with `specs/PRD-backend-a.md` for this service's architecture and `specs/API_SPEC.md` for the HTTP contract.

## CI/CD — testing the dev pipeline

This repo has its own [`bitbucket-pipelines.yml`](./bitbucket-pipelines.yml), tailored to this stack (Node 22 / NestJS) and currently scoped to the `dev` branch only. It is **not** the generic Python/`google/cloud-sdk` template used by other repos in this workspace — don't confuse the two.

Pipeline stages, in order:

1. **Lint, Test & Build** — `npm ci`, eslint, unit tests, e2e tests, `nest build`.
2. **Build & Push Docker Image** — builds the image from the [`Dockerfile`](./Dockerfile) and pushes it to Artifact Registry, tagged `<timestamp>-<build-number>` and `latest`.
3. **Deploy to Cloud Run (dev)** — deploys the image just pushed, then runs a smoke check against `<service-url>/api/v1`.

Auth to GCP uses Workload Identity Federation via each step's OIDC token — no long-lived service account keys.

### Required Bitbucket repo variables (dev)

These must exist under Repository settings → Repository variables for the pipeline to run at all:

| Variable | Purpose |
|---|---|
| `DEV_WORKLOAD_IDENTITY_PROVIDER_ID` | WIF provider used to exchange the OIDC token |
| `DEV_ENVIRONMENT_GCP_SERVICE_ACCOUNT` | Service account impersonated for build/push/deploy |
| `DEV_ENVIRONMENT_GCP_PROJECT_ID` | Target GCP project |
| `DEV_ENVIRONMENT_GCP_REGION` | Target region (Artifact Registry + Cloud Run) |
| `DEV_ENVIRONMENT_ARTIFACT_REGISTRY` | Artifact Registry repo name |

### Optional variables — safe to leave unset for a first run

The pipeline has built-in fallbacks for each of these, so **no hardcoding is needed to get an initial green run**:

| Variable | If unset |
|---|---|
| `DEV_ENVIRONMENT_FRONTEND_BASE_URL` | Falls back to a placeholder URL (`https://placeholder-frontend.dev.invalid`) so the app still boots (Joi requires this env var at startup). Set this for real once the frontend has a Cloud Run URL — CORS won't accept it until then. |
| `DEV_ENVIRONMENT_SESSION_JWT_SECRET_NAME` | Falls back to the hardcoded insecure dev JWT secret (`src/modules/auth/auth.module.ts`). Fine for a first smoke test, not fine to leave long-term. |
| `DEV_ENVIRONMENT_SESSION_COOKIE_DOMAIN` | Cookie `Domain` attribute is left unset. |
| `DEV_ENVIRONMENT_CLOUD_RUN_SERVICE_ACCOUNT` | Cloud Run revision runs as the project's default compute service account instead of a dedicated runtime identity. |

Unset optional variables print a `WARNING` line in the deploy step's log — that's expected, not a failure.

### Steps to test a run

1. Confirm the repo has **OpenID Connect enabled** (Repository settings → OpenID Connect) — required for the `oidc: true` steps to authenticate to GCP.
2. Confirm `DEV_ENVIRONMENT_GCP_SERVICE_ACCOUNT` has permission to push to the Artifact Registry repo and to deploy/run Cloud Run in the target project.
3. Push a commit to (or merge into) the `dev` branch — the pipeline triggers automatically.
4. Watch it under Repository → Pipelines: `Lint, Test & Build` → `Build & Push Docker Image` → `Deploy to Cloud Run (dev)`.
5. On success, the last step logs `Deployed successfully! Service URL: <url>` followed by the `/api/v1` smoke check's HTTP status.
6. Optional manual check: open `<service-url>/api/v1`, or run `gcloud run services describe <service-name> --region <region> --project <project-id>`.

`qa`/`main` branch pipelines are intentionally not wired up yet — add them the same way once their GCP projects/variables exist.

## Development conventions

See `CLAUDE.md` for architecture rules, the auth model, and the branching/ticket workflow used on this repo.
