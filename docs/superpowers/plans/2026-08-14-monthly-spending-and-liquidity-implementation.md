# Monthly Spending and Liquidity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a no-double-count monthly spending summary by payment source, separate debt/goal totals, and clear current-versus-forecast liquidity figures with activity drill-through.

**Architecture:** Extend the tested financial core with one pure `monthlyMoneySummary(state, month)` function. Render its output in a new Overview section and use a transient activity-drill filter to open the existing Log without changing stored state. No migration is required.

**Tech Stack:** Dependency-free HTML/CSS/JavaScript PWA, Node built-in test runner, localStorage.

## Global Constraints

- Preserve `localStorage["khaldoun_finance_v3"]`, `modelVersion: 9`, all existing entries, and all finance formulas outside this feature.
- Credit-card purchases count as spending; later card payments count only as debt payments and liquidity outflow, never spending again.
- Refunds subtract from their recorded return source.
- No CDN, package, network request, backend, analytics or external dependency.
- Keep production in the existing self-contained `index.html`.
- Bump the service-worker cache and update documentation for release `finance-v10.2`.

---

### Task 1: Pure monthly money summary

**Files:**
- Modify: `tests/finance-core.test.mjs`
- Modify: `index.html` financial core block

**Interfaces:**
- Produces: `monthlyMoneySummary(state, month) -> {spent, bySource, debtPayments, movedToGoals, cashLeftNow}`
- `bySource` is a plain object keyed by normalized payment-source ID; missing or `cash` becomes `cash`, known `debit`/`cashJOD`/`otherPay` stay distinct, configured card IDs stay distinct, and unknown values become `otherPay`.

- [ ] Add a table-driven test with hand-derived totals covering cash, debit, two credit cards, Other, source-specific refunds, card/loan payments, goals and income.
- [ ] Run `node --test tests\finance-core.test.mjs` and verify RED because `monthlyMoneySummary` is absent.
- [ ] Add the minimal pure implementation and export it through the test harness.
- [ ] Re-run the focused test and verify GREEN.

### Task 2: Overview liquidity and source summary

**Files:**
- Modify: `tests/design.test.mjs`
- Modify: `index.html` Overview markup, styles and `renderOverview`

**Interfaces:**
- Consumes: `monthlyMoneySummary(state, currentMonth)`.
- Produces: DOM IDs `dCashNow`, `dCashAfter`, `dSpendTotal`, `dSpendSources`, `dDebtPayments`, `dGoalMoves`.

- [ ] Add a design behavior contract asserting both liquidity labels and the new source-summary surface exist and the old “Cash after commitments” copy is absent.
- [ ] Run `node --test tests\design.test.mjs` and verify RED on the missing surface.
- [ ] Replace the existing cash block with **Cash left now** and **After upcoming commitments** values, then add **Spent this month**, source rows, **Debt payments**, and **Moved to goals** after liquidity and before Budget Health.
- [ ] Render only active source rows, retain negative refund-heavy sources, and show a plain empty state when there is no spending activity.
- [ ] Re-run design and finance tests and verify GREEN.

### Task 3: Month-and-source activity drill-through

**Files:**
- Modify: `tests/design.test.mjs`
- Modify: `index.html` Log filter markup and controller

**Interfaces:**
- Produces: `openActivityDrill(type, source)` and `clearActivityDrill()`.
- Uses transient `activityDrill={month,type,source}`; it is never persisted.

- [ ] Add a design contract for source, payment and goal drill-through handlers plus a visible clearable selected-month filter.
- [ ] Run the focused design test and verify RED.
- [ ] Add a drill-filter banner, wire Overview rows to `openActivityDrill`, and filter real entries by selected month, exact source and optional type.
- [ ] Keep the existing search/type/account filters working when no drill filter is active; clearing restores the normal all-history view.
- [ ] Run design, finance and import tests and verify GREEN.

### Task 4: Release and verification

**Files:**
- Modify: `tests/release.test.mjs`
- Modify: `sw.js`
- Modify: `DOCUMENTATION.md` hand-written sections and changelog
- Modify: `COLLAB-LOG.md`

**Interfaces:**
- Produces: offline cache `finance-v10.2`.

- [ ] Change the release test to require `finance-v10.2`; run it and verify RED against v10.1.
- [ ] Bump `sw.js`, document the new meanings and add the v10.2 changelog row.
- [ ] Regenerate documentation with `node docs\generate-docs.mjs`.
- [ ] Run all four test files and require zero failures.
- [ ] Run `git diff --check` and inspect the full scoped diff for personal data, external dependencies and unintended formula/model changes.
- [ ] Verify the phone-width Overview and source drill-through in light and dark themes when browser tooling is available.
- [ ] Record the release in `COLLAB-LOG.md`, commit intentionally, and push `main` only under the owner’s explicit authorization already given in this request.
