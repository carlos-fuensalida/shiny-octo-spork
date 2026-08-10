## 📋 Summary
<!-- One or two sentences describing WHAT this PR does and WHY. -->
_Short description of the change..._

## 🔗 Linked Spec
<!-- Every PR must trace back to a spec. No spec = no merge. -->
- **Spec doc:** `docs/specs/SPEC-XXX-feature-name.md`
- **Spec version / section:** _e.g. v1.2 · §3 – Validation rules_
- **Jira / ticket:** _PRJ-000_

## 📁 Documentation Changes
<!-- Check every box that applies. Leave unchecked if N/A (add a note). -->

### Spec & requirements
- [ ] Spec updated to reflect final implementation *
- [ ] Acceptance criteria added / revised
- [ ] Edge cases and error states documented

### API & technical docs
- [ ] OpenAPI / Swagger spec updated  (`docs/api/`)
- [ ] Data model / schema changes documented  (`docs/models/`)
- [ ] Environment variables or config changes noted  (`docs/config.md`)

### How-tos & guides
- [ ] New how-to added or existing guide updated  (`docs/how-tos/`)
- [ ] Integration guide updated (if external-facing)
- [ ] Migration guide added (if breaking change)

### Project files
- [ ] `README.md` updated (setup, usage, or architecture changes)
- [ ] `CHANGELOG.md` entry added
- [ ] `AGENTS.md` / `CLAUDE.md` context refreshed (if AI agent config affected)

## 🧪 Test coverage
- [ ] Unit tests added / updated
- [ ] Integration tests added / updated
- [ ] Spec scenarios covered by tests (reference spec section)

## 💥 Breaking changes
<!-- If none, write "None". Otherwise describe the impact and migration path. -->
_None_

## 🖼️ Screenshots / recordings
<!-- UI changes: before/after. API changes: sample request+response. Optional for pure refactors. -->
_N/A_

## 🗒️ Reviewer notes
<!-- Anything the reviewer should know: design decisions, trade-offs, areas of uncertainty. -->
_e.g. Chose approach X over Y because Z. Feedback welcome on §validation logic._

## ✅ Author checklist
- [ ] PR title follows convention: `type(scope): short description`
- [ ] Spec doc path listed above is correct and the file is updated
- [ ] All `docs/` files impacted by this change are updated
- [ ] No TODOs left in code without a linked ticket
- [ ] Self-review done (read the diff as a reviewer would)