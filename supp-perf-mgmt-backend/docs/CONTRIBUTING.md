# Contributing Guide

This document defines the development workflow, branching strategy, specification-driven development (SDD) process, and branch protection rules for this repository (frontend). All contributors must follow this guide without exception.

For architecture, coding conventions, MUI usage rules, and non-negotiable rules, see `CLAUDE.md` at the repo root — this file covers git/PR mechanics; `CLAUDE.md` is the source of truth for everything else and is loaded automatically by Claude Code.

---

## Table of Contents

1. [Branching Strategy](#1-branching-strategy)
2. [Environment Mapping](#2-environment-mapping)
3. [Specification-Driven Development (SDD)](#3-specification-driven-development-sdd)
4. [Development Workflow Step by Step](#4-development-workflow-step-by-step)
5. [Pull Request Rules](#5-pull-request-rules)
6. [CI/CD Pipeline](#6-cicd-pipeline)
7. [Branch Protection Configuration (Bitbucket)](#7-branch-protection-configuration-bitbucket)
8. [Folder Structure](#8-folder-structure)
9. [Commit Message Convention](#9-commit-message-convention)
10. [Do's and Don'ts](#10-dos-and-donts)

---

## 1. Branching Strategy

```
main          ← Production (protected, no direct pushes)
  └── qa      ← QA / Staging (protected, promoted from dev)
        └── dev      ← Integration (protected, base for all feature work)
              └── {type}/SPM-{ID}-{short-description}   ← Developer branches
```

| Branch | Purpose | Deployment |
|---|---|---|
| `feature/*`, `bugfix/*`, `hotfix/*`, `release/*`, `chore/*`, `docs/*` | Individual developer work | None (local only) |
| `dev` | Integration of all completed work | Auto-deploy → Dev environment |
| `qa` | QA validation | Manual deploy → QA environment |
| `main` | Production-ready code | Manual deploy → Production |

### Branch Naming Convention

Branches must follow this pattern:

```
{type}/SPM-{ID}-{short-description}
```

| Type | When to use |
|---|---|
| `feature` | New functionality |
| `bugfix` | Bug fix during development |
| `hotfix` | Urgent fix on production |
| `release` | Release preparation |
| `chore` | Tooling, config, setup — no production code change |
| `docs` | Documentation only |

- Jira ID must be **uppercase**: `SPM-91`, not `spm-91`
- Short description is lowercase kebab-case
- The `{ID}-{short-description}` portion must match the spec filename (see §3) exactly

**Examples:**
```
feature/SPM-44-application-shell
feature/SPM-91-app-layout
bugfix/SPM-92-user-logout
docs/SPM-89-repo-init
chore/SPM-90-nextjs-setup
```

Branches that do not follow this convention will be rejected at PR time by the CI pipeline.

---

## 2. Environment Mapping

| Environment | Branch | Trigger |
|---|---|---|
| **Dev** | `dev` | Automatic on merge |
| **QA** | `qa` | Manual promotion from `dev` |
| **Production** | `main` | Manual promotion from `qa` |

Promotions (`dev → qa`, `qa → main`) are performed by the DevOps team or the designated release manager via a PR. No direct pushes to `qa` or `main` are permitted.

---

## 3. Specification-Driven Development (SDD)

This repository enforces **Specification-Driven Development**. No code is written without a preceding feature spec. The spec is the source of truth — implementation follows directly from it. This mirrors the "Feature Workflow" defined in `CLAUDE.md` — follow that section step by step; it is not repeated here to avoid the two documents drifting apart.

### Where specs live

```
.specs/features/SPM-{ID}-{short-description}.md
```

The `{ID}-{short-description}` must match the branch name exactly (e.g. branch `feature/SPM-91-app-layout` → spec `.specs/features/SPM-91-app-layout.md`).

Before drafting a spec, read the relevant files under `.specs/` for the view/area you're touching:

| Topic | File |
|---|---|
| Product goals, personas, scope | `.specs/PRD.md` |
| Frontend architecture, conventions | `.specs/PRD-frontend.md` |
| Data API contract | `.specs/API_SPEC.md` |
| Chat API contract | `.specs/CHAT_API_SPEC.md` |
| Entity shapes / TypeScript interfaces | `.specs/DATA_MODEL_SPEC.md` |
| Per-view data requirements, routes, gaps | `.specs/VIEW_DATA_MAP_SPEC.md` |
| Component states, tokens, layout, interaction rules | `.specs/UI_REQUIREMENTS_SPEC.md` |
| Existing components (check before creating new ones) | `.specs/COMPONENT_INVENTORY.md` |

Surface any blocking open question (`OQ-*`) in the target spec file before starting implementation.

### Specification Lifecycle

```
Draft → Review → Approved → In Implementation → Done
```

A spec must be agreed with the user/reviewer (Approved) before implementation begins.

---

## 4. Development Workflow Step by Step

### Step 1 — Create the Jira work item

Use the Jira Work Item Template defined in `CLAUDE.md` (`[FE]`/`[BE]`/`[CB]` summary prefix, description, acceptance criteria).

### Step 2 — Branch from `dev`

```bash
git checkout dev
git pull origin dev
git checkout -b feature/SPM-{ID}-{short-description}
```

### Step 3 — Draft and agree the spec

Create `.specs/features/SPM-{ID}-{short-description}.md` per §3, and agree it with the user before writing code.

### Step 4 — Implementation

Follow the "Feature Workflow" in `CLAUDE.md`: components → skeleton variant → loading/empty/error/success states → feature composition. Check `.specs/COMPONENT_INVENTORY.md` before creating any new component — extend an existing one as a variant instead of duplicating it.

Run locally while iterating:

```bash
npm run dev          # Next.js dev server (Turbopack)
```

### Step 5 — Test

A feature is not done until tests are committed in the same PR:

```bash
npm test             # Vitest — services, route handlers, component smoke tests
npm run test:e2e     # Playwright — critical user journeys
npm run lint         # ESLint (add -- --fix for auto-fix)
npm run typecheck    # tsc --noEmit
npm run build        # production build (also runs type-check)
```

Tests live under `src/test/`, mirroring the source path (e.g. `src/services/foo.service.ts` → `src/test/services/foo.service.test.ts`). Route handler tests need `// @vitest-environment node` at the top of the file. **Never** place test files inside `src/app/` — Turbopack scans that directory as part of the Next.js module graph and will try to resolve `vitest` imports as Next.js entries, hanging the dev server.

### Step 6 — Update the component inventory

Update `.specs/COMPONENT_INVENTORY.md` with any new or changed components before opening the PR.

### Step 7 — Commit

```bash
git add .
git commit -m "feat: implement application shell and layout components"
git push origin feature/SPM-{ID}-{short-description}
```

See §9 for the commit message convention — note there is **no Jira ID** in the commit message.

### Step 8 — Open a Pull Request into `dev`

Open a Bitbucket PR from your branch → `dev`, using the Bitbucket Pull Request Template defined in `CLAUDE.md` (title format `{Type}/SPM-{ID} {Jira summary without component tag}`).

### Step 9 — Review, CI, and squash merge

The PR requires:
- **At least 1 reviewer approval**
- **All CI pipeline checks passing** (lint, typecheck, test, e2e, build)

Once approved and green, **squash merge** into `dev` — all merges into `dev` use squash merge (see `CLAUDE.md`). This triggers the automatic deployment to the Dev environment.

### Step 10 — Promotion to QA

When a set of features is ready for QA, the release manager opens a PR from `dev` → `qa`. Reviewed by the DevOps team and manually deployed to the QA environment after merge.

### Step 11 — Promotion to Production

After QA sign-off, the release manager opens a PR from `qa` → `main`. Reviewed and manually deployed to Production after merge.

---

## 5. Pull Request Rules

### PR Checklist

- [ ] Branch name follows `{type}/SPM-{ID}-{short-description}` convention
- [ ] Spec file exists at `.specs/features/SPM-{ID}-{short-description}.md` and matches the branch name
- [ ] Spec was agreed with the user before implementation began
- [ ] All four async states (loading/empty/error/success) implemented per `UI_REQUIREMENTS_SPEC.md` §14, including the matching `ComponentName.Skeleton`
- [ ] Unit tests written and passing (`npm test`)
- [ ] E2E tests written and passing where applicable (`npm run test:e2e`)
- [ ] Lint and typecheck passing (`npm run lint`, `npm run typecheck`)
- [ ] No secrets, credentials, or `.env` files committed
- [ ] `.specs/COMPONENT_INVENTORY.md` updated if components were added or changed
- [ ] New exports added to the relevant barrel file (`src/components/ui`, `src/services`, `src/hooks`)
- [ ] PR title and description follow the Bitbucket PR template in `CLAUDE.md`

### PR Size Guidelines

Keep PRs focused. A PR should cover one Jira ticket / one logical unit of work as defined in one spec. Large PRs covering multiple tickets will be returned for splitting.

---

## 6. CI/CD Pipeline

The pipeline runs automatically on every PR targeting `dev`. It must pass before merge is allowed.

### Pipeline Stages (Bitbucket Pipelines)

```yaml
# bitbucket-pipelines.yml (reference)
pipelines:
  pull-requests:
    '**':
      - step:
          name: Lint & Typecheck
          script:
            - npm ci
            - npm run lint
            - npm run typecheck
      - step:
          name: Unit Tests
          script:
            - npm test -- --coverage
      - step:
          name: E2E Tests
          script:
            - npm run test:e2e
      - step:
          name: Build
          script:
            - npm run build

  branches:
    dev:
      - step:
          name: Deploy to Dev
          deployment: dev
          script:
            - npm ci
            - npm run build
            - # your deployment command here

    qa:
      - step:
          name: Deploy to QA
          trigger: manual
          deployment: qa
          script:
            - npm ci
            - npm run build
            - # your deployment command here

    main:
      - step:
          name: Deploy to Production
          trigger: manual
          deployment: production
          script:
            - npm ci
            - npm run build
            - # your deployment command here
```

All pipeline stages must be green before a PR can be merged. A failed build or test suite blocks the merge regardless of approvals.

---

## 7. Branch Protection Configuration (Bitbucket)

Configure these rules in **Repository Settings → Branch Permissions** on Bitbucket.

### `main` branch

| Setting | Value |
|---|---|
| Write access | DevOps / Release Manager only |
| Merge via PR | Required |
| Minimum approvals | 1 |
| Passing CI | Required |
| No direct pushes | Enforced |
| Delete after merge | No |

### `qa` branch

| Setting | Value |
|---|---|
| Write access | DevOps / Release Manager only |
| Merge via PR | Required |
| Minimum approvals | 1 |
| Passing CI | Required |
| No direct pushes | Enforced |
| Delete after merge | No |

### `dev` branch

| Setting | Value |
|---|---|
| Write access | All contributors (via PR only) |
| Merge via PR | Required (squash merge only) |
| Minimum approvals | 1 |
| Passing CI | Required |
| No direct pushes | Enforced |
| Delete after merge | Yes (feature branch) |

### How to apply in Bitbucket UI

1. Go to **Repository Settings** → **Branch permissions**
2. Click **Add a branch permission**
3. Set **Branch name or pattern** (e.g. `main`, `qa`, `dev`)
4. Under **Prevent changes**, select **Prevent pushing** and **Prevent history rewriting**
5. Under **Merge checks**, enable:
   - **Minimum approvals: 1**
   - **No incomplete tasks**
   - **Successful builds** (select your pipeline)
6. Restrict the **Write** and **Admin** access groups to the appropriate teams
7. Repeat for each protected branch

> **Note:** Merge checks (passing CI) require a Bitbucket Premium plan or higher. If your plan does not support merge checks, enforce CI as a manual gate through team process until the plan is upgraded.

---

## 8. Folder Structure

```
.
├── CLAUDE.md                          # Canonical project/architecture reference — always keep updated
├── docs/
│   └── CONTRIBUTING.md               # This file
├── README.md
├── .specs/
│   ├── PRD.md
│   ├── PRD-frontend.md
│   ├── PRD-backend-a.md              # Backend A (Data API) internals — rarely needed from frontend
│   ├── PRD-backend-b.md              # Backend B (Chat Service) internals — rarely needed from frontend
│   ├── PRD-ai-agent.md
│   ├── API_SPEC.md
│   ├── CHAT_API_SPEC.md
│   ├── DATA_MODEL_SPEC.md
│   ├── VIEW_DATA_MAP_SPEC.md
│   ├── UI_REQUIREMENTS_SPEC.md
│   ├── COMPONENT_INVENTORY.md
│   └── features/                     # One spec file per feature/ticket
│       └── SPM-91-app-layout.md
├── src/
│   ├── app/                           # Next.js App Router routes — never put test files here
│   ├── components/
│   │   ├── layout/                   # Layout components (no barrel)
│   │   └── ui/                       # UI components (barrel: index.ts)
│   ├── services/                     # All API access — barrel: index.ts (http.ts excluded)
│   ├── hooks/                        # Custom hooks — barrel: index.ts
│   ├── context/                      # React contexts
│   ├── lib/
│   │   └── theme.ts                  # MUI theme + design tokens
│   └── test/                         # All tests — mirrors src/ path
├── bitbucket-pipelines.yml
└── package.json
```

### `CLAUDE.md`

`CLAUDE.md` at the repo root is the primary architecture and convention reference for all contributors (and is loaded automatically by Claude Code). It documents:
- Project purpose, personas, and backend topology (Backend A, Backend B, AI agent)
- Routes, feature workflow, non-negotiable rules
- Color rules, MUI usage rules, layout CSS variables, breakpoints
- File locations, import order, barrel files

Update `CLAUDE.md` as part of any PR that introduces architectural changes or new conventions.

---

## 9. Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

```
{type}: {short description}
```

- **No Jira ID** in the commit message (the branch name and PR title already carry it)
- Description is lowercase, imperative mood — `add login page`, not `Added login page`

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, config, maintenance |
| `docs` | Documentation changes |
| `style` | Formatting or whitespace — no logic change |
| `refactor` | Code restructure — no feature or fix |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration |

**Examples:**
```
feat: implement auth flow with mock handlers, UserContext, and service tests
docs: update specs and CLAUDE.md with auth flow, test requirements, and mock mode
fix: handle null response on report export
test: add unit tests for token refresh service
```

---

## 10. Do's and Don'ts

### Do's

- ✅ Always start a task by agreeing the spec first (`.specs/features/SPM-{ID}-{short-description}.md`)
- ✅ Get spec agreement before starting implementation
- ✅ Keep `CLAUDE.md` current — it is the shared memory of this project
- ✅ Write and run tests before opening a PR (`npm test`, `npm run test:e2e`)
- ✅ Keep PRs small and focused on one ticket
- ✅ Open a PR into `dev` only — never directly into `qa` or `main`
- ✅ Use the PR template from `CLAUDE.md` fully — incomplete PRs will be returned
- ✅ Update `.specs/COMPONENT_INVENTORY.md` and the relevant barrel file for every new/changed component

### Don'ts

- ❌ Never push directly to `dev`, `qa`, or `main`
- ❌ Never commit `.env` files, secrets, API keys, or credentials
- ❌ Never skip the spec step — code without an agreed spec will not be reviewed
- ❌ Never merge your own PR without at least one approval
- ❌ Never implement beyond the scope defined in the spec without updating the spec first
- ❌ Never create branches from `qa` or `main` — always branch from `dev`
- ❌ Never include the Jira ID in the commit message
- ❌ Never place test files inside `src/app/`

---

## Questions and Support

For workflow questions, contact the DevOps team or the repository maintainer. For architecture or convention questions, refer to `CLAUDE.md` first.
