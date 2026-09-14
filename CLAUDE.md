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

## Working style

These are standing instructions on *how* to troubleshoot and communicate in
this workspace, not about the repo's content. They override default behavior.

- **Don't re-litigate old context.** Once a bug or a past troubleshooting
  thread is resolved or superseded, stop bringing it up. Only reference prior
  issues when they're actually load-bearing for the current fix (the
  disproven SA-permissions theory under "Current state of the infrastructure
  work" is a real example of one worth keeping, precisely because re-deriving
  it wastes a pipeline run). Otherwise, state the current problem and the
  current fix without recapping how the session got there.
- **Escalation — tickets, admin asks, permission grants — is the last resort,
  not the first hypothesis.** Check whether the failing step is even
  necessary before assuming a permissions problem; removing a non-essential
  command is a legitimate fix. Real case, don't re-derive it fresh:
  `docs/qa-pipeline-containeranalysis-permission-gap.md` — a ticket went out
  on an IAM-grant theory before anyone checked whether the failing check was
  load-bearing; it wasn't, and the real fix was commenting it out. Don't
  recommend a ticket unless the diagnosis is solid enough to survive someone
  else checking it.
- **Lead with the lowest-effort fix, and when it's not obvious, give ranked
  options — cheapest and most-local first** (including "just remove/disable
  it") — rather than committing to a single path immediately. Say briefly
  why each ranks where it does (effort, reversibility, what it depends on
  someone else granting) so the choice is the user's, not assumed.
- **State assumptions and ask instead of guessing** when a requirement is
  ambiguous; don't build on a silent guess.
- **Present each option on its own merits — don't staple a repeated
  non-critical caveat onto it.** A caveat belongs directly on a recommendation
  only when it's actually blocking or changes that recommendation right now
  (e.g. "needs an org-policy exception that doesn't exist" makes an option
  infeasible today). A true-but-non-blocking fact — e.g. "the VPC connector
  isn't live yet" surfacing again on a Redis/Memorystore suggestion when
  nothing about *that* recommendation depends on it being live today — reads
  as hedging, not analysis. Say it once if it's worth saying, not as a
  qualifier repeated on every option that happens to touch it.
- **Change only what the task requires.** No adjacent refactors, renames, or
  speculative abstractions/config nobody asked for.
- **"Done" needs proof** — a test run, a script, or reproduced output —
  not just a description of the change.
- **Keep this file itself short.** Prune a rule once it's clearly followed
  without it; don't let it pile up as dead weight.

## Workspace layout

The intent is to have the frontend and backend checked out side by side under
this one directory, so cross-repo work (matching a pipeline change in both,
tracing a frontend call into a backend route) happens in a single session.

```
shiny-octo-spork/
├── CLAUDE.md                        # this file
├── docs/                            # cross-repo findings and reference copies
│   └── bitbucket-pipelines.yml      # reference copy of the backend's pipeline
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
- **Never `git push` (or merge) to `dev`, `qa`, or `main` in a child repo** —
  not even from inside that directory, not even when asked to "just do it."
  Those pushes are done personally, by the user, from their own terminal.
  Editing/staging/committing locally is fine; the push itself is not this
  agent's call to make. If the user asks to override this for an emergency,
  don't comply on the first ask — confirm explicitly three separate times
  before pushing, and only push if all three confirmations hold.

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

**Decided and live: private, fronted by Google IAP** — not the public
cookie+CORS option that was once an open fork. `gcloud run deploy` uses
`--no-allow-unauthenticated` for both frontend and backend; IAP sits in front
restricted to `whirlpool.com` (`roles/iap.httpsResourceAccessor`); the two
services and the AI Agent call each other via plain SA-to-SA
`roles/run.invoker` bindings. See `docs/vpc-backend-cloudsql-implementation.md`
and `docs/backend-vpc-architecture-diagram.md` for the current wiring. This is
decided, not an open question — don't reopen it.

**Why: an org policy makes `allUsers` a dead end.** Domain Restricted Sharing
(`constraints/iam.allowedPolicyMemberDomains`) blocks any IAM binding to
`allUsers` at the org level — confirmed by real `--allow-unauthenticated`
failures, and **not** a deploying-SA permissions gap (the SA holds
`roles/run.admin`; that theory is disproven, don't re-derive it). There is no
pipeline or code fix short of an org-policy exception at or above folder
`625301422871` — which is exactly why IAP and specific-principal SA-to-SA
bindings were chosen instead of chasing that exception.

- The post-deploy smoke check deliberately has no `-f` and expects a `403`:
  with `--no-allow-unauthenticated` + IAP, an unauthenticated request getting
  rejected is correct private-by-default behavior, not a failure to paper
  over. Don't "fix" it to expect `200`.
- A **separate, unrelated** org policy, `constraints/sql.restrictPublicIp`,
  forces Cloud SQL to private-IP-only in this project — see
  `docs/cloudsql-postgres-setup.md`. Don't conflate the two.

**Known temporary workarounds still in the pipelines** (e.g. the
`SELF_BASE_URL=https://placeholder.invalid` first-deploy placeholder in the
frontend deploy step) should not survive to `qa`/`main` unchanged. Leave one
in place unless removing it is the task, but flag it.

## Working conventions

- **A pipeline step failing doesn't mean it's essential** — same principle as
  under "Working style," applied to pipeline YAML specifically. Before
  reaching for an IAM grant or a workaround, confirm the failing command
  actually earns its place. `docs/qa-pipeline-containeranalysis-permission-gap.md`
  is the canonical example: read it before proposing a permission fix for a
  pipeline failure.
- **Explain the why in comments.** The pipeline YAML in `docs/` carries
  comments explaining *why* a choice was made — why `PORT` is read from the
  environment, why a smoke check has no `-f`, why a flag is `--no-allow-` vs
  `--allow-`. Match that density. This repo's value is largely the reasoning
  it captures, not the code.
- **`docs/bitbucket-pipelines.yml` is a reference copy, not live config, and
  it drifts.** Bitbucket only ever reads `bitbucket-pipelines.yml` at a
  repo's root — this file is a snapshot of the backend's real pipeline for
  reading here. Verify against the actual Bitbucket repo before basing a
  change on it.
- **Never commit secrets.** GCP auth is Workload Identity Federation
  specifically so there are no long-lived service account keys anywhere. Keep
  it that way. Config values belong in Bitbucket workspace variables.
- Real GCP project IDs, service account names, and folder IDs already appear in
  `docs/`. That's deliberate — they're needed to escalate the org-policy issue.
  Don't add credentials, tokens, or secret values alongside them.
