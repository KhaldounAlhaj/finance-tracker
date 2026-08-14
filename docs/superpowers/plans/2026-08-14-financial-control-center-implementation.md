# Financial Control Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scattered five-tab experience with a safe, migration-backed three-zone financial control center covering reminders, confirmed money movements, debt ledgers, CSV catch-up import, monthly analysis, budgets, and goals.

**Architecture:** Preserve the dependency-free single-file PWA and frozen localStorage key. Extend the state to model version 9, keep calculations in pure helpers, render three zones from the existing DOM, and use dated reminder occurrences and debt adjustments so historical totals remain auditable.

**Tech Stack:** Plain HTML, CSS, JavaScript, localStorage, service worker, Node's built-in test runner and VM APIs; no runtime dependencies, CDN, backend, analytics, or telemetry.

## Global Constraints

- Keep `localStorage["khaldoun_finance_v3"]` unchanged.
- Preserve every existing entry, category, budget, debt, commitment, goal, phase, setting, recurring rule, and skip.
- Never auto-create an actual transaction from a reminder.
- Keep all app processing on-device and available offline.
- Keep production free of remote fonts, icon fonts, third-party scripts, and external stylesheets.
- Keep seed data neutral; never commit personal figures or bank details.
- Show the full diff before commit and push only with the owner's explicit authorization.

---

### Task 1: Model v9, migration, and calculation engine

**Files:** Modify `index.html`; create `tests/finance-core.test.mjs`.

- [ ] Write tests that extract the production script and verify v8→v9 preservation, migration idempotence, expense/refund/payment/income deltas, budget-kind separation, goal-reservation release, skips, reschedules, and debt reconciliation adjustments.
- [ ] Run the tests and confirm failures are caused by missing v9 behavior.
- [ ] Add model v9, deep-copy migration, normalizers, stable IDs, reminder occurrences, goal links, and auditable debt adjustments.
- [ ] Add pure monthly metrics for Available within plan and Cash after commitments.
- [ ] Run the tests and retain compatibility required by existing rendering.

### Task 2: Three-zone navigation and Manage organization

**Files:** Modify `index.html` and `tests/finance-core.test.mjs`.

- [ ] Add failing structural tests for Overview, Log, Manage, and Manage destinations.
- [ ] Replace five tabs with three accessible zones and one editor home per entity.
- [ ] Apply approved warm-neutral light/dark tokens with system fonts and inline/local icons only.
- [ ] Verify iPhone-width layout and keyboard focus.

### Task 3: Confirmed Log and reminder actions

**Files:** Modify `index.html` and `tests/finance-core.test.mjs`.

- [ ] Add failing tests for entry/account combinations, reminder drafts, actual amount differences, future-only edits, skips, and reschedules.
- [ ] Implement variants `2b` and `3a`, editable timestamp, effect preview, and non-blocking budget warning.
- [ ] Make Save the only transaction mutation and add Recent activity filters.

### Task 4: Debt monthly movement ledger

**Files:** Modify `index.html` and `tests/finance-core.test.mjs`.

- [ ] Add failing card, loan, refund, payment, and reconciliation tests across month boundaries.
- [ ] Implement variant `4b` with dated reconciliation adjustments and simplified payoff projection.
- [ ] Exclude SMS balance fields and credit-limit utilization.

### Task 5: Atomic CSV and SMS catch-up intake

**Files:** Modify `index.html`; create `tests/import.test.mjs`.

- [ ] Add failing tests for quoted CSV, Arabic/English content, invalid fields, declined rows, duplicate modes, and atomic import.
- [ ] Implement editable preview, include controls, blocked rows, and commit only after valid confirmation.
- [ ] Reuse canonical normalization for SMS and CSV with transaction timestamps authoritative.

### Task 6: Overview, Budget Health, analysis, and goals

**Files:** Modify `index.html` and tests.

- [ ] Add reconciliation tests proving all views use shared selectors.
- [ ] Implement Overview `1a`, maximum-three overdue items, Budget Health, spending analysis, and compact debt/goal summaries.
- [ ] Keep goal reservations out of expense budgets and release them against confirmed contributions.

### Task 7: Documentation, fixtures, offline QA, and release

**Files:** Modify `docs/generate-docs.mjs`, `DOCUMENTATION.md`, `README.md`, and `sw.js`; create neutral migration fixtures.

- [ ] Test v3, v6, v8, and v8.4 migration fixtures through v9.
- [ ] Update the generator/changelog and regenerate documentation Section 4.
- [ ] Bump service-worker cache to `finance-v9` and verify all assets are local.
- [ ] Run complete tests, syntax checks, personal-data scan, cold-offline QA, and phone-width theme walkthrough.
- [ ] Show the full diff, commit intended files, push `main`, and verify the remote commit.

## Self-review

- All specification sections map to Tasks 1–7; migration and rollback precede UI changes.
- Reminder occurrences, linked targets, budget kinds, debt adjustments, and shared month metrics are introduced before consumers.
- No production dependency, personal-data seed, automatic reminder transaction, or storage-key change is permitted.
