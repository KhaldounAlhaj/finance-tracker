# Closed Accounts — Implementation Plan

Date: 2026-08-28
Spec: `docs/superpowers/specs/2026-08-28-closed-accounts-design.md`

Test-first. Each task writes failing tests, then the code that passes them.

## Task 1 — core helpers (testable)

Add to the `CORE_V9` block (`index.html:860–1000`), so the rules are exercised
in the VM rather than asserted by regex:

- `debtIsClosed(d)` → `!!(d&&d.closed)`
- `coreDebtBalance(state,d)` → the body currently inside `debtCurrent`, taking
  the debt object and state explicitly
- `activeDebts(state)` → `(state.debts||[]).filter(d=>!debtIsClosed(d))`
- `canCloseDebt(state,d)` → `{ok,balance,reason}`; `ok` only when
  `Math.abs(balance)<0.005`

Then refactor `debtCurrent(d)` (`index.html:1364`) to delegate to
`coreDebtBalance(state,d)` — one balance formula, not two.

Tests (`tests/finance-core.test.mjs`): balance parity with the old formula,
the zero-balance gate, and that `activeDebts` drops only closed rows.

## Task 2 — persistence

`normDebt` (`index.html:1272`): add `closed:!!d.closed`.

Tests: a v3-era fixture loads with `closed:false` on every account; an already-
closed account round-trips through save/load; no `modelVersion` change.

## Task 3 — exclusions

Route these through `activeDebts(state)`:

| Site | Line |
|---|---|
| `totalDebt` | 1373 |
| `totalOriginal` | 1374 |
| `recPaymentFor` | 1458 |
| Overview debt note / projections | 1589–1591 |
| Debt payoff list (`gDebts`) | 1761 |
| `ePay` "Pay towards" | 1861 |
| `ePayWith` cards | 1866 |
| `rAcct` planned-payment picker | 2067 |
| `Cards & loans` Manage row | 2138 |

And in `IMPORT_V9`: `importChoiceOptions` (`index.html:1085`) filters closed from
both `paidWith` cards and `debts`. `validateImportDraft` is **unchanged**.

Tests: a closed account appears in none of the core/import option sets; source
regex contracts for the render sites that are not VM-reachable.

## Task 4 — preservation

No code change expected — this task exists to prove the spec's "keeps" list.

Tests: with one closed card and one active card, assert
`monthlyMoneySummary`/`monthMetrics` still attribute the closed card's past
purchases to it, its past payments still classify as `payment` (never
`spending`), and `debtMovement` over it is unchanged.

## Task 5 — UI

- `closeDebt(id)` / `reopenDebt(id)` beside `delDebt`; `closeDebt` enforces
  `canCloseDebt`, pauses linked reminders, saves and re-renders.
- `renderDebtEditor` (`index.html:2277`): active rows gain **Close**; a
  collapsed **Closed accounts** `<details>` follows with Reopen/Delete rows.
- `delDebt`'s confirm text states that past purchases lose the account name.

Tests (`tests/design.test.mjs`): the editor exposes Close and Reopen, and the
closed group is a `<details>`; every control meets the 44px floor.

## Task 6 — release

1. Bump `CACHE` to `finance-v10.8` in `sw.js`
2. Changelog row in DOCUMENTATION.md §8
3. Extend `docs/generate-docs.mjs` so §4's debt table documents `closed`
4. Regenerate §4 via the generator (never hand-edit)
5. Full suite green, `git diff --check` clean
6. Append a `COLLAB-LOG.md` history entry
