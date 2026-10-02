# Cloud SQL ↔ `supp-perf-mgmt-backend` — actual state in dev (verified 2026-10-02)

This records what GCP admins actually built in `prj-na-gss-supp-perform-d-219`,
confirmed directly against the live project via `gcloud` on 2026-10-02 by
`carlos.fuensalida@evalueserve.com`. It does **not** describe a plan — every
value below came from a `describe`/`list` command, not from a ticket or an
assumption.

**Relationship to the existing docs:** `docs/vpc-backend-cloudsql-implementation.md`
and `docs/cloudsql-postgres-setup.md` describe the *originally planned*
architecture — a dedicated per-environment VPC created inside
`prj-na-gss-supp-perform-d-219` itself, with a manually created PSC endpoint.
**That is not what was built.** What exists instead is a Shared VPC setup
(§2 below). Those two docs' decisions that are *not* about the VPC's
ownership — private-IP-only, PSC over peering, `AUTO_IAM_AUTHN` — still hold
and are cross-checked against reality in §3/§4 below.

## 1. Cloud SQL instance — confirmed

| Field | Value |
|---|---|
| Name | `spms-db-dev` |
| Project | `prj-na-gss-supp-perform-d-219` |
| Region / zone | `us-east4` / `us-east4-b` |
| Database version | `POSTGRES_15` (`POSTGRES_15_19`) |
| Tier | `db-custom-1-3840` |
| Disk | 20 GB, `PD_SSD`, autoresize off |
| Availability | `ZONAL` (not HA) |
| Connection name | `prj-na-gss-supp-perform-d-219:us-east4:spms-db-dev` |
| State | `RUNNABLE` |
| Created | 2026-09-24 |

## 2. Private connectivity — PSC via Shared VPC, not a dedicated VPC

```
gcloud compute shared-vpc get-host-project prj-na-gss-supp-perform-d-219
→ name: prj-na-netsharedsvs-d-295
```

`prj-na-gss-supp-perform-d-219` is a **Shared VPC service project** of host
project `prj-na-netsharedsvs-d-295`. The VPC network is
`svpc-na-sharedsvs-d`, owned and managed centrally — there is no
`spms-vpc-dev` or any other network inside the backend's own project
(`gcloud compute networks list` / `subnets list` both return **0 items** in
`prj-na-gss-supp-perform-d-219`, confirmed 2026-10-02).

Cloud SQL's private connectivity is a **PSC auto-connection** (admin
pre-authorized the consumer project; Cloud SQL auto-provisioned the
endpoint), not the manually created `gcloud compute addresses create` +
`forwarding-rules create` pair the original runbook's §3 describes:

| Field | Value |
|---|---|
| `pscEnabled` | `true` |
| `ipv4Enabled` | `false` (no public IP — consistent with `sql.restrictPublicIp`) |
| `allowedConsumerProjects` | `prj-na-gss-supp-perform-d-219` |
| Consumer network | `projects/prj-na-netsharedsvs-d-295/global/networks/svpc-na-sharedsvs-d` |
| PSC endpoint IP | `10.67.18.2` (status `ACTIVE`, `VALID`) |
| `requireSsl` | `false`; `sslMode` | `ENCRYPTED_ONLY` — connections are encrypted in transit but a client cert isn't mandatory |

`10.67.18.2` falls inside `subnet-ue4-sspsc-d-1` (`10.67.18.0/24`, see §5) —
that's the subnet the *database's* PSC endpoint lives in. It is not
necessarily the subnet the backend's Cloud Run service should attach to for
its own egress — don't conflate the two.

## 3. Databases & users — mostly matches the original plan, one real gap

```
gcloud sql databases list --instance=spms-db-dev
→ postgres, PostgreSQL15, supp_perf_mgmt
```
`supp_perf_mgmt` exists, matching what the pipeline will need (plus two
default databases Cloud SQL/Postgres create on their own — not a concern).

```
gcloud sql users list --instance=spms-db-dev
→ postgres (BUILT_IN)
→ s6-na-gss-dev-cebos-qms-sa@prj-na-gss-supp-perform-d-219.iam (CLOUD_IAM_SERVICE_ACCOUNT)
```
The backend's runtime SA is already registered as an IAM-auth Postgres user
— correctly transformed (`.gserviceaccount.com` dropped), matching the
`AUTO_IAM_AUTHN` / no-password decision.

**Gap:** `gcloud sql instances describe spms-db-dev --format='value(settings.databaseFlags)'`
returns **nothing** — confirmed twice. There is no `databaseFlags` key at
all in the full `describe` dump. `cloudsql.iam_authentication=on` is not
set. Postgres IAM database auth is off by default, so as it stands today
**the IAM user above exists but cannot actually log in.** This needs a
decision: either it's an oversight to fix (`gcloud sql instances patch
--database-flags=cloudsql.iam_authentication=on` — note this restarts the
instance, it's not a hot patch), or the plan silently changed to
password-based auth and nobody updated the user/decision to match. Worth
asking the admins directly rather than assuming either way.

## 4. Cloud Run backend service — confirmed

| Field | Value |
|---|---|
| Service | `supp-perf-mgmt-backend`, region `us-east4` |
| Runtime SA | `s6-na-gss-dev-cebos-qms-sa@prj-na-gss-supp-perform-d-219.iam.gserviceaccount.com` |
| Current revision | `supp-perf-mgmt-backend-00015-5nh` |
| Ingress | `all` (expected — this is the external path IAP's load balancer uses, not a contradiction of the IAP decision) |
| VPC egress | **Not configured.** No `run.googleapis.com/vpc-access-connector` or network-interfaces annotation present on the revision — confirms Direct VPC egress hasn't been wired up yet, consistent with everything above. |
| Existing env vars | `NODE_ENV`, `SERVICE_BASE_URL` (already a real URL, not the `placeholder.invalid` workaround — that's been resolved for this revision), `BIGQUERY_PROJECT_ID`/`BIGQUERY_DATASET_ID`/cost-recovery and VMI BigQuery vars. **No `DB_*` vars yet** — expected, nothing wires Postgres in yet. |

## 5. Shared VPC subnets available in `svpc-na-sharedsvs-d` (us-east4 only)

Purpose is inferred from naming — **not confirmed by an admin** — flag
anything below as a guess, not a fact, until someone who owns the network
confirms it:

| Subnet | CIDR | Likely purpose (inferred) |
|---|---|---|
| `subnet-ue4-sscomposer-d-1` | `10.67.22.0/26` | Cloud Composer |
| `subnet-ue4-ssconnector-d-1` … `-16` | sixteen `/28`s under `10.67.20.0/24` | Serverless VPC Access connectors (legacy pattern — too small per-subnet for Direct VPC egress, which doesn't use this mechanism) |
| `subnet-ue4-sscrworkerpool-d-1` | `10.67.23.64/26` | **Best guess for Cloud Run egress** — "cr" naming, and `/26` matches Google's own minimum-sizing guidance for Direct VPC egress |
| `subnet-ue4-ssgke-d-6`, `-7` | `/28`s | GKE |
| `subnet-ue4-ssgkelb-d-1` | `10.67.24.0/22` | GKE load balancing |
| `subnet-ue4-ssgkemain-d-1` | `10.67.19.0/24` | GKE main |
| `subnet-ue4-ssproxy-d-1` | `10.67.16.0/23` | Proxy-only subnet (L7 LB) |
| `subnet-ue4-sspsc-d-1` | `10.67.18.0/24` | PSC endpoints — confirmed, this is where Cloud SQL's own endpoint IP sits (§2) |
| `subnet-ue4-ssvm-d-1` | `10.67.0.0/20` | General VM workloads |

## 6. IAM on the backend SA — what's already granted, what's unverified

Project-level roles on `s6-na-gss-dev-cebos-qms-sa@...` in
`prj-na-gss-supp-perform-d-219` (confirmed 2026-10-02) include, relevant to
this work:

- `roles/cloudsql.client` ✅ — can connect to the instance
- `roles/cloudsql.instanceUser` ✅ — the permission `cloudsql.instances.login` needs, for IAM DB auth specifically (useless until §3's flag gap is resolved, but already in place)
- `roles/cloudsql.admin` — broader than needed, pre-existing
- `roles/compute.networkUser` — **present, but only in this project.** This does not by itself grant permission to attach to a subnet owned by the Shared VPC host project `prj-na-netsharedsvs-d-295` — that grant has to exist in the host project (project-level or on the specific subnet), and **has not been checked yet.**

This SA also holds a large number of unrelated admin roles
(`bigquery.admin`, `storage.admin`, `secretmanager.admin`, `run.admin`,
etc.) — same observation the original docs already made: it's a shared SA
(`cebos-qms-sa` in its name suggests an unrelated system), not one scoped
to this backend. Still just a flag, not something this document is trying
to resolve.

## 7. Open items — need network-admin input before touching the pipeline

1. **Which subnet in `svpc-na-sharedsvs-d` (us-east4) is designated for this
   backend's Direct VPC egress?** `subnet-ue4-sscrworkerpool-d-1` is the
   naming-based guess (§5) — get it confirmed rather than assumed.
2. **Has `roles/compute.networkUser` been granted to
   `s6-na-gss-dev-cebos-qms-sa@...` in the host project
   `prj-na-netsharedsvs-d-295`**, either at the project level or on the
   specific subnet from #1? Check once #1 is answered:
   ```bash
   gcloud compute networks subnets get-iam-policy <SUBNET_NAME> \
     --project=prj-na-netsharedsvs-d-295 --region=us-east4
   ```
3. **Why is `cloudsql.iam_authentication` not set** despite the IAM DB user
   already existing (§3) — oversight to fix, or did the auth plan change?

Until these three are answered, the Cloud Run side of the attachment
(`--network`/`--subnet`/`--vpc-egress` flags) can't be filled in correctly —
guessing the subnet risks attaching to the wrong one (e.g. a GKE- or
connector-reserved range) with no clear failure until deploy time.
