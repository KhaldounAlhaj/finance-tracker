# AGENTS.md — Finance Tracker

Instructions for AI coding agents working in this repo.

## What this is

A private, offline personal-finance tracker, shipped as a **single self-contained `index.html`** with **zero dependencies** — no build step, no bundler, no framework, no CDN, no network calls. It is installed as a PWA (iOS home screen, Safari) and served from GitHub Pages.

All user data lives **only** in the browser's `localStorage` on the device. Nothing is uploaded anywhere. There is no backend.

Live: https://khaldounalhaj.github.io/finance-tracker/

## Files

| File | Role |
|---|---|
| `index.html` | The entire app — styles, markup, and logic in one file (~1,764 lines) |
| `sw.js` | Service worker, offline cache. Holds `const CACHE = "finance-vN"` |
| `manifest.json` | PWA manifest |
| `icon-512.png` / `icon-192.png` / `icon-180.png` | App icons |
| `DOCUMENTATION.md` | Full app documentation. **Section 4 is generated — never hand-edit it** |
| `docs/generate-docs.mjs` | Regenerates DOCUMENTATION.md §4 from the source |
| `.githooks/pre-commit` | Runs the generator and stages the result. Fail-open (skips if Node is missing) |
| `README.md` | End-user setup instructions (deploy to Pages, add to iPhone) |

`core.hooksPath` is set to `.githooks`. `.gitattributes` forces LF on the hook and `*.mjs` so they run on Windows.

## Map of `index.html`

| Lines | Contents |
|---|---|
| 19–214 | `<style>` — design tokens, light/dark themes, all component CSS |
| 215 | Inline theme bootstrap (reads `localStorage["finance_theme"]` before paint, to avoid a flash) |
| 220–630 | Markup — First-run screen, then the 5 tabs (Dashboard, Log, Budget, Goals, Settings), then overlays and bottom sheets |
| 632– | `<script>` — the whole application |
| 644–710 | Date/DOM/format helpers (`shift`, `monthsBetween`, `esc`, `el`, …) and constants (`KEY`, `MS`, `INCOME_META`, default state) |
| 712–816 | Persistence + migrations: `load`, `migrate`, `fromLegacy`, `from6`, `from7`, `normalize8`, and the `norm*` normalizers |
| 820–940 | Derived calculations — `debtCurrent`, `monthSpent`, `catActual`, `committedEq`, `rolloverCarry`, `effectivePlanned`, `safePerDay`, `houseStatus`, `projectDebt`, `commitStatus`, `recStatus` |
| 911–970 | `materializeRecurring`, tab/overlay routing (`setTab`, `chMonth`, `openOverlay`) |
| 971–1190 | Renderers — `render`, `renderDashboard`, `renderBudget`, `renderGoals`, `renderEntries` |
| 1193–1320 | The Log form — `fillLogSelects`, `setLogType`, `submitEntry`, `editEntry`, `delEntry`, skip-sheet |
| 1320–1440 | Recurring and commitment sheets |
| 1442–1620 | Settings editors — salary, house, budgets, categories, debts, phases |
| –1762 | Backup/restore, bank-SMS import, service-worker registration, boot |

## Data model

- Storage key: `localStorage["khaldoun_finance_v3"]` (the key name is frozen — do not rename it)
- Current `modelVersion`: **9**
- Migrations run **in place with zero data loss**, chaining v1 → v9. Any change to the shape of the state requires a matching migration step; older installs still carry v3-era data.
- Top-level state: `settings`, `categories`, `budgets`, `debts`, `entries`, `recurring`, `occurrences`, `imports`, `commitments`, `currentMonth`
- Categories carry a `kind` (`committed` / `flexible` / `goal`) plus an optional `rollover` flag — these drive Safe-to-spend-today
- Debts have a `kind` of `card` or `loan`. **Cards are revolving**: a purchase raises the balance, a payment lowers it, and card payments are excluded from spending totals (see `isCardPayment`) so nothing is double-counted
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

Run `node --test tests/*.test.mjs`, then verify by opening `index.html` in a browser (or serving the folder over `http://localhost` if you need the service worker to register):

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
