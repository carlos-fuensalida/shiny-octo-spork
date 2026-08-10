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

## Development conventions

See `CLAUDE.md` for architecture rules, the auth model, and the branching/ticket workflow used on this repo.
