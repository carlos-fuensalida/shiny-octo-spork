# GCP deploying service accounts and ACL groups

Per-environment deploying service account for the `cebos-qms` (SPMS) Cloud Run
services, and the Google Group used for IAM/access-control bindings in each
project. Kept as one lookup table because these values otherwise only appear
scattered one-at-a-time across other docs (`cloudsql-postgres-setup.md`,
`qa-pipeline-containeranalysis-permission-gap.md`,
`vpc-backend-cloudsql-implementation.md`) — e.g. when granting a role, use the
SA for that environment's project, and check membership against that
environment's ACL group before assuming a new grant is needed.

| Env  | Service account | GCP project | ACL group |
| ---- | --- | --- | --- |
| DEV  | `s6-na-gss-dev-cebos-qms-sa@prj-na-gss-supp-perform-d-219.iam.gserviceaccount.com` | `prj-na-gss-supp-perform-d-219` | `acl-na-gss-supp-perform-dev-grp@whirlpool.com` |
| QA   | `s6-na-gss-qa-cebos-qms-sa@prj-na-gss-supp-perform-q-373.iam.gserviceaccount.com` | `prj-na-gss-supp-perform-q-373` | `acl-na-gss-supp-perform-qa-grp@whirlpool.com` |
| PROD | `s6-na-gss-prod-cebos-qms-sa@prj-na-gss-supp-perform-p-443.iam.gserviceaccount.com` | `prj-na-gss-supp-perform-p-443` | `acl-na-gss-supp-perform-prod-grp@whirlpool.com` |

Notes:

- These are the same SA name pattern (`s6-na-gss-<env>-cebos-qms-sa`) reused
  across frontend, backend, and AI Agent deploys within an environment's
  project — not a distinct SA per service. See the note in
  `vpc-backend-cloudsql-implementation.md` where this is called out for the
  backend's Cloud SQL connection.
- The QA project ID (`prj-na-gss-supp-perform-q-373`) and PROD project ID
  (`prj-na-gss-supp-perform-p-443`) are not secrets — kept alongside real IDs
  elsewhere in `docs/` per this repo's convention (see CLAUDE.md).
