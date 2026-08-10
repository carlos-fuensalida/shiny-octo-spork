# SPM-51 — Dockerization (Phase 1: Dockerfile)

**Branch:** `feature/SPM-51-backend-dockerfile`
**Status:** Draft
**Relates to:** `specs/PRD-backend-a.md` BE-A-C6, `specs/PRD.md` §6.2 C3, `CLAUDE.md` → Stack

## Summary

First step toward deploying Backend A to **GCP Cloud Run** via **Bitbucket Pipelines**. This ticket delivers only a working `Dockerfile` that produces a runnable production image locally — bare minimum, single stage, no hardening yet. Pipeline wiring, Artifact Registry push, and the actual Cloud Run service are deferred to follow-up tickets once the image is proven to build and run correctly. Mirrors the scope split used on the frontend's equivalent ticket (`SPM-50`), adapted for this repo's NestJS/Cloud Run specifics.

## Scope

### In scope (Iteration 1)

- A single-stage `Dockerfile` at the repo root: `npm ci`, `nest build`, `node dist/main`. No multi-stage build, no non-root user yet — that's Iteration 2 (see [Follow-ups](#follow-ups-not-this-ticket)).
- A minimal `.dockerignore` (`node_modules`, `dist`, `coverage`, `.git`, `.env`).
- Local validation: `docker build` + `docker run`, confirm the app serves a response.

### Explicitly out of scope (later iterations / future phases)

- Multi-stage build, non-root user, smaller final image — **Iteration 2**.
- `bitbucket-pipelines.yml` (build/push to Artifact Registry, Workload Identity Federation, per-branch env resolution).
- Cloud Run service definition, revision config, scaling, concurrency settings.
- Secret Manager wiring.
- `docker-compose.yml` for local multi-service dev.
- A dedicated health-check route (e.g. `/api/v1/health`) — none exists today.
- A Veracode (or equivalent) security scan step, if this org's standard pipeline requires one for this repo too.

## Current State / notes

Unlike the frontend's `SPM-50`, this repo has no build-blocking bug and no build-time env-baking problem:

- `npm run build` (`nest build`) already succeeds today with no code changes required.
- The app reads `PORT` from `process.env` **at runtime** (`src/main.ts:33`, defaults to `3001`) — Nest doesn't inline env vars at compile time the way Next.js does with `NEXT_PUBLIC_*`. This means Cloud Run's injected `PORT` (typically `8080`) is honored automatically with zero code changes, and no `--build-arg` mechanism is needed — all config is passed via `docker run -e` / Cloud Run env vars at runtime.
- `ConfigModule.forRoot`'s Joi schema (`src/app.module.ts`) requires `FRONTEND_BASE_URL` and will throw at boot if it's missing — `docker run` must supply it or the container will crash immediately. This is expected behavior, not a bug, and is called out explicitly in the [Local Validation Plan](#local-validation-plan).
- No `engines` field in `package.json`, no `.nvmrc`. Node version isn't pinned anywhere. Iteration 1 picks a placeholder (`node:22-alpine`) rather than blocking on confirming the exact minimum — see [OQ-1](#open-questions).
- **Naming mismatch spotted, not fixed here:** `src/main.ts`'s CORS `origin` reads `process.env.FRONTEND_ORIGIN`, but the Joi validation schema uses `FRONTEND_BASE_URL`. As written, CORS always falls back to its `http://localhost:3000` default regardless of what `FRONTEND_BASE_URL` is set to. This looks like it originated in `SPM-102`. Flagged under [OQ-2](#open-questions) — fixing app logic is out of scope for a Dockerfile ticket.
- **`.env.example` deliberately not touched.** It has no functional role in the build, the container, or the (future) CI/CD pipeline — Cloud Run gets real values from the service's revision config / Secret Manager, not from any file in this repo. Only `FRONTEND_BASE_URL` is actually enforced (Joi, `src/app.module.ts:16`); `PORT`, `FRONTEND_ORIGIN`, `SESSION_COOKIE_DOMAIN`, `SESSION_JWT_SECRET` all have working fallback defaults elsewhere in the code. Decided 2026-07-31 not to extend it as pure documentation, and removed it since it wasn't otherwise being kept current.

## Functional Requirements

- **FR-01.** `docker build` from the repo root produces an image that runs the production server via `node dist/main` (`npm run start:prod`), not `nest start`/`--watch`.
- **FR-02.** The build uses `npm ci` (not `npm install`) against the committed `package-lock.json`.
- **FR-03.** All runtime configuration (`FRONTEND_BASE_URL` required; `PORT`, `FRONTEND_ORIGIN`, `SESSION_COOKIE_DOMAIN`, `SESSION_JWT_SECRET` optional) is supplied via `docker run -e` / `--env-file` at container start — no build args needed, since none of these are read at build time.
- **FR-04.** A `.dockerignore` excludes `node_modules`, `dist`, `coverage`, `.git`, and `.env` from the build context.

Deliberately **not** required yet: multi-stage build, non-root user. Iteration 1 just needs to build and serve a response.

## Dockerfile Design

```dockerfile
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

`node:22-alpine` is a placeholder pending [OQ-1](#open-questions). `EXPOSE 3001` documents the local default; the app listens on whatever `PORT` is set to at runtime, so this doesn't need to change for Cloud Run (which injects `PORT=8080`).

## Local Validation Plan

1. `docker build -t spms-backend:local .`
2. `docker run -p 3001:3001 -e FRONTEND_BASE_URL=http://localhost:3000 spms-backend:local`
3. Confirm the container logs `Application is running on: http://localhost:3001` and `curl http://localhost:3001/api/v1` gets a response (not a connection error).
4. Confirm the expected-failure path: `docker run` **without** `FRONTEND_BASE_URL` set exits immediately with the Joi validation error, rather than silently starting.
5. Confirm Cloud Run parity: `docker run -p 8080:8080 -e PORT=8080 -e FRONTEND_BASE_URL=http://localhost:3000 spms-backend:local` serves on `8080` with no code or Dockerfile change.

## Acceptance Criteria

- [x] **AC-01.** Given the Dockerfile and `.dockerignore` exist, when `docker build` is run from repo root, then it completes successfully and produces an image.
- [x] **AC-02.** Given the image is run with `FRONTEND_BASE_URL` set, when a request is made to the container's port, then the app responds. (`curl` → `200` on `/api/v1`.)
- [x] **AC-03.** Given the image is run **without** `FRONTEND_BASE_URL`, when the container starts, then it fails fast with the Joi validation error rather than starting in a broken state.
- [x] **AC-04.** Given the `.dockerignore` is in place, when `docker build` runs, then `.git`, `node_modules`, and `dist` are not sent as part of the build context. (Confirmed no `.git` present inside the built image.)
- [x] **AC-05.** Given `PORT=8080` is passed via `docker run -e`, when the container starts, then the server listens on `8080` with no Dockerfile or code change. (Verified via `docker run -p 8080:8080 -e PORT=8080 ...` → `200` on `8080`.)

All five verified locally on 2026-07-31 (Docker 20.10.17).

## Dependencies

- `specs/PRD-backend-a.md` BE-A-C6 — confirms Cloud Run as the target platform.
- `specs/PRD.md` §6.2 C3 — Cloud Run + Bitbucket Pipelines + Workload Identity Federation as the target deployment path (not implemented here).

## Open Questions

- **OQ-1 (Node version).** No `engines`/`.nvmrc` pin exists. `node:22-alpine` is a placeholder — confirm the actual minimum/target Node version (package.json's `@types/node` is pinned to `^24`, which may signal intent to run on Node 24) before treating the base image tag as final. Needs its own follow-up ticket.
- **OQ-2 (`FRONTEND_ORIGIN` vs `FRONTEND_BASE_URL`).** `src/main.ts` CORS reads `FRONTEND_ORIGIN`; the Joi schema uses `FRONTEND_BASE_URL`. Likely an oversight from `SPM-102`. Needs its own small fix ticket — not addressed here.
- **OQ-3 (health check).** Cloud Run's default startup/liveness probe hits the container port over HTTP; there's no dedicated health route today, and the global `/api/v1` prefix means `GET /` 404s (still a valid HTTP response, so likely fine, but unconfirmed against Cloud Run's default probe config). Decide in a later ticket whether a dedicated route is worth adding.
- **OQ-4 (security scan).** Confirm with DevOps whether a Veracode (or equivalent) scan step is an org-wide mandatory gate this repo's future pipeline will also need — same open item as the frontend's `SPM-50` OQ-5.

## Follow-ups (not this ticket)

1. **Iteration 2 — harden the Dockerfile:** multi-stage build (`deps` → `builder` → `runner`), non-root user, smaller final image.
2. `bitbucket-pipelines.yml` — build image, push to Artifact Registry, authenticate via Workload Identity Federation, per-branch env resolution.
3. Cloud Run service/revision configuration (concurrency, scaling, env vars, secrets from Secret Manager).
4. Resolve OQ-2 (`FRONTEND_ORIGIN`/`FRONTEND_BASE_URL` mismatch) and OQ-3 (health check route).
5. Optional: `docker-compose.yml` for local multi-service dev against a real Backend B / frontend.
