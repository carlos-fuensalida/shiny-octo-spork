# PRD-ai-agent.md — SPMS AI Agent Backend

Component Requirements Document

---

## 1. Document Control

| Field | Value |
|---|---|
| Component | AI Agent Backend (Chat assistant) |
| Tech | Google Agent Development Kit (ADK), Gemini, BigQuery MCP |
| Version | 0.1 (Draft) |
| Status | Draft for stakeholder review |
| Owner | AI Engineer |
| Parent | `PRD.md` |
| Peers | `PRD-backend.md`, `PRD-frontend.md` |

Requirement IDs in this document are namespaced `AI-###`.

---

## 2. Purpose

Answer internal users' natural-language questions about supplier KPIs and generate insights by following predefined analysis recipes. Every answer must be grounded in live data via text-to-SQL and fully traceable back to the query and source. The agent replaces a 2-to-3-day manual analysis cycle.

Suppliers do not have access to this agent under any circumstances.

---

## 3. Architecture and Constraints

- **AI-C1. Invocation path.** The agent is called only by the Data API (never by the frontend directly). It authenticates the caller as the Data API service account.
- **AI-C2. Data access.** The agent answers using text-to-SQL through the BigQuery MCP server, querying the centralized BigQuery layer only. It does not read raw Sheets or raw BQ tables directly.
- **AI-C3. Framework.** Built on Google ADK, using Gemini models. Deployment target (Cloud Run vs a Google-managed agent option) is undecided (OQ-AI-1).
- **AI-C4. Sessions.** Conversation persistence and new-session support use ADK session management.
- **AI-C5. Traceability.** Every answer carries a reference to the generated SQL and the data it used, logged for audit (system SEC5).
- **AI-C6. Isolation.** The agent is internal-only. It must never be reachable through a supplier session (enforced upstream at the Data API, BE-FR-050).

---

## 4. Functional Requirements

### 4.1 Query answering

- **AI-FR-001. Natural-language to insight.** Accept a user question plus scope and return a grounded answer.
  - *Given* an in-scope question, *when* the agent processes it, *then* it generates SQL via BigQuery MCP, executes it against the centralized layer, and returns an answer with a traceable query reference.
  - *Error state:* If the query fails or returns nothing, return a clear "no data / cannot answer" message, not a fabricated answer.
- **AI-FR-002. Grounding.** Answers must be derived only from query results. The agent does not invent numbers or fill gaps from model priors.
- **AI-FR-003. Text-to-SQL via MCP.** All data access is through the BigQuery MCP server, which provides governed, traceable query execution.

### 4.2 Scope handling

- **AI-FR-010. Global scope.** When scope is `global`, the agent may query across all in-scope data in the centralized layer.
- **AI-FR-011. Current-view scope.** When scope is `current_view`, the agent receives the active filters plus the current view's dataset/summary as context and constrains its analysis accordingly.
  - Context token bounds are not fixed; they will be measured and tuned during development (OQ-AI-2). The agent must degrade gracefully (summarize or truncate context) if it approaches model limits.

### 4.3 Analysis recipes

- **AI-FR-020. Recipe library.** Maintain a library of predefined analysis recipes. Each recipe is a repeatable procedure the agent follows to produce a specific insight (the mechanism that replaces manual analysis).
  - *Given* a recognized analysis request, *when* a matching recipe exists, *then* the agent follows that recipe's steps to produce the insight.
- **AI-FR-021. Extensibility.** New recipes can be added over time without changing the agent's core. Start with the finalized recipe set, expand later.
- **AI-FR-022. Recipe traceability.** A recipe-driven answer records which recipe ran and the queries it issued.

### 4.4 Sessions

- **AI-FR-030. Context persistence.** Persist conversation context across the user's views within a session, using ADK sessions, so follow-up questions retain context.
- **AI-FR-031. New session.** Support starting a fresh conversation on user request, clearing prior context.
- **AI-FR-032. Session identity.** Bind sessions to the internal user/session identifier passed by the Data API (BE-FR-051).

### 4.5 Generative UI output

- **AI-FR-040. Structured, renderable output.** Return answers in a structure the frontend's CopilotKit Generative UI can render, including any visualization payloads, alongside the text answer and the traceability reference.

---

## 5. Guardrails and Evaluation

- **AI-FR-050. Scope enforcement.** Answer only questions within the agreed scope. Out-of-scope or off-topic questions receive a defined refusal/redirect, not a best-effort guess.
- **AI-FR-051. Purpose limitation.** Guardrails constrain the agent to its supplier-KPI analysis purpose. It does not act as a general assistant. (No budget cap exists, but these guardrails plus rate limits at the Data API control cost, system NFR6.)
- **AI-FR-052. Safe SQL.** Generated SQL is read-only. No writes, DDL, or DML. Queries run against the governed centralized layer only, and the MCP layer restricts what can be executed.
- **AI-FR-053. No cross-scope leakage.** The agent must not return data outside the requested scope. Because suppliers never reach the agent, cross-supplier leakage in chat is prevented at the access boundary; within internal use, current-view scope must not silently widen.
- **AI-FR-054. Evaluation set.** Stakeholders provide a set of questions with known correct answers. The agent is evaluated against this golden set.
  - *Acceptance:* The agent meets the agreed pass rate on the golden question set before the chatbot is considered done. Target pass rate to be set with stakeholders (OQ-AI-3).
- **AI-FR-055. Refusal quality.** Refusals are clear and explain that the question is out of scope, rather than failing silently.

---

## 6. Logging and Traceability

- **AI-FR-060. Per-interaction logging.** Log every interaction with: user/session, scope, the generated SQL, the data references used, latency, recipe (if any), and outcome (answered / refused / error).
- **AI-FR-061. Auditability.** Any answer can be reconstructed from logs back to the exact query and source data (system SEC5).

---

## 7. Non-Functional Requirements

| ID | Area | Target |
|---|---|---|
| AI-NFR1 | Latency | Not critical (analytical). First response within a few seconds is acceptable |
| AI-NFR2 | Concurrency | ~5 concurrent chat sessions |
| AI-NFR3 | Cost | No hard cap, but read-only SQL, scoped queries, and Data API rate limits constrain spend |
| AI-NFR4 | Observability | Full tracing of question, SQL, and result; integrated with Cloud Logging/Monitoring |
| AI-NFR5 | Reliability | Graceful failure messages; never fabricate on error |

---

## 8. Testing and Evaluation Strategy

- **AI-T1. Unit tests.** Recipe selection, scope handling, refusal logic, output structuring.
- **AI-T2. SQL-safety tests.** Prove generated SQL is read-only and confined to the centralized layer.
- **AI-T3. Golden-set evaluation.** Automated evaluation against the stakeholder question/answer set (AI-FR-054), tracking pass rate over time.
- **AI-T4. Scope tests.** Verify current-view scope does not widen and that out-of-scope questions are refused.
- **AI-T5. Traceability tests.** Verify every answer produces a reconstructable query/source reference in logs.

---

## 9. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-AI-1 | Deployment target: Cloud Run vs managed Google agent option | Open |
| OQ-AI-2 | Context token bounds for current-view scope | To be tested in dev |
| OQ-AI-3 | Target pass rate on the golden evaluation set | Open (with stakeholders) |
| OQ-AI-4 | Initial finalized recipe set | Depends on finalized KPIs (DEP1) |
| OQ-AI-5 | Gemini model variant and any Gemini Enterprise vs Vertex specifics | Open |
