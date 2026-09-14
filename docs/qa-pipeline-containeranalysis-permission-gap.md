# QA deploy pipeline failure — `containeranalysis.occurrences.list`

## Update — actual fix applied

**Superseded below.** The IAM-grant analysis in this doc was the working
theory for most of this investigation, but the fix that actually resolved it
(applied independently by Amandeep, backend commit `389c274`, then mirrored to
frontend commit `7dd815a`) was simpler: comment out the
`gcloud artifacts docker images describe "${IMAGE_URI}"` line in the
`deploy_cloud_run` step entirely. It was only ever a pre-deploy existence
check, not essential to the deploy itself — removing it sidesteps the
permission requirement rather than granting it. The root-cause analysis below
is still accurate as an explanation of *why* dev and qa behaved differently,
kept for reference, but the "recommended fix" section is not what shipped.

## Original TL;DR (superseded)

`supp-perf-mgmt-backend`'s qa pipeline fails at `Deploy to Cloud Run` because the
qa deploying service account is missing one specific IAM permission that dev's
service account happens to have — not because of a group, folder, or org-level
difference between the two projects. One targeted grant fixes it.

## The error

```
ERROR: (gcloud.artifacts.docker.images.describe)
[s6-na-gss-qa-cebos-qms-sa@prj-na-gss-supp-perform-q-373.iam.gserviceaccount.com]
does not have permission ...: Permission 'containeranalysis.occurrences.list' denied
on resource 'projects/0000005ac9a57742'
```

This happens on the pre-deploy `gcloud artifacts docker images describe
"${IMAGE_URI}"` call — a fail-fast check that the image exists before the
pipeline tries to deploy it. That command unconditionally queries Container
Analysis as part of building its image summary (confirmed: it fails this way
even with zero `--show-*` flags passed), which is a separate API/permission
set from Artifact Registry itself.

## Root cause (confirmed via `gcloud policy-troubleshoot iam`, not a guess)

Dev's deploying SA (`s6-na-gss-dev-cebos-qms-sa@prj-na-gss-supp-perform-d-219...`)
passes this check because it directly holds **`roles/cloudbuild.serviceAgent`**
("Cloud Build Service Agent") on the dev project. Troubleshooter output
confirms this is the actual granting binding:

```yaml
- access: GRANTED
  memberships:
    serviceAccount:s6-na-gss-dev-cebos-qms-sa@prj-na-gss-supp-perform-d-219.iam.gserviceaccount.com:
      membership: MEMBERSHIP_INCLUDED
      relevance: HIGH
  role: roles/cloudbuild.serviceAgent
  rolePermission: ROLE_PERMISSION_INCLUDED
  rolePermissionRelevance: HIGH
```

That role's real purpose is Cloud Build's own container-scanning/provenance
integration — its `containeranalysis.occurrences.list` access is a side
effect, not something anyone deliberately granted for this pipeline's image
check.

**Qa's SA never received `roles/cloudbuild.serviceAgent`** — confirmed absent
from its full IAM console role list (qa has `Cloud Build Editor` and `Cloud
Deploy Viewer`, no `Cloud Build Service Agent`). That single missing role is
the entire dev-vs-qa difference. It is not a group-inheritance or
folder/org-level issue — every group-related line in the troubleshooter output
(`acl-na-gss-supp-perform-dev-grp@whirlpool.com`) came back
`UNKNOWN_INFO_DENIED` and turned out to be irrelevant to this specific
permission once traced through.

## Recommended fix

Grant qa's SA the narrow, correctly-scoped role — **not** a copy of dev's
`cloudbuild.serviceAgent`, since that role is broader than this need and its
presence on dev looks incidental rather than intentional:

```bash
gcloud projects add-iam-policy-binding prj-na-gss-supp-perform-q-373 \
  --member="serviceAccount:s6-na-gss-qa-cebos-qms-sa@prj-na-gss-supp-perform-q-373.iam.gserviceaccount.com" \
  --role="roles/containeranalysis.occurrences.viewer" \
  --condition=None
```

Not affected by the `allUsers`/Domain Restricted Sharing org policy — this is
a specific-principal binding, same shape as the `compute.networkUser` /
`cloudsql.client` grants already in use elsewhere on this project.

## One more thing worth flagging on dev

Dev's pipeline works today, but only because it's incidentally covered by a
role (`roles/cloudbuild.serviceAgent`) that has nothing to do with why it's
needed. If that role is ever removed from dev's SA during some future
cleanup (since on its face it looks unrelated to this deploy pipeline),
dev will start failing the exact same way qa did, with no pipeline change
having caused it. Worth either documenting that dependency somewhere it'll be
seen before someone "cleans it up," or granting dev the same explicit
`roles/containeranalysis.occurrences.viewer` so both environments' pipelines
depend on a grant made *for* this purpose rather than one borrowed from
somewhere else.

## Status

- `dev`: pipeline green (`bitbucket-pipelines.yml` commit `775d729`).
- `qa`: same commit promoted, blocked purely on the IAM grant above — no
  further pipeline/code changes needed once it's applied.
