# AGENTS.md — Finance Tracker

Instructions for AI coding agents working in this repo.

> **Start here: read [`COLLAB-LOG.md`](COLLAB-LOG.md) before you execute anything.** Two agents work on this repo — Codex builds and is the only one that commits/pushes; Claude reviews as QA and may edit the working tree without committing. The log carries pending handoffs, open questions, and what each agent changed. Append an entry to it before you hand work back.

## What this is

A private, offline personal-finance tracker, shipped as a **single self-contained `index.html`** with **zero dependencies** — no build step, no bundler, no framework, no CDN, no network calls. It is installed as a PWA (iOS home screen, Safari) and served from GitHub Pages.

All user data lives **only** in the browser's `localStorage` on the device. Nothing is uploaded anywhere. There is no backend.

Live: https://khaldounalhaj.github.io/finance-tracker/

## Files

| File | Role |
|---|---|
| `COLLAB-LOG.md` | Shared change log between Codex and Claude — read it first, append before handing back |
| `index.html` | The entire app — styles, markup, and logic in one file (~2,300 lines) |
| `sw.js` | Service worker, offline cache. Holds `const CACHE = "finance-vN"` |
| `manifest.json` | PWA manifest |
| `icon-512.png` / `icon-192.png` / `icon-180.png` | App icons |
| `DOCUMENTATION.md` | Full app documentation. **Section 4 is generated — never hand-edit it** |
| `docs/generate-docs.mjs` | Regenerates DOCUMENTATION.md §4 from the source |
| `docs/superpowers/specs/` + `plans/` | Per-feature design spec and implementation plan — the requirements baseline a review is checked against |
| `tests/*.test.mjs` + `tests/fixtures/` | Node test suite; fixtures are old-version payloads for migration tests |
| `examples/finance-import-template.csv` | Reference CSV shape for the import feature |
| `.githooks/pre-commit` | Runs the generator and stages the result. Fail-open (skips if Node is missing) |
| `README.md` | End-user setup instructions (deploy to Pages, add to iPhone) |

`core.hooksPath` is set to `.githooks`. `.gitattributes` forces LF on the hook and `*.mjs` so they run on Windows.

## Map of `index.html`

| Lines | Contents |
|---|---|
| 19–300 | `<style>` — v10 tokens, light/dark themes, responsive layout, and all component CSS |
| 301–305 | Inline pre-paint theme bootstrap using `localStorage["finance_theme"]` |
| 306–335 | First-run screen and application shell |
| 336–425 | Overview markup — hero 2a, cash, reminders, Budget Health, spending, debt/goals and activity |
| 426–512 | Log markup — unified entry form, SMS/CSV intake, filters, and recent activity |
| 513–572 | Budget and Goals detail pages (opened through Manage/routing rather than primary navigation) |
| 573–620 | Manage hub, backup controls, and three-item primary navigation (`Overview` / `Log` / `Manage`) |
| 621–713 | Overlays — planned payments, roadmap, salary, house, budgets, categories, debts, overdue list, and CSV review |
| 714–777 | Bottom sheets — skip occurrence, recurring reminder editor, and commitment editor |
| 778–996 | Financial and CSV cores — occurrence repair/resolution, entry deltas, metrics, parsing, validation and import helpers |
| 997–1099 | General helpers, inline icon registry, constants, neutral defaults, and model metadata |
| 1100–1235 | Persistence and migrations — `load`, `migrate`, legacy converters, v8/v9 normalization, `save` |
| 1236–1342 | Derived finance calculations — balances, category actuals, rollover, safe/day, projections and reminder status |
| 1343–1366 | Tab, month, overlay, and header routing |
| 1367–1694 | Main renderers — Overview, planned payments, Budget, Goals, reconciliation, and activity Log |
| 1695–1806 | Unified Log controller — managed selectors, type switching, submit/edit/delete, and confirmed skip |
| 1807–1928 | Recurring-reminder and commitment editors |
| 1929–2170 | Manage editors — settings index, salary, house, budgets, categories, debts, roadmap, backup/restore/reset |
| 2171–2236 | Atomic CSV preview, assignment, import, duplicate handling, and undo |
| 2237–2320 | On-device bank-SMS parsing, intake population, clipboard, and `#b64=` deep-link handling |
| 2321–2359 | Theme application, first-run exit, service-worker registration, and boot |

## Data model

- Storage key: `localStorage["khaldoun_finance_v3"]` (the key name is frozen — do not rename it)
- Current `modelVersion`: **9**
- Migrations run **in place with zero data loss**, chaining v1 → v9. Any change to the shape of the state requires a matching migration step; older installs still carry v3-era data.
- Top-level state: `settings`, `categories`, `budgets`, `debts`, `entries`, `recurring`, `occurrences`, `imports`, `commitments`, `currentMonth`
- Categories carry a `kind` (`committed` / `flexible` / `goal`) plus an optional `rollover` flag — these drive Safe-to-spend-today
- Debts have a `kind` of `card` or `loan`. **Cards are revolving**: a purchase raises the balance, a payment lowers it, and card payments are excluded from spending totals (see `isCardPayment`) so nothing is double-counted
- Debts also carry `closed`. A **closed** account is settled and shut: it leaves `totalDebt()`, the payoff projection and every account picker, but `paymentSourceLabel`, `debtName`, `isCardPayment` and `debtMovement` must keep resolving it or its history loses the account name. `canCloseDebt` allows closing only at a zero balance — never let a closed account hide an outstanding amount. Delete still exists for a mistaken entry
- Recurring items are reminder templates only. They support `everyMonths` of 1 / 3 / 6 / 12 with a first-payment anchor; `until` is optional and empty means forever. Never materialize them automatically.

## Hard rules

1. **No personal data in this repo.** It is public. Seed values stay `0` or neutral. Never commit real amounts, salaries, bank names, account numbers, or family details — the owner's real figures exist only inside the app on his device.
2. **Keep it single-file and dependency-free.** No npm packages in the app, no CDN `<script>`/`<link>`, no build step, no framework. If a feature seems to need a library, write it by hand or raise it first.
3. **Offline-first.** No `fetch` to third parties, no analytics, no telemetry.
4. **Bump the cache on every release** — `const CACHE = "finance-vN"` in `sw.js`. Phones will not pick up a change without it.
5. **Never hand-edit DOCUMENTATION.md §4.** Change `docs/generate-docs.mjs` instead, and keep the generator in sync with the data model.
6. **Migrations are mandatory** for any state-shape change. Test loading old data, including straight from v3.
7. `shift()` is multi-month-safe — payoff projections depend on that. Don't regress it.
8. **Show the full diff before committing. A commit is not a push** — never push without the owner explicitly saying so.

## Testing

Run `node --test tests/*.test.mjs` (in PowerShell the glob isn't expanded — name the files: `node --test tests\finance-core.test.mjs tests\import.test.mjs tests\release.test.mjs tests\design.test.mjs`). The finance-v10 working tree has 66 tests. Then verify by opening `index.html` in a browser (or serving the folder over `http://localhost` if you need the service worker to register):

- Load with existing data in `localStorage["khaldoun_finance_v3"]`, and separately with an old-version payload, to prove the migration path
- Walk Overview, Log, and Manage and check the numbers reconcile against the Log
- Check both light and dark themes — contrast is meant to hold in each
- Check the layout at iPhone width; this is used almost entirely on a phone

## Release checklist

1. Edit `index.html`
2. Bump `CACHE` in `sw.js`
3. Add a changelog entry in DOCUMENTATION.md §8
4. Commit — the pre-commit hook regenerates DOCUMENTATION.md §4 and stages it
5. Push only when the owner says to; GitHub Pages deploys `main` from the repo root
