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
on Cloud Run, IAM grants (including the permission gap found when actually
checking for them — see that doc's §2), Bitbucket variables, pipeline diff,
and verification — now lives in this same repo:
`docs/vpc-backend-cloudsql-implementation.md`. That supersedes the "ask
Carlos for the link" note this section used to carry — it's in-repo now, not
a separate shared artifact.

## Runtime service account (dev — confirmed 2026-09-08)

`s6-na-gss-dev-cebos-qms-sa@prj-na-gss-supp-perform-d-219.iam.gserviceaccount.com`,
pulled from `gcloud run services describe supp-perf-mgmt-backend`'s YAML
output (`spec.template.spec.serviceAccountName`). Its name suggests it's
shared with an unrelated system ("CEBOS QMS"), not dedicated to this backend
— worth confirming that's intentional before granting `roles/cloudsql.client`
/ `roles/compute.networkUser` to it, since those would apply everywhere else
this SA is used too.

qa (`prj-na-gss-supp-perform-q-373`) and prod (`prj-na-gss-supp-perform-p-443`)
each need the same lookup done against their own backend service once it
exists there — don't assume this same SA carries over.
