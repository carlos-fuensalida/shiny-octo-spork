# Release, versioning & rollback runbook

Cross-repo runbook for `supp-perf-mgmt-frontend`, `supp-perf-mgmt-backend`
(Backend A / Data API), and `supp-perf-mgmt-ai` (AI Agent) — the three
services actually running on Cloud Run today, each its own Bitbucket repo
with its own `bitbucket-pipelines.yml`. Backend B (Chat Service) is excluded
until it has a confirmed deployed URL.

This is a **sandbox draft**: the mechanism it describes (pipeline-triggered
rollback, revision tagging, release manifest) does not exist in any of the
three repos yet. Nothing here is live. It's written to be copy-pasted into
each repo once agreed, not run from here.

Written 2026-08-27. Supersede this doc, don't silently drift from it — if a
step below turns out to be wrong once implemented, fix this file in the same
change.

---

## 1. Principles

- **Rollback goes through the pipeline, not a human's `gcloud`/Console
  session, except as a documented break-glass exception.** The deploying
  service account already holds `roles/run.admin` per environment via WIF —
  that's the only identity actually provisioned to move Cloud Run traffic
  right now. Routing rollback through it means no new IAM surface, the same
  audit trail deploys already get (tied to a Bitbucket run and a commit),
  and no environment/region/service typo risk mid-incident. See §5.4 for the
  break-glass exception and who may use it.
- **Promotion moves commits forward, it never re-authors them.** `qa`/`main`
  only ever receive a fast-forward merge of something that already ran on
  the branch below it. This is CLAUDE.md's existing rule
  (`shiny-octo-spork/CLAUDE.md` → Branching) — this runbook makes it
  mechanically enforced (branch protection, §4.2) instead of just documented.
- **The three services promote and roll back independently, but are
  released as a coordinated train.** Each repo has its own pipeline, its own
  Cloud Run service, its own rollback action — rolling back the frontend
  does not touch Backend A or the AI Agent. But because they share a
  contract (IAP audience, `INTERNAL_API_BASE_URL`/`INTERNAL_CHAT_API_BASE_URL`
  shapes), a promotion should be planned as "all three move to qa/prod
  together," not three unrelated events. §3.3 is what makes "what's live
  where, across all three" answerable without guessing.

---

## 2. Versioning

### 2.1 Keep the build tag — it's already correct

Each pipeline already stamps images with an immutable, sortable tag:

```
TAG="$(date +%Y%m%d%H%M%S)-${BITBUCKET_BUILD_NUMBER}"
```

Keep this. It ties every image 1:1 to a build and a commit
(`org.opencontainers.image.revision` is already set to `$BITBUCKET_COMMIT`)
and it's what rollback targets (§5) by identity. Don't replace it with
semver — semver identifies a *release*, the build tag identifies an
*artifact*, and rollback needs the artifact identity.

**Drop the `:latest` tag** currently also pushed alongside it
(`build_and_push_image` step, all three repos). Nothing reads it — the
deploy step always deploys the immutable tag from `build_info.txt` — and a
floating tag sitting in Artifact Registry is a rollback foot-gun: someone
half-remembering "just redeploy `:latest`" would get whatever last happened
to build, not a chosen version.

### 2.2 Add semantic versioning per repo

Layer semver on top, cut only at promotion time (not every commit), driven
by the Conventional Commits types already required by each repo's commit
hook (`feat`/`fix`/`chore`/… — `supp-perf-mgmt-frontend/CLAUDE.md` and
`supp-perf-mgmt-backend/CLAUDE.md`, Commit Message Convention). A tool like
`semantic-release` can compute the bump from commit history and push an
annotated git tag (`v1.4.0`) on the repo. Don't force one shared version
number across the three repos — they're independent repos with independent
release cadences; a shared number would imply a monorepo relationship that
doesn't exist here.

Once semver exists, `org.opencontainers.image.version` on the Docker image
label should carry it (it currently duplicates the build tag) — the build
tag moves to living only in `org.opencontainers.image.revision`'s neighbor
label, or is dropped from the OCI labels entirely since it's already in
`build_info.txt` and the image path itself.

### 2.3 Release manifest — what's actually live, across all three

At each promotion (§4), record which commit/tag of *each* of the three
repos was promoted together — e.g. apply the same tag
(`qa-2026-08-27`, `prod-2026-08-27`) across all three repos' promoted
commits at that moment. This is what makes "what's running in QA right now"
answerable in one lookup instead of three, and it's the thing that makes
rollback-compatibility (§5.3) checkable instead of guessed.

Where this manifest lives is an open decision — a shared doc in this
sandbox (`docs/`), a fourth lightweight repo, or a Bitbucket Deployments
dashboard entry per environment. Don't build tooling for it until the
qa/prod infra in §6 actually exists; a markdown table is enough to start.

### 2.4 Runtime self-reporting

Add a `/version` endpoint (or extend the existing health check) on each
service returning `{ version, gitSha, buildTag, builtAt }`. Cheap, and it's
how a rollback or promotion is *verified* rather than trusted from a
pipeline log — hit the endpoint, confirm the revision that's actually
serving traffic matches what you intended.

---

## 3. Code promotion to QA and PROD

### 3.1 Current state (checked against the real pipelines, not just docs)

All three repos' `bitbucket-pipelines.yml` already have `dev`/`qa`/`main`
branch blocks wired — env resolution, build, deploy, all parameterized by
`{PREFIX}_*` variables. **The pipeline code is not the blocker.** What's
missing is infrastructure (§6): only `DEV_*` Bitbucket variables exist
today; `QA_*`/`PROD_*` and the GCP projects behind them don't yet, so a push
to `qa`/`main` would fail at the "Get Environment Variables" step's
validation, not deploy something wrong.

### 3.2 Promotion mechanic

Promote via Bitbucket PR, fast-forward merge only:

```bash
# dev -> qa
git checkout qa
git pull origin qa
git merge --ff-only dev
git push origin qa

# qa -> main, once qa has been verified
git checkout main
git pull origin main
git merge --ff-only qa
git push origin main
```

If `--ff-only` fails, `qa`/`main` has a commit `dev` doesn't (e.g. a hotfix
landed on `main` directly) — stop and reconcile by merging back down, don't
force-push over it. A fast-forward guarantees the exact commit SHA that ran
in the lower environment is what deploys to the next one; nothing is
re-authored or cherry-picked in between.

Do this via a PR, not a local push, so there's a review record — even
though a ff-merge has no code diff to review, the PR is where "promote
`dev` to `qa` now" becomes a recorded decision instead of a bare git command
in someone's shell history.

### 3.3 Release-train coordination across the three repos

Before promoting, confirm the three repos' `dev` branches are mutually
compatible at the point being promoted — IAP audience expectations,
`INTERNAL_API_BASE_URL`/`INTERNAL_CHAT_API_BASE_URL` shapes, any contract
change that shipped in one but not the other two. Promote all three in the
same window and record it together in the release manifest (§2.3).
Promoting the frontend alone risks it landing on `qa`/`main` talking to a
Backend A contract that hasn't moved yet.

### 3.4 Branch protection (not yet configured — do this before qa/main go live)

In each of the three Bitbucket repos:

- `qa` and `main`: no direct push, PR required, required build passing
  (the existing `lint_typecheck_test` step already gates PRs — this just
  makes it non-optional on these two branches specifically).
- `main`'s deploy step: set `trigger: manual` on the `*deploy_cloud_run`
  step under the `main` branch pipeline only (`qa` and `dev` stay automatic
  on merge). Bitbucket Pipelines supports this natively — a promotion PR
  merging into `main` still has to be followed by someone deliberately
  clicking "run" on the deploy step, so a prod release is always a
  deliberate second action, not a side effect of the merge.

---

## 4. Rollback

### 4.1 Add revision tagging to the existing deploy step

One-line addition to `gcloud run deploy` in each repo's `deploy_cloud_run`
step:

```
--tag "rel-${TAG}"
```

(`TAG` is the same build tag already computed in `build_and_push_image` and
carried forward via `build_info.txt` — reuse it, don't invent a second
identifier.) This makes every revision addressable by a stable name
(`rel-20260827143000-482`) instead of only by Cloud Run's own auto-generated
revision suffix, with no change to the current "new revision gets 100% of
traffic immediately" behavior.

### 4.2 Add a manual rollback pipeline (per repo)

A new custom/manual pipeline, separate from the branch pipelines, e.g.:

```yaml
pipelines:
  custom:
    rollback:
      - variables:
          - name: ENVIRONMENT      # dev | qa | prod
          - name: IMAGE_TAG        # the build tag being rolled back to, e.g. 20260827090000-478
      - step:
          name: Rollback Cloud Run to a previous image
          oidc: true
          script:
            # Reuses the same {PREFIX}_* variable resolution the branch
            # pipelines use (see get_env_variable) — omitted here for
            # brevity, wire it the same way keyed off $ENVIRONMENT instead
            # of $BITBUCKET_BRANCH.
            - *gcp_auth
            - |
              set -euo pipefail
              IMAGE_URI="${ENVIRONMENT_GCP_REGION}-docker.pkg.dev/${ENVIRONMENT_GCP_PROJECT_ID}/${ENVIRONMENT_ARTIFACT_REGISTRY}/${BITBUCKET_REPO_SLUG}:${IMAGE_TAG}"
              gcloud artifacts docker images describe "${IMAGE_URI}"   # fails loudly if the tag was GC'd
              gcloud run deploy "${BITBUCKET_REPO_SLUG}" \
                --image "${IMAGE_URI}" \
                --region "${ENVIRONMENT_GCP_REGION}" \
                --tag "rollback-$(date +%s)" \
                --quiet
```

This is deliberately *not* a rebuild — no lint/test/build/push steps, no
new image. It's the same OIDC auth the branch pipelines already do, plus
one `gcloud run deploy` pointed at an image that already exists. Runtime is
seconds; the only overhead is Bitbucket's manual-trigger queue time.

### 4.3 Protect rollback candidates

Set an Artifact Registry cleanup policy per environment that keeps the last
N immutable tags (pick N to cover at least a few weeks of deploys) rather
than relying on default retention. A rollback is only as good as whether
the target image still exists.

### 4.4 Break-glass exception

Direct `gcloud`/Console traffic manipulation is permitted only when the
pipeline itself is unavailable (Bitbucket outage, WIF/Artifact Registry
outage) — restricted to on-call/lead roles who've been granted time-boxed
IAM for that incident. Whoever does this must log what they ran and why
into the same release manifest (§2.3) immediately after, so the audit trail
doesn't fork into "things the pipeline did" vs. "things nobody wrote down."
This should be the rare exception, not a parallel everyday path — if it's
being used often, that's a signal the pipeline rollback (§4.2) is too slow
or missing a case, not a reason to keep using the manual path.

### 4.5 Cross-service compatibility check before rolling back

Before rolling back one service, check the release manifest (§2.3) for what
the other two are currently running. Rolling back Backend A to a revision
predating a contract change the frontend now depends on will break the
frontend even though the frontend itself didn't change — this is the same
coordination concern as promotion (§3.3), just running in reverse.

---

## 5. Infra prerequisites — the actual current blocker

None of §3–4 can run for `qa`/`main` until this exists. This is
infrastructure work, not pipeline YAML:

- [ ] QA and PROD GCP projects created for each environment.
- [ ] `QA_*`/`PROD_*` Bitbucket variables added, mirroring every `DEV_*`
      one, in all three repos (WIF provider, deploy SA, project ID, region,
      Artifact Registry, IAP audience, internal base URLs — see each
      pipeline's header comment for the full per-repo list).
- [ ] QA/PROD Cloud SQL provisioned, private-IP only
      (`docs/cloudsql-postgres-setup.md` — this org's `sql.restrictPublicIp`
      policy applies to every environment, not just dev).
- [ ] QA/PROD IAP OAuth brand/audience configured for the frontend service
      in each environment.
- [ ] Branch protection on `qa`/`main` in all three repos (§3.4).
- [ ] Artifact Registry cleanup policy per environment (§4.3).

---

## 6. Open items — don't resolve unilaterally

- **Where the release manifest (§2.3) actually lives** — markdown in this
  sandbox is enough to start; revisit once qa/prod exist.
- **Who holds break-glass IAM (§4.4)** and how it's granted/revoked per
  incident — needs a decision from whoever owns GCP IAM for these projects.
- **Semver tooling choice (§2.2)** — `semantic-release` is a reasonable
  default given the existing Conventional Commits gate, but not the only
  option; pick based on what the team is already comfortable maintaining.
