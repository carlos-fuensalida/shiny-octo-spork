# Cloud SQL for PostgreSQL → `supp-perf-mgmt-backend`

Reference copy of the runbook handed to the GCP/infra team for wiring a
PostgreSQL instance (user-preferences storage) into the backend Cloud Run
service. The formatted version lives in the artifact link shared alongside
this file — this copy exists so the decision and the exact commands are
tracked in-repo, per this repo's convention of keeping cross-repo findings in
`docs/`.

## The decision (revised 2026-08-26)

PostgreSQL, via Cloud SQL, **private IP only, reached from Cloud Run over
Direct VPC egress.**

The original plan called for public IP + the built-in Cloud Run ↔ Cloud SQL
connector, on the reasoning that no VPC exists in this project today. That
plan was correct *in general* but wrong *for this project*: the first real
`gcloud sql instances create` attempt failed with

```
ERROR: (gcloud.sql.instances.create) HTTPError 400: Invalid request:
Organization Policy check failure: the external IP of this instance violates
the constraints/sql.restrictPublicIp enforced at the 508857463128 project.
```

`constraints/sql.restrictPublicIp` blocks any Cloud SQL instance from being
created with an external IP in this project — there's no flag around it, the
instance has to be private-IP-only. So the VPC work (network + subnet +
service-networking peering + Direct VPC egress on the Cloud Run service) is
mandatory here, not an optional hardening step for later.

This is a **different org policy** from the Domain Restricted Sharing one
already tracked for this project (`constraints/iam.allowedPolicyMemberDomains`,
blocking `allUsers` IAM bindings, pending an exception at folder
`625301422871`). Don't conflate the two:

- `iam.allowedPolicyMemberDomains` — blocks `allUsers`/non-org IAM bindings.
  Blocks `--allow-unauthenticated`. Needs a folder-level exception if a
  public-facing service is ever required. Not relevant to Cloud SQL.
- `sql.restrictPublicIp` — blocks external IPs on Cloud SQL instances
  specifically. Solved by going private IP, no exception needed. Newly
  discovered 2026-08-26.

Both policies point the same direction: this org's default posture is
no-public-exposure. That's consistent with the "go private" decision already
made for the Data API and frontend ([[spms-public-vs-private-decision]] in
session memory) — the database landing on private IP isn't a detour from that
call, it's the same instinct applied one layer down.

## Why this still doesn't need the pending IAM exception

Granting `roles/cloudsql.client` to the backend's own Cloud Run service
account is a specific-principal binding — the same shape as the SA-to-SA
`roles/run.invoker` grant that already works for backend auth. It's
unaffected by `iam.allowedPolicyMemberDomains` and needs no exception.

## Handoff document

The full step-by-step runbook — APIs, VPC creation, the service-networking
peering Cloud SQL private IP requires, instance creation, Direct VPC egress
on Cloud Run, IAM grant, NestJS connector wiring (with `AUTO_IAM_AUTHN` so no
DB password exists), secrets handling, and verification — was written up for
the GCP team as a shareable document, including a revision-history table
recording the public-IP attempt and why it was superseded. Ask Carlos for the
current link if it's not attached to the ticket this file is referenced from.

## Open item

The backend Cloud Run service's exact runtime service account email wasn't
captured in this repo or in memory — the runbook flags it as a value the GCP
team needs to confirm from the Security tab before the IAM-grant step.
