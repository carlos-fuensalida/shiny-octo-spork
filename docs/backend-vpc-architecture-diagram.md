# Backend VPC architecture — diagram

Visual companion to `docs/vpc-backend-cloudsql-implementation.md`. Shows the
end state after that runbook is executed: `supp-perf-mgmt-backend` gains a
Direct VPC egress path to a private-IP Cloud SQL instance, while the
frontend's Google IAP, every SA-to-SA IAM call between the three services,
and `supp-perf-mgmt-frontend-chat` all stay exactly as they are today.

**Link:** https://claude.ai/code/artifact/7b860cca-914d-432a-9a96-df0cc7ac5de7

This is a published Claude Artifact, not a file in this repo — it isn't
tracked by `git` here and won't show up in a diff. If it's ever redrawn to
match a change in the runbook, update this link rather than assuming it's
still current; nothing keeps the two in sync automatically.
