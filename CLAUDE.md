# CLAUDE.md

## What this repository is

`shiny-octo-spork` is a **sandbox**, not a production repository. It is a
workspace for experimenting with the SPMS project's infrastructure, pipelines,
and multi-repo workflow before that work lands in the real repositories.

Nothing here is deployed to serve users. Nothing here is a source of truth for
application code. Treat everything in this repo as disposable unless a specific
file says otherwise.

The real project lives in two independent **Bitbucket** repositories:

| Repo | Role | Stack |
| --- | --- | --- |
| `supp-perf-mgmt-frontend` | Web frontend | Next.js |
| `supp-perf-mgmt-backend` | Data API (Backend A) | NestJS |

A third service, `supp-perf-mgmt-ai` (AI Agent), is deployed alongside them but
is not part of this workspace. A fourth, "Backend B" (Chat Service), is
referenced in the docs but has no confirmed deployed URL yet.

Note the split: this sandbox is on **GitHub**, the real repos are on
**Bitbucket**. Pipeline YAML written here is Bitbucket Pipelines syntax and will
never run in this repo's own CI — it is authored here and copied to a Bitbucket
repo to actually execute.

## Workspace layout

The intent is to have the frontend and backend checked out side by side under
this one directory, so cross-repo work (matching a pipeline change in both,
tracing a frontend call into a backend route) happens in a single session.

```
shiny-octo-spork/
├── CLAUDE.md                        # this file
├── docs/                            # cross-repo findings and reference copies
│   ├── cloud-run-architecture-issues.md
│   └── bitbucket-pipelines.yml      # reference copy of the backend's pipeline
├── minimal/                         # throwaway hello-world pipeline test rig
├── supp-perf-mgmt-frontend/         # git-ignored clone (not tracked here)
└── supp-perf-mgmt-backend/          # git-ignored clone (not tracked here)
```

**The two clones are git-ignored, not submodules.** They are full, independent
git repositories with their own remotes, branches, and pipelines. This repo
never tracks their contents and has no pointer to their commits.

What this means in practice:

- Run git commands for a child repo **from inside that directory**. A
  `git status` at this repo's root will not show their changes, by design.
- Never `git add` anything under those directories from this repo's root.
- Never commit a change to a child repo as if it were a change to this one —
  they push to different remotes, on different hosts, with different review
  expectations.
- If a clone is missing, that is expected on a fresh checkout. Clone it from
  Bitbucket rather than assuming the work belongs here.

## Branching

**In this repo:** `main`, plus short-lived experiment branches. There is no
promotion flow here — it is a sandbox. Don't create `dev`/`qa` branches here.

**In the real repos**, work is spec-driven and promotes through three branches:

```
dev  ──promote──▶  qa  ──promote──▶  main
 │                  │                  │
 ▼                  ▼                  ▼
Cloud Run (dev)   QA / UAT         Production
```

- **`dev`** — all new features merge here. Currently deployed to Cloud Run.
- **`qa`** — a promotion from `dev`, deployed to QA/UAT. Being added; not wired
  up in the pipelines yet.
- **`main`** — the final promotion, deployed to production. Not wired up yet.

Branch names are lowercase (`qa`, not `QA`), matching the existing pipeline
YAML. Promotion means moving *already-merged* commits forward, so never commit
a feature directly to `qa` or `main` — it goes into `dev` and is promoted.

Only `dev` has branch pipelines today. When adding `qa`/`main`, they need their
own GCP projects and their own Bitbucket variables (the current ones are all
`DEV_`-prefixed) — this is not a copy-paste of the `dev` block.

## Current state of the infrastructure work

Read `docs/cloud-run-architecture-issues.md` before touching anything
deploy-related. It is the working record of this effort and is more current
than this section. The headlines:

**The minimal pipeline test succeeded.** `minimal/` is a dependency-free Node
hello-world whose only purpose was to prove the Bitbucket → Artifact Registry →
Cloud Run path in isolation, with no Next.js build and no NestJS compile in the
way. It worked. The pattern it proves — Workload Identity Federation auth via
the step's OIDC token, image name and service name derived from
`BITBUCKET_REPO_SLUG`, deploy an immutable tag rather than `:latest` — is the
one the real pipelines use.

**The open blocker is an org policy, not a permissions gap.** The original
theory was that the deploying service account lacked
`run.services.setIamPolicy`. That theory is **wrong** — the SA holds
`roles/run.admin`. The real cause is the Domain Restricted Sharing org policy
(`constraints/iam.allowedPolicyMemberDomains`), which blocks any IAM binding to
`allUsers` at the org level. `allUsers` belongs to no customer by definition, so
it can never satisfy that constraint.

Consequences to keep in mind:

- **There is no pipeline or code fix for this.** It needs an org-policy
  exception granted at or above folder `625301422871`. Do not attempt to solve
  it by editing YAML, and do not re-derive the disproven SA-permissions theory.
- `--allow-unauthenticated` silently fails, so smoke checks report `403` even
  on an otherwise-successful deploy. Several smoke checks are deliberately
  softened (`curl -sS`, not `curl -fsS`) so this known gap doesn't fail the
  pipeline. Don't "fix" a soft smoke check without knowing why it's soft.
- Service-to-service auth is unaffected — a plain SA-to-SA `roles/run.invoker`
  binding is not `allUsers` and works fine. That's how the backend proof of
  concept is wired.

**An architectural decision is pending** and gates real work: whether the Data
API stays public (browser cookie + CORS) or goes private (IAM-authenticated
service-to-service, which is a re-architecture, not a flag change). Section 1 of
the issues doc lays out the conflict. Don't pick a side unilaterally — if a task
depends on the answer, surface it.

**Known temporary workarounds are tracked in §4 of the issues doc.** Temporary
branch triggers, softened smoke checks, hardcoded URLs, placeholder domains.
None should survive to `qa`/`main`. When you touch a file containing one, leave
it in place unless removing it is the task, but do flag it.

## Working conventions

- **Explain the why in comments.** The existing pipeline YAML, Dockerfile, and
  `server.js` all carry comments explaining *why* a choice was made — why `PORT`
  is read from the environment, why the smoke check has no `-f`, why the image
  is single-stage. Match that density. This repo's value is largely the
  reasoning it captures, not the code.
- **Keep `minimal/` minimal.** It is a control experiment. Its worth comes from
  having no dependencies and no build step, so a failure can only be the
  plumbing. Don't add a framework, dependencies, or app features to it.
- **Bitbucket only reads `bitbucket-pipelines.yml` at a repo's root.** A
  pipeline file in a subfolder here never runs. Files like
  `minimal/bitbucket-pipelines.yml` and `docs/bitbucket-pipelines.yml` are
  authoring copies and reference copies respectively.
- **Reference copies drift.** `docs/bitbucket-pipelines.yml` is a snapshot of
  the backend's real pipeline. Don't trust it as current — check the actual
  repo before basing a change on it.
- **Never commit secrets.** GCP auth is Workload Identity Federation
  specifically so there are no long-lived service account keys anywhere. Keep
  it that way. Config values belong in Bitbucket workspace variables.
- Real GCP project IDs, service account names, and folder IDs already appear in
  `docs/`. That's deliberate — they're needed to escalate the org-policy issue.
  Don't add credentials, tokens, or secret values alongside them.
