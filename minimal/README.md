# minimal-hello-world

A deliberately trivial Node.js "hello world" app — no framework, no
dependencies. It exists to test the Docker build + Google Cloud Run deploy
pipeline in isolation, before/independent of the frontend and backend apps'
own build complexity.

## Run locally

```bash
npm ci
npm start          # listens on :8080 (or $PORT)
curl localhost:8080
```

## Test

```bash
npm test
```

## Build & run the container

```bash
docker build -t minimal-hello-world .
docker run --rm -p 8080:8080 minimal-hello-world
curl localhost:8080
```

## Pipeline

`bitbucket-pipelines.yml` in this folder mirrors the shape of
`supp-perf-mgmt-frontend/bitbucket-pipelines.yml` (test → build & push Docker
image → deploy to Cloud Run, same Workload Identity Federation auth, same
`BITBUCKET_REPO_SLUG`-derived image/service name), minus the app-build step
— there's nothing to build here beyond `npm ci`.

## Getting this to a green pipeline run

This needs to live in its **own dedicated Bitbucket repo** — Bitbucket only
reads `bitbucket-pipelines.yml` at a repo's root, so everything in this
folder becomes that new repo's root contents (not a subfolder push).

1. Create a new Bitbucket repo (e.g. `minimal-hello-world`) **in the same
   Bitbucket workspace** as `supp-perf-mgmt-backend`/`-frontend` — that's
   what makes the existing workspace-level variables
   (`DEV_WORKLOAD_IDENTITY_PROVIDER_ID`, `DEV_ENVIRONMENT_GCP_SERVICE_ACCOUNT`,
   `DEV_ENVIRONMENT_GCP_PROJECT_ID`, `DEV_ENVIRONMENT_GCP_REGION`,
   `DEV_ENVIRONMENT_ARTIFACT_REGISTRY`) reach it automatically.
2. Push this folder's contents to that repo's `dev` branch (root = this
   folder's root, e.g. `git init`, add this folder's files, push).
3. Enable Bitbucket Pipelines on that repo if it isn't already.
4. **Check GCP IAM before assuming a red run is a bug in the YAML:** the
   Workload Identity Federation provider's trust for
   `DEV_ENVIRONMENT_GCP_SERVICE_ACCOUNT` may be scoped to the
   backend/frontend repos' specific UUIDs. If so, this new repo's OIDC token
   gets rejected until its UUID (or the whole workspace UUID) is added to
   that binding.
5. Push, watch the run. If a step goes red, paste the failing step's log
   back and I'll fix it here.

Known non-blocking caveat, same as the frontend/backend pipelines: the
deploying service account currently can't set the `allUsers` →
`roles/run.invoker` IAM binding on this GCP project, so
`--allow-unauthenticated` silently fails and the pipeline's own smoke check
will report `403` even on an otherwise-successful deploy — see
`docs/cloud-run-architecture-issues.md`. That's a known project-level gap,
not something this pipeline should gate on.
