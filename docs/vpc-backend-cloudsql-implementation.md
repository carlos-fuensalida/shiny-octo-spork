# VPC + Cloud SQL for `supp-perf-mgmt-backend` — implementation runbook

**Scope, deliberately narrow:** this covers *only* Direct VPC egress on
`supp-perf-mgmt-backend` so it can reach a private-IP Cloud SQL instance
(`docs/cloudsql-postgres-setup.md`). It does **not** touch ingress, IAP, or
IAM invoker bindings on any service — `supp-perf-mgmt-frontend`,
`supp-perf-mgmt-ai`, and the `frontend-chat` test service are untouched by
everything below. If "implement VPC for the project" (SPM-208) ever expands
to mean locking down ingress project-wide, that is a separate piece of work
— see the ingress-lockdown discussion already had in chat/session memory,
not repeated here.

Nothing in this doc has been run yet. It's the checklist to work through
before touching the real dev project, in order.

## 0. Why this is one-time infra + a permanent pipeline change, not a one-off command

Two different things are being set up here, and they have different
lifecycles:

- **The infra itself** (VPC, subnet, private-services peering, the Cloud SQL
  instance) — created **once** per environment. It sits there independently
  of any deploy.
- **The Cloud Run service's attachment to that infra** (`--network`,
  `--subnet`, `--vpc-egress` on `gcloud run deploy`) — this is revision
  config, and Cloud Run has no memory of it between deploys. Every
  `gcloud run deploy` builds a brand-new revision from only the flags given
  *that* call. Bitbucket's `deploy_cloud_run` step already runs on every push
  to `dev`/`qa`/`main` — so these three flags have to be baked into that
  step's `gcloud run deploy` call permanently (see §5), not run by hand once.
  A manual `gcloud run services update --network=... ` from Cloud Shell would
  work right up until the next pipeline deploy overwrites it with a revision
  that doesn't have it.

## 0.5. Alternative considered and rejected: Postgres running as its own Cloud Run service

Raised in session: instead of Cloud SQL, run Postgres itself in a container
on Cloud Run, to avoid the VPC work below entirely. Rejected — it doesn't
actually avoid the VPC work, and introduces a real risk of data loss:

- Cloud Run has no attached persistent disk. The only writable-volume
  option besides ephemeral `tmpfs` is a Cloud Storage bucket via GCS FUSE,
  which does not provide the POSIX semantics (byte-range locking, atomic
  rename, real `fsync`) Postgres depends on for its data directory — a
  documented data-corruption risk, not a theoretical one.
- Cloud Run instances are not singletons — the platform scales instance
  count with traffic and can recycle any instance at any time. A database
  needs exactly one process holding its data files; nothing in Cloud Run
  guarantees that, opening the door to split-brain writes or a mid-write
  kill.
- It still wouldn't remove the VPC-shaped work — service-to-service privacy
  is easy without a VPC either way, but durability/backup/failover
  (the actual reason to run a real database) isn't solved by this, just
  reinvented badly.

If the goal is specifically to avoid the VPC lift below, the one option
that genuinely does that while staying policy-compliant is Firestore
(`constraints/sql.restrictPublicIp` never applies — it's a Google API, not
a network-addressable instance). That was already weighed against Cloud SQL
and passed over for relational/join/reporting needs — worth reopening
explicitly if that trade-off looks different now, rather than treating
Postgres-on-Cloud-Run as a middle ground. It isn't one.

## 1. CIDR plan — reserved now for dev/qa/prod, even though only dev exists

Each environment is its own GCP project (`prj-na-gss-supp-perform-d-219` for
dev; qa/prod projects don't exist yet — see
`docs/release-rollback-runbook.md` §5). A collision *within* one project
isn't possible until qa/prod exist, but picking non-overlapping ranges now
costs nothing and avoids ever having to re-IP something later if these
projects are ever connected (Shared VPC, VPC Peering, an on-prem
Interconnect/VPN) — none of that exists today as far as anything checked in
this repo shows, but ranges are cheap to reserve and expensive to redo.

| Environment | Project | Region | Direct VPC egress subnet | Private Services Access range |
|---|---|---|---|---|
| dev | `prj-na-gss-supp-perform-d-219` | us-east4 | `10.10.0.0/24` | `10.10.16.0/20` |
| qa | *(TBD — not yet created)* | us-east4 | `10.20.0.0/24` | `10.20.16.0/20` |
| prod | *(TBD — not yet created)* | us-east4 | `10.30.0.0/24` | `10.30.16.0/20` |

- The `/24` subnet is what the Cloud Run revision's Direct VPC egress
  attaches to — Google's own guidance is a `/26` minimum for headroom per
  revision; `/24` leaves room to add more Cloud Run services onto the same
  subnet later without re-planning.
- The `/20` is the range reserved for Google-managed private-services peering
  (what Cloud SQL's private IP actually comes from) — sized to cover more
  than one Cloud SQL instance per environment if that's ever needed.
- **Caveat:** this only guarantees non-overlap *among these three
  environments' own ranges*, chosen from RFC1918 space that nothing in this
  project currently uses (confirmed: `VPC: None` on every Cloud Run service
  today). It is not a claim about the wider Whirlpool network — if these
  projects are ever bridged to a corporate network, whoever owns that IP
  plan should confirm these ranges don't collide with it first.

## 2. Check you can actually do this, before creating anything

Run this in Cloud Shell against the dev project. It doesn't create or change
anything — `test-iam-permissions` just answers "can this principal do X,"
so it's the safe first step.

```bash
PROJECT_ID="prj-na-gss-supp-perform-d-219"

# `gcloud projects test-iam-permissions` does not exist as a command (only
# some other resource types, e.g. `gcloud storage buckets
# test-iam-permissions`, get a dedicated subcommand) — for projects, call
# the Cloud Resource Manager API's testIamPermissions method directly.
curl -sS -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT_ID}:testIamPermissions" \
  -d '{
    "permissions": [
      "compute.networks.create",
      "compute.networks.get",
      "compute.subnetworks.create",
      "compute.subnetworks.get",
      "compute.globalAddresses.create",
      "compute.globalAddresses.get",
      "servicenetworking.services.addPeering",
      "cloudsql.instances.create",
      "cloudsql.instances.get",
      "run.services.update",
      "run.services.get",
      "resourcemanager.projects.setIamPolicy"
    ]
  }'
```

The response is JSON with a `permissions` array listing just the subset of
the requested list the calling identity actually holds — compare it against
the full list above.

**Actual result (2026-08-27, `carlos_fuensalida_evalueserve@...`):** 8 of the
12 came back. Missing, and confirmed blocking, not just theoretical:

| Missing permission | Blocks | Role that grants it |
|---|---|---|
| `compute.networks.create` | Creating the VPC (§3) | `roles/compute.networkAdmin` |
| `compute.subnetworks.create` | Creating the subnet (§3) | `roles/compute.networkAdmin` |
| `servicenetworking.services.addPeering` | The Private Services Access peering (§3) | `roles/servicenetworking.networksAdmin` |
| `resourcemanager.projects.setIamPolicy` | Both IAM grants in §4 | `roles/resourcemanager.projectIamAdmin` |

Present and unaffected: `cloudsql.instances.create/get`,
`compute.globalAddresses.create/get`, `compute.networks.get`,
`compute.subnetworks.get`, `run.services.get/update` — the Cloud SQL
instance and the Cloud Run service side of this are fully within reach
already; it's specifically the shared network plumbing (VPC, subnet,
peering) and the IAM grants that need someone with broader project IAM.

**Action needed before §3/§4 can run:** ask whoever holds Owner/IAM Admin on
`prj-na-gss-supp-perform-d-219` to either (a) run the network-create,
subnet-create, peering-create, and two IAM-binding commands directly — a
bounded, one-time ask — or (b) grant the three roles above so this can be
run end to end without a second person. Either works; (a) avoids leaving a
standing broader grant in place afterward.

**Follow-up (same day) — where the working permissions actually come from,
and why that line of inquiry stops here:** ran `gcloud policy-troubleshoot
iam` (API `policytroubleshooter.googleapis.com`, enabled for this) against
both a held permission (`cloudsql.instances.create`) and the four missing
ones. Result:

- All four missing permissions came back `NOT_GRANTED` at the project level,
  cleanly — confirmed absent, not just unproven.
- `cloudsql.instances.create` — a permission `testIamPermissions` already
  proved you hold — came back `UNKNOWN_INFO_DENIED` even at the project
  level. That combination (permission demonstrably works, but the tool
  can't explain why) is the signature of a **Google Group** binding:
  Troubleshooter found a candidate role but isn't authorized to resolve
  whether you're a member of the group it's bound to — that lookup hits
  Whirlpool's Workspace/Cloud Identity directory, and permission to query
  group membership is a Workspace-admin setting, not something fixable via
  this project's IAM.
- The folder above the project (`625301422871`) shows the same
  `UNKNOWN_INFO_DENIED`/redacted-resource pattern — consistent with the
  earlier, separate finding that this identity also lacks
  `resourcemanager.folders.getIamPolicy` on that folder (the org-policy
  escalation work above hit the identical wall).

**Conclusion:** this is a real ceiling, not a scripting problem — no
further `gcloud` digging from this identity will name the group. It doesn't
block anything, though: the four missing permissions are independently and
unambiguously absent, so the ask to the project's IAM admin (above) doesn't
need to wait on identifying it.

Also worth confirming which broad role/binding you're actually holding.
Get the real identity first — don't guess at the email:

```bash
ME="$(gcloud auth list --filter=status:ACTIVE --format='value(account)')"
echo "${ME}"
```

Then check direct project bindings:

```bash
gcloud projects get-iam-policy "${PROJECT_ID}" \
  --flatten="bindings[].members" \
  --filter="bindings.members:${ME}" \
  --format="table(bindings.role)"
```

**This can legitimately come back empty even though `testIamPermissions`
shows real permissions** — that just means the access is coming from a
Google Group binding or is inherited from the folder/org, neither of which
this filter (literal email, project-level only) will show. Policy
Troubleshooter answers that properly, including group/inherited bindings —
worth using instead of trying to read the raw policy by hand:

```bash
gcloud policy-troubleshoot iam \
  "//cloudresourcemanager.googleapis.com/projects/${PROJECT_ID}" \
  --principal-email="${ME}" \
  --permission="cloudsql.instances.create"
```

(swap `--permission` for any of the 12 from §2's list, one call per
permission, to see exactly which binding each one traces back to.)

## 3. Create the infra (run once per environment)

```bash
PROJECT_ID="prj-na-gss-supp-perform-d-219"
REGION="us-east4"
NETWORK="spms-vpc-dev"
SUBNET="spms-backend-egress-dev"
PSA_RANGE_NAME="spms-psa-range-dev"

gcloud config set project "${PROJECT_ID}"

# APIs needed beyond what's already enabled (sqladmin is already on, per
# the earlier `gcloud sql instances create` attempt).
gcloud services enable \
  compute.googleapis.com \
  servicenetworking.googleapis.com

# A dedicated VPC, not `default` — keeps this isolated and easy to mirror
# in qa/prod later.
gcloud compute networks create "${NETWORK}" \
  --subnet-mode=custom

# The subnet Direct VPC egress attaches to.
gcloud compute networks subnets create "${SUBNET}" \
  --network="${NETWORK}" \
  --region="${REGION}" \
  --range="10.10.0.0/24"

# Reserve the range Private Services Access (Cloud SQL's private IP) will
# allocate addresses from.
gcloud compute addresses create "${PSA_RANGE_NAME}" \
  --global \
  --purpose=VPC_PEERING \
  --addresses=10.10.16.0 \
  --prefix-length=20 \
  --network="${NETWORK}"

# The peering itself — this is what lets Cloud SQL hand out a private IP in
# that reserved range.
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges="${PSA_RANGE_NAME}" \
  --network="${NETWORK}"

# Create the instance with no external IP, on this network — this is the
# exact fix for the earlier `sql.restrictPublicIp` failure.
gcloud sql instances create supp-perf-mgmt-db-dev \
  --database-version=POSTGRES_15 \
  --region="${REGION}" \
  --tier=db-custom-1-3840 \
  --network="${NETWORK}" \
  --no-assign-ip \
  --project="${PROJECT_ID}"

# The actual database the backend connects to.
gcloud sql databases create supp_perf_mgmt \
  --instance=supp-perf-mgmt-db-dev

# AUTO_IAM_AUTHN (docs/cloudsql-postgres-setup.md's stated decision — no DB
# password anywhere): register the backend's own runtime SA as a Postgres
# IAM user rather than creating a password-based one. BACKEND_SA is the same
# value used in §4 below.
gcloud sql users create "${BACKEND_SA%.gserviceaccount.com}" \
  --instance=supp-perf-mgmt-db-dev \
  --type=cloud_iam_service_account
```

## 4. IAM grants (one-time, specific-principal — not affected by the `allUsers`-blocking org policy)

```bash
BACKEND_SA="<backend Cloud Run runtime SA email — confirm from Console →
supp-perf-mgmt-backend → Security tab; not yet captured in this repo, see
docs/cloudsql-postgres-setup.md's Open item>"

# Lets the backend's Cloud Run revision attach to the subnet.
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${BACKEND_SA}" \
  --role="roles/compute.networkUser" \
  --condition=None

# Lets the backend connect to the Cloud SQL instance.
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${BACKEND_SA}" \
  --role="roles/cloudsql.client" \
  --condition=None
```

## 5. Pipeline change — every deploy, not a one-off (answers "do we configure this every deployment?")

The infra above (§3, §4) is created once and just sits there. But the Cloud
Run *service's* pointer to it has to be part of every `gcloud run deploy`
call, because each deploy creates a fresh revision — see §0. Concretely, in
`supp-perf-mgmt-backend/bitbucket-pipelines.yml`:

- `get_env_variable` step: add two more lines per branch, same pattern as
  every existing `ENVIRONMENT_*` line (e.g. for `dev`):
  ```
  echo ENVIRONMENT_VPC_NETWORK=$DEV_ENVIRONMENT_VPC_NETWORK >> $BITBUCKET_PIPELINES_VARIABLES_PATH
  echo ENVIRONMENT_VPC_SUBNET=$DEV_ENVIRONMENT_VPC_SUBNET >> $BITBUCKET_PIPELINES_VARIABLES_PATH
  ```
  and add both to `output-variables`.
- `deploy_cloud_run` step: add to the existing `gcloud run deploy` call
  (the one at line ~253 that already sets `--service-account`,
  `--no-allow-unauthenticated`, etc.):
  ```
  --network="${ENVIRONMENT_VPC_NETWORK}" \
  --subnet="${ENVIRONMENT_VPC_SUBNET}" \
  --vpc-egress=private-ranges-only \
  ```
  `private-ranges-only` (not `all-traffic`) is the deliberate choice — it
  routes only RFC1918/Cloud SQL-range traffic through the VPC and leaves
  everything else (Google APIs, this service's existing outbound calls)
  on the normal path, so nothing else about the service's behavior changes.
- Add the new `{PREFIX}_ENVIRONMENT_VPC_NETWORK` / `{PREFIX}_ENVIRONMENT_VPC_SUBNET`
  Bitbucket repository variables (`DEV_` now; `QA_`/`PROD_` once those
  projects exist), same as every other `{PREFIX}_*` variable this pipeline
  already reads.
- Add the DB connection details (host = the instance's private IP or
  connection name, `AUTO_IAM_AUTHN` so no password) the same way
  `SERVICE_BASE_URL` is already wired as a runtime `--set-env-vars` value.

No changes to `supp-perf-mgmt-frontend`'s or `supp-perf-mgmt-ai`'s pipelines.

## 6. Bitbucket repository variables to add

All new, none of them touch `supp-perf-mgmt-frontend`'s or
`supp-perf-mgmt-ai`'s variable sets. Add these to
`supp-perf-mgmt-backend`'s repo variables, `DEV_` now — `QA_`/`PROD_` follow
the same shape once those projects/instances exist (§1's CIDR table gives
the qa/prod values to use when that happens).

None of these are secrets — no `DB_PASSWORD` exists because
`AUTO_IAM_AUTHN` means the backend authenticates as its own runtime service
account, not a password-based DB user. Add them as plain repository
variables, the same as `DEV_ENVIRONMENT_GCP_PROJECT_ID` etc. already are —
no need to tick "Secured."

| Variable | Example value (dev) | Where it comes from |
|---|---|---|
| `DEV_ENVIRONMENT_VPC_NETWORK` | `spms-vpc-dev` | The `NETWORK` name created in §3 |
| `DEV_ENVIRONMENT_VPC_SUBNET` | `spms-backend-egress-dev` | The `SUBNET` name created in §3 |
| `DEV_ENVIRONMENT_DB_INSTANCE_CONNECTION_NAME` | `prj-na-gss-supp-perform-d-219:us-east4:supp-perf-mgmt-db-dev` | `gcloud sql instances describe supp-perf-mgmt-db-dev --format='value(connectionName)'` — this is what the Cloud SQL Node.js connector library takes, not a bare host/IP |
| `DEV_ENVIRONMENT_DB_NAME` | `supp_perf_mgmt` | The database created in §3 |
| `DEV_ENVIRONMENT_DB_USER` | `supp-perf-mgmt-backend-dev@prj-na-gss-supp-perform-d-219.iam` | The backend's runtime SA email with the `.gserviceaccount.com` suffix dropped — this exact transform is what `gcloud sql users create --type=cloud_iam_service_account` in §3 registers, and what Postgres IAM auth expects as the role name |

`DEV_ENVIRONMENT_DB_INSTANCE_CONNECTION_NAME` is the one value here that
isn't chosen up front — it only exists once the instance in §3 has actually
been created, so it's the last one to fill in, after §3 runs.

Wiring these into the pipeline follows the same `get_env_variable` →
`output-variables` → `deploy_cloud_run`'s `--set-env-vars` path §5 already
describes for `ENVIRONMENT_VPC_NETWORK`/`ENVIRONMENT_VPC_SUBNET` — the three
DB variables go through the identical plumbing, they just land in
`--set-env-vars` (application runtime config) rather than as `gcloud run
deploy` flags (Cloud Run networking config).

## 7. Verify

```bash
gcloud run services describe supp-perf-mgmt-backend \
  --region=us-east4 \
  --format="yaml(spec.template.metadata.annotations)" \
  | grep -i vpc-access
```

Should show the network/subnet/egress annotations after the first deploy
with the flags in place. Then a real request that hits a DB-backed route is
the actual proof — the annotation only proves the revision *has* egress
configured, not that it can reach the instance.
