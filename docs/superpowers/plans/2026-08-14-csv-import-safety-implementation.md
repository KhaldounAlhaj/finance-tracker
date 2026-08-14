# CSV Import Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace unsafe CSV account matching with explicit in-app classification, batch review, complete validation, and reversible import.

**Architecture:** Keep the dependency-free single-file PWA. Add pure import classification and validation helpers inside `IMPORT_V9`, render account/category selects from live state, and retain `importId` as the batch boundary for undo. No persisted model migration is required.

**Tech Stack:** HTML, CSS, vanilla JavaScript, localStorage, Node built-in test runner.

## Global Constraints

- Preserve localStorage key `khaldoun_finance_v3` and `modelVersion: 9`.
- Planned reminders never auto-create entries.
- CSV parsing and saving remain entirely on-device.
- No CDN, external font, icon library, framework, or runtime dependency.
- CSV account values are hints only and never become persisted account identifiers without user confirmation.

---

### Task 1: Pure classification and validation contract

**Files:**
- Modify: `tests/import.test.mjs`
- Modify: `index.html` (`IMPORT_V9` block)

**Interfaces:**
- Produces: `importRequirements(row)`, `validateImportDraft(row, context)`, and optional-source fingerprint behavior.

- [ ] Add failing tests proving account hints do not satisfy confirmation, each entry type has the correct required selections, unknown IDs fail, goal is accepted, and source references are optional.
- [ ] Run `node --test tests/import.test.mjs` and verify failures are caused by missing helpers/behavior.
- [ ] Implement the smallest pure helpers and normalize `goal` rows.
- [ ] Run the import tests and verify they pass.

### Task 2: Safe preview controls and bulk assignment

**Files:**
- Modify: `tests/release.test.mjs`
- Modify: `index.html` (CSV overlay and preview functions)

**Interfaces:**
- Consumes: `validateImportDraft(row, context)`.
- Produces: `setCsvAssignment(index, field, value)` and `applyCsvBulk(field, value)`.

- [ ] Add failing static/behavior tests for live category selects, Paid with selects, Account paid selects, goal controls, and no editable account text field.
- [ ] Run the targeted tests and verify expected failures.
- [ ] Render type-specific native selects, source hints, review status, and bulk assignment controls.
- [ ] Revalidate after every type/category/account/edit change and rerun duplicate marking.
- [ ] Run targeted and full tests.

### Task 3: Atomic confirmation, summary, and undo

**Files:**
- Modify: `tests/import.test.mjs`
- Modify: `tests/release.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Produces: `buildImportEntries(rows, context, importId)`, `importSummary(rows)`, and `undoImport(importId)`.

- [ ] Add failing tests proving unresolved rows cannot build entries, raw hints never persist, all built entries share an import ID, and undo targets only that batch.
- [ ] Run tests and verify expected failures.
- [ ] Build entries only from confirmed IDs, save as one batch, show complete counts, and expose Undo last import.
- [ ] Verify cancellation and validation failure perform no writes.
- [ ] Run targeted and full tests.

### Task 4: Template, documentation, cache, and release verification

**Files:**
- Modify: `README.md`
- Modify: `DOCUMENTATION.md`
- Modify: `docs/generate-docs.mjs` if generated wording requires it
- Modify: `sw.js`
- Create: `examples/finance-import-template.csv`
- Modify: `tests/release.test.mjs`

**Interfaces:**
- Documents the exact CSV contract and user workflow.

- [ ] Add a release test requiring the template in the service-worker asset list and a cache newer than `finance-v9`.
- [ ] Run the test and verify expected failure.
- [ ] Add the neutral template, document hints versus confirmations and undo, regenerate docs, and bump the cache.
- [ ] Run `node docs/generate-docs.mjs`, `node --test tests/*.test.mjs`, JavaScript syntax/duplicate-ID checks, `git diff --check`, and the remote-dependency scan.
- [ ] Review the complete diff before committing.

