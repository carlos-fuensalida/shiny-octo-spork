# PRD.md — Supplier Performance Management System (SPMS)

Master Product Requirements Document

---

## 1. Document Control

| Field | Value |
|---|---|
| Product | Supplier Performance Management System (SPMS) |
| Document | Master PRD (system-wide) |
| Version | 0.1 (Draft) |
| Status | Draft for stakeholder review |
| Owner | Project Manager |
| Contributors | AI Engineer, 2 Full-Stack Developers, DevOps Engineer |
| Related documents | `PRD-backend.md`, `PRD-frontend.md`, `PRD-ai-agent.md` |
| Target delivery | 3 months (conditional, see Section 6) |

### Changelog

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | TBD | PM | Initial draft from spec and discovery answers |

### How this document set is organized

This master PRD defines the product at a system level: goals, personas, scope, cross-cutting architecture, security model, and delivery plan. Three companion PRDs specify each component in build-ready detail:

- `PRD-backend.md` — Data API (FastAPI), centralized BigQuery layer, auth, persistence.
- `PRD-frontend.md` — Next.js dashboard, design system, five views plus per-KPI views.
- `PRD-ai-agent.md` — Google ADK agent, BigQuery MCP text-to-SQL, guardrails, sessions.

Requirement IDs are namespaced per document (`PROD-###` here, `BE-###`, `FE-###`, `AI-###` in the companions) so they stay traceable across the set.

---

## 2. Executive Summary and Problem Statement

Leadership and analysts currently spend roughly 2 to 3 working days pulling supplier performance data from multiple sources (about 60% in Google Sheets, 40% in BigQuery), reconciling it by hand, and writing up insights for management. The process is slow, repetitive, and hard to reproduce consistently.

SPMS replaces that manual cycle with a web dashboard that surfaces supplier KPIs across a set of structured views, plus an embedded AI assistant that answers questions in natural language and generates insights by following predefined analysis "recipes." The goal is to cut the manual analysis effort from days to minutes while keeping every AI-generated insight traceable back to source data.

The system serves internal users (leadership and analysts) who sign in with SSO, and external suppliers who receive a signed URL granting temporary, read-only access to a limited public view of their own data.

---

## 3. Goals, Non-Goals, and Success Metrics

### 3.1 Goals

- **G1.** Present supplier quality and delivery KPIs through a consistent, responsive dashboard.
- **G2.** Provide an AI assistant that answers in-scope questions and produces insights using traceable, recipe-driven analysis over live data.
- **G3.** Give suppliers a secure, temporary, self-scoped view of their own performance without requiring an account.
- **G4.** Build on a reusable design system so future KPI views and features are fast to add and cheap to maintain.
- **G5.** Consolidate Sheets and BigQuery data into a single centralized BigQuery layer used by both the backend and the AI agent.

### 3.2 Non-Goals (Out of Scope for v1)

- User administration UI.
- Custom report builder.
- Native mobile application (responsive web only).
- Chatbot access for suppliers.
- Automated supplier-link provisioning UI (mechanism is non-UI and under stakeholder review).

### 3.3 Success Metrics

| ID | Metric | Baseline | Target |
|---|---|---|---|
| SM1 | Time to produce a standard leadership insight | 2 to 3 days | Under 30 minutes |
| SM2 | Share of standard analyses backed by an agent recipe | 0% | 100% of the initial finalized recipe set |
| SM3 | Insight traceability | Manual, inconsistent | Every AI answer links to the query and source rows |
| SM4 | Finalized KPIs live in the dashboard | 0 | All KPIs with an agreed definition and source |

Note: SM1 is a proposed target because the client has not set a numeric objective. It should be confirmed by the PM before it becomes a contractual acceptance criterion.

---

## 4. Personas and Key User Journeys

### 4.1 Personas

- **Leadership (internal, SSO).** Wants a fast, high-level read on supplier quality and delivery. Lives mostly in the Summary view. Low tolerance for complexity.
- **Analyst (internal, SSO).** Explores Quality, Delivery, Supplier, and Supplier Comparison views, drills into individual KPI views, saves filter combinations, and uses the chatbot to accelerate analysis.
- **Supplier (external, signed URL).** Temporary, unauthenticated-by-login access to a single limited public view showing only their own data. No chatbot, no saved filters.

### 4.2 Key Journeys

- **J1 (Leadership).** Open SSO session, land on Summary, scan quality and delivery headlines, ask the chatbot "why did on-time delivery drop this quarter," receive a grounded answer with a traceable source.
- **J2 (Analyst).** Apply global filters, drill into a KPI view, compare two suppliers in the Supplier Comparison view, save the filter set, then ask the chatbot to summarize the comparison scoped to the current view.
- **J3 (Supplier).** Open a signed URL, view only their own KPIs in the limited public view, see nothing about other suppliers, session expires after the link TTL.

---

## 5. Scope

### 5.1 In Scope (v1)

- Five primary views: **Summary, Quality, Delivery, Supplier, Supplier Comparison.**
- Per-KPI detail views (approximately 20 KPIs, delivered one by one as each KPI definition and source are finalized).
- SSO authentication (Google Workspace) with backend-issued access token.
- Supplier signed-URL access to a limited public view (own data only, no chatbot).
- Saved filters and user preferences (internal users), persisted in Cloud SQL.
- AI chatbot assistant for internal users, with global and current-view scoping and session persistence.
- Centralized BigQuery layer joining Google Sheets and BigQuery sources.

### 5.2 Out of Scope (v1)

Everything in Section 3.2. Additionally: real-time streaming data, budget-based cost billing views, and any KPI that lacks a finalized definition and confirmed source (explicitly dropped until defined).

### 5.3 Phasing note

KPIs are delivered incrementally. The system ships with the finalized KPI set first, then adds KPIs and per-KPI views as definitions are agreed. A KPI without a clear definition and source is not built.

---

## 6. Assumptions, Constraints, and Dependencies

### 6.1 Assumptions

- **A1.** The 3-month timeline holds only if the client provides data access, infrastructure, finalized KPI definitions, and Figma designs on schedule. Slippage in any of these moves the date.
- **A2.** Fewer than 100 total users, with a realistic peak of about 5 concurrent. This is an analytical system, so query latency is acceptable and does not require aggressive optimization.
- **A3.** Data is not real-time. The system always reads the latest available data; refresh cadence varies by source.
- **A4.** There is no reliable canonical `supplier_id` today, so supplier access uses a generic signed URL rather than a per-supplier identity mapping (see Section 9 and `PRD-backend.md`).
- **A5.** No stated budget cap, but cost and abuse guardrails are still required, especially for the AI agent.

### 6.2 Constraints

- **C1.** Frontend calls the Data API only. The Data API brokers all calls to the AI Agent backend. The frontend never calls the agent directly.
- **C2.** Architecture rules from the spec are hard constraints: services-only API access, no HTTP in components, design-system layering, shared layout in `app/layout.tsx`.
- **C3.** Cloud platform is Google Cloud. Frontend and Data API deploy to Cloud Run. CI/CD via Bitbucket Pipelines with Workload Identity Federation. Secrets in Secret Manager.

### 6.3 Dependencies

| ID | Dependency | Owner | Status |
|---|---|---|---|
| DEP1 | Finalized KPI definitions and sources | Client stakeholders | In progress |
| DEP2 | Centralized BigQuery layer built and populated | Data / Backend | Pending |
| DEP3 | Figma designs (main views done, per-KPI pages pending) | Design | In progress |
| DEP4 | Dev/QA/Prod environment provisioning | DevOps | In progress |
| DEP5 | Supplier-link provisioning mechanism (non-UI) | Stakeholders | Under review |
| DEP6 | Chatbot evaluation Q&A set | Client stakeholders | Pending |

---

## 7. System Architecture Overview

### 7.1 Components

1. **Frontend (Next.js App Router, TypeScript, MUI).** Renders five primary views, per-KPI views, shared layout, filters, and the embedded chat UI. Deployed on Cloud Run.
2. **Data API (FastAPI).** Single entry point for the frontend. Owns SSO handling and access-token issuance, reads the centralized BigQuery layer, serves aggregated KPI data, persists preferences and saved filters in Cloud SQL, generates and validates supplier signed URLs, and proxies chat requests to the AI Agent backend. Deployed on Cloud Run.
3. **AI Agent backend (Google ADK, Gemini).** Answers natural-language questions using text-to-SQL through the BigQuery MCP server, manages conversation sessions, enforces guardrails, and returns traceable results. Deployment target (Cloud Run vs managed Agent option) to be decided.
4. **Centralized BigQuery layer.** Joins Google Sheets (about 60%) and BigQuery (about 40%) sources into one governed query surface consumed by both the Data API and the agent.
5. **Cloud SQL.** Stores user preferences and saved filters.
6. **Supporting GCP services.** Secret Manager, Google Cloud Storage, Artifact Registry, Gemini via Vertex AI / Gemini Enterprise.

### 7.2 Data flow

```
                         SSO (Google Workspace)
                                  |
   Browser (Next.js) ── HTTPS ──> Data API (FastAPI) ──> Centralized BigQuery layer
        |  ^                          |    |                   ^        ^
        |  |                          |    v                   |        |
     Chat UI                          |  Cloud SQL         Google Sheets  BigQuery
        |  |                          |  (prefs/filters)     (sources)   (sources)
        |  |                          |
        |  └── chat responses ────────┤
        |                             v
        └── (never direct) ── AI Agent backend (ADK + Gemini)
                                      |
                                      └── BigQuery MCP (text-to-SQL, traceable)
```

Supplier path: signed URL → Data API validates signature and scope → serves limited public view data only.

### 7.3 Key architecture decisions

- **AD1. Frontend talks only to the Data API; the Data API proxies to the agent.** Rationale: one auth surface, no agent credentials or tokens exposed to the browser, centralized rate limiting and logging, clean CORS. Alternative (frontend calls agent directly) was rejected for security and traceability reasons.
- **AD2. Text-to-SQL via BigQuery MCP.** Rationale: keeps analysis grounded in live data with full query traceability, rather than injecting stale precomputed context. Isolation is enforced server-side, never by trusting the model.
- **AD3. Centralized BigQuery layer as the single query surface.** Rationale: removes per-request Sheets/BQ join logic from application code and gives the agent one governed, auditable place to query.
- **AD4. Google ADK for sessions and orchestration.** Rationale: native session persistence and new-session support, matches the Gemini/Google Cloud stack.

---

## 8. Data Requirements (system level)

Detailed schema and query design live in `PRD-backend.md`. At the system level:

- **DR1.** All application and agent reads go through the centralized BigQuery layer, not directly against raw Sheets or raw BQ tables.
- **DR2.** KPIs are grouped into Quality and Delivery. Approximately 20 KPIs total. Each KPI requires an agreed name, formula, unit, direction (higher or lower is better), target/threshold, and sliceable dimensions before it is built.
- **DR3.** Freshness: always read the latest available data. Refresh cadence is source-dependent and not real-time. The layer must expose a "data as of" timestamp so views and the agent can show currency.
- **DR4.** Supplier scoping: because there is no clean canonical `supplier_id`, the supplier-facing limited view is served from a generic scoped query defined at provisioning time (see Section 9 and backend PRD).
- **DR5.** Data grain and history depth are not yet clear (open question OQ-Data-1). Views must not assume a fixed grain until confirmed.

---

## 9. Security, Privacy, and Compliance (system level)

- **SEC1. SSO.** Internal users authenticate with Google Workspace (Okta planned later). The Data API exchanges the IdP identity for a backend-issued access token with a defined lifespan (see backend PRD for token TTL and refresh).
- **SEC2. Supplier signed URLs.** A signed URL is a bearer capability: whoever holds the link is treated as that supplier. This must be accepted explicitly. The link grants a limited public view, own-data-only, no chatbot, and expires after its TTL. Provisioning is a non-UI mechanism, still under stakeholder review.
- **SEC3. Data isolation.** Suppliers can never see other suppliers' data. Internal analysts can see all suppliers, including side-by-side comparison. Isolation is enforced in the Data API query layer, never in the browser and never by the LLM.
- **SEC4. Secrets and CI/CD.** Secret Manager for all secrets. Bitbucket Pipelines authenticate to GCP via Workload Identity Federation (no long-lived keys).
- **SEC5. Traceability and logging.** Detailed logging for every chatbot interaction, including the generated query and source references, so any AI answer can be audited back to data.
- **SEC6.** No PII beyond internal user identity is assumed. If supplier data contains PII or contractually restricted content, it must be flagged and handled under the isolation rules above (open question OQ-Sec-1).

---

## 10. Non-Functional Requirements (system level)

The client provided no NFR specifications, so the following are proposed defaults to be confirmed.

| ID | Area | Proposed target |
|---|---|---|
| NFR1 | Latency | Not critical (analytical). Dashboard interactive under ~5s; chat first response under ~5s. |
| NFR2 | Concurrency | Support ~5 concurrent users comfortably, up to ~100 registered. |
| NFR3 | Availability | 99.5% during business hours. |
| NFR4 | Observability | Centralized logging and tracing across frontend, Data API, and agent (Cloud Logging / Monitoring). |
| NFR5 | Accessibility | WCAG 2.1 AA minimum across all views and charts. |
| NFR6 | Cost | No hard cap, but query-cost and token guardrails required (see agent PRD). |

---

## 11. Analytics and Telemetry

- **T1.** Log view usage per persona to validate SM1 (time saved).
- **T2.** Log every chatbot query, scope (global vs view), generated SQL reference, latency, and outcome (answered / refused / error).
- **T3.** Log supplier-link resolution events (which link, when, what scope) for audit.
- **T4.** Track saved-filter creation and reuse to measure adoption.

---

## 12. Risks and Mitigations

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | KPI definitions not finalized in time | Blocks views and agent recipes | Ship finalized KPIs first, drop undefined ones, deliver per-KPI views incrementally |
| R2 | Signed URL is a bearer link (forwarding risk) | Supplier data exposure | Short TTL, no chatbot, own-data-only scope, audit logging, accept risk explicitly |
| R3 | Text-to-SQL returns wrong or cross-supplier data | Trust and security failure | Server-enforced scoping, guardrails, golden-question evaluation set, full query traceability |
| R4 | 3-month timeline depends on client inputs | Missed deadline | Explicit dependency tracking (Section 6.3), phased KPI delivery |
| R5 | Centralized BQ layer not ready | Blocks backend and agent | Prioritize the layer as first backend milestone (DEP2) |
| R6 | Team size vs scope (2 full-stack for FE + API + design system) | Overload | MVP cut in Section 15, reusable design system to reduce per-view cost |
| R7 | No canonical supplier_id | Weak supplier scoping | Generic signed-URL scope defined at provisioning; revisit when identity is available |

---

## 13. Milestones and Phased Delivery Plan

Proposed phasing for the 3-month window (conditional on DEP1 to DEP6).

**Phase 0 — Foundations (Weeks 1 to 3)**
Provision environments, build the centralized BigQuery layer, define the Data API contract, set up the design system (tokens, base UI components, shared layout), scaffold the ADK agent with BigQuery MCP.

**Phase 1 — Core dashboard (Weeks 4 to 7)**
Summary, Quality, and Delivery views with finalized KPIs. SSO and access-token flow. Saved filters. Global and per-view filter model.

**Phase 2 — Supplier and comparison (Weeks 6 to 9, overlapping)**
Supplier view and Supplier Comparison view. Supplier limited public view plus signed-URL validation. Per-KPI views for finalized KPIs.

**Phase 3 — AI assistant (Weeks 7 to 11, overlapping)**
Chatbot integration through the Data API proxy, global vs current-view scoping, session persistence and new-session, initial analysis recipes, guardrails, and evaluation against the stakeholder Q&A set.

**Phase 4 — Hardening (Weeks 11 to 12)**
Accessibility pass, observability, security review of isolation and signed URLs, end-to-end tests of critical journeys, Figma validation.

MVP definition (if timeline compresses): Summary, Quality, Delivery views, SSO, saved filters, and read-only internal chatbot. Supplier external access and per-KPI views become fast-follow.

---

## 14. Open Questions

| ID | Question | Owner | Status |
|---|---|---|---|
| OQ-Data-1 | Data grain and history depth | Data / stakeholders | Open |
| OQ-Data-2 | Full finalized KPI catalogue (name, formula, unit, direction, target, dimensions) | Stakeholders | In progress |
| OQ-Sec-1 | Does supplier data contain PII or contractually restricted content | Stakeholders | Open |
| OQ-Sec-2 | Signed-URL TTL and revocation policy | Stakeholders / backend | Open |
| OQ-Prov-1 | Supplier-link provisioning mechanism (non-UI) | Stakeholders | Under review |
| OQ-FE-1 | Final choice between Recharts and shadcn/ui charts per chart type | Frontend | Open |
| OQ-FE-2 | Server-state library (TanStack Query proposed) | Frontend | Open |
| OQ-AI-1 | Agent deployment target (Cloud Run vs managed) | AI / DevOps | Open |
| OQ-AI-2 | Context token bounds for current-view scope | AI | To be tested in dev |
| OQ-Prod-1 | Confirm numeric success target for SM1 | PM | Open |

---

## 15. Glossary

- **KPI** — Key Performance Indicator, grouped here into Quality and Delivery.
- **Recipe** — A predefined, repeatable analysis procedure the agent follows to generate a specific insight.
- **Centralized BigQuery layer** — The single governed query surface joining Google Sheets and BigQuery sources.
- **Signed URL** — A time-limited, signed link granting a supplier scoped, login-free access to their own limited view. Treated as a bearer capability.
- **Current-view scope** — Chat mode where the agent receives the active filters plus the current view's dataset or summary as context.
- **Global scope** — Chat mode where the agent may query across all in-scope data.
- **MCP** — Model Context Protocol. The BigQuery MCP server exposes governed query access to the agent for text-to-SQL.
- **ADK** — Google Agent Development Kit, used for agent orchestration and session management.
- **RSC** — React Server Components (Next.js App Router).
