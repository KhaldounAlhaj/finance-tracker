# Finance Tracker — App Documentation

<!-- VERSION --> app **finance-v6** · docs synced **2026-06-12** <!-- /VERSION -->

> **Living document.** The block between the `AUTO:GENERATED` markers in **§4** is rebuilt
> from the app's source (`index.html`, `sw.js`, `manifest.json`) every time you commit, by
> `docs/generate-docs.mjs` running from the `.githooks/pre-commit` hook. Everything outside
> those markers is written by hand. See **§7 — Keeping this in sync**.

---

## 1. What it is
Finance Tracker is a private, offline **Progressive Web App (PWA)** for tracking monthly
spending, debts, and house-savings against a multi-year payoff plan. It runs entirely in the
browser, stores all data locally in `localStorage`, and has **no backend and no account**.

- **Live:** https://khaldounalhaj.github.io/finance-tracker/
- **Repository:** https://github.com/KhaldounAlhaj/finance-tracker (public)
- **Currency:** SAR · **Users:** single (no multi-user / no auth)
- **Stack:** one self-contained `index.html` (no frameworks) + service worker + manifest + icons

## 2. Modules (UI tabs) — 5 tabs (Phase 1)
| Tab | Purpose |
|---|---|
| **Dashboard** | This month at a glance — Income, Spent, Remaining, House Saved, and Total Debt with % paid. _Placeholder; charts arrive in Phase 2._ |
| **Log** | The single entry point for money out: an **Expense / Card-or-Loan-payment** toggle, the bank-SMS import (expense side), and a recent-entries list with edit + delete. |
| **Budget** | Plan vs Actual per category for the month + a Planned / Actual / Difference summary. _Built out in Phase 2._ |
| **Goals** | House-savings goal progress, the four-phase roadmap, and "Update House Savings". |
| **Settings** | Per-category budgets; salary (current, step-up date + amount, single-month override) and house target; an editable **Cards & Loans** list; Backup / Restore (JSON); Reset. |

A header **month switcher** (‹ ›) scopes the figures to a chosen month. _(The old Overview / Expenses / Debts tabs are folded into Dashboard / Log / Settings.)_

## 3. Features
### 3.1 Core (re-architected in finance-v6)
- **Unified Log** — one form records every "money out": an **expense** (description, amount, date, category)
  or a **card / loan payment** (account, amount, date — the category comes from the account). A payment both
  reduces that account's balance and counts as spending. Recent entries list supports edit + delete.
- **Automatic calculations** — nothing recomputable is stored. A debt's current balance = starting balance −
  its logged payments (editing/deleting a payment re-derives it — no manual "update balance"); month income =
  single-month override → step-up amount (on/after `salaryFrom`) → current salary; month spent = all entries;
  remaining, total debt and % paid all derive live.
- **Per-category budgets** — one planned amount per category (5 fixed: rent, iqama, carLoan, jordanLoan,
  houseSavings; 9 variable), each tracking its own actual.
- **Goals** — house-savings progress vs target + the four-phase roadmap.
- **Cards & Loans** — editable in Settings (name, bank, original, starting balance, rate, kind, linked
  category); paid down from the Log.
- **Backup / Restore** — round-trips the new data shape; **Reset** to defaults. **PWA** — installable, offline.

### 3.2 Bank-SMS import (since finance-v2 — now feeds the Log expense form)
- **Intake (3 ways):** paste into the Log, the **📋 Paste** (clipboard) button, or a `#b64=` deep link from an
  iOS Shortcut. **On-device parser** — amount, merchant, date, category guess; English + Arabic; skips incoming
  money; 100% client-side (the `#b64=` fragment never leaves the device).

### 3.3 Data model — `localStorage["khaldoun_finance_v3"]` (migrated in place, zero loss)
- `settings { salaryCurrent, salaryFrom, salaryFromAmount, houseTarget, houseSaved, salaryOverrides }`
- `budgets { <category>: plannedAmount }` · `debts [ { id, name, bank, startingBalance, original, ratePerMonth, kind, category } ]`
- `entries [ { id, date, amount, category, type:"expense"|"payment", debtId, description } ]`
- The legacy v1–v5 shape (`salaryNow/Next`, `debts[].balance`, `budgets[]`, `expenses[]`) upgrades automatically:
  budget keys remap (car_pmt→carLoan, jloan→jordanLoan, house→houseSavings, jordan→jordanTransfer), debt
  balances become `startingBalance`, and old expenses become `expense` entries.

## 4. Generated reference
_Machine-generated from source on every commit — do not edit by hand._

<!-- AUTO:GENERATED:START — produced by docs/generate-docs.mjs · DO NOT EDIT BY HAND -->
_Synced **2026-06-12** · app version **finance-v6** · storage key `khaldoun_finance_v3`_

### Identity
- **Finance Tracker** — Personal finance, debt and house-savings tracker
- **Display:** standalone · **Theme:** #5458E0
- **Tabs:** dashboard · log · budget · goals · settings
- **Expense categories:** food, transport, family, bills, health, clothing, entertainment, jordanTransfer, other

### Income & goal (seed defaults)
| Field | Value |
|---|---|
| Salary — current | 0 SAR |
| Salary — from 2027-04 | 0 SAR |
| House target | 0 SAR |
| House saved | 0 SAR |

### Cards & loans (seed) — total starting balance **0 SAR**
| Name | Bank | Starting | Original | Rate | Kind | Linked |
|---|---|---|---|---|---|---|
| _(none in seed defaults)_ |  |  |  |  |  |  |

### Monthly budget (seed) — planned **0 SAR** · 14 categories
| Category | Planned | Type |
|---|---|---|
| 🏠 Rent | 0 | fixed |
| 🪪 Iqama | 0 | fixed |
| 🚗 Car Loan | 0 | fixed |
| 📋 Jordan Loan | 0 | fixed |
| 🏡 House Savings | 0 | fixed |
| ⚡ Bills | 0 | variable |
| 🍽️ Food & Dining | 0 | variable |
| 🚗 Transport / Fuel | 0 | variable |
| 👨‍👩‍👧 Family | 0 | variable |
| 💊 Health | 0 | variable |
| 👕 Clothing | 0 | variable |
| 🎬 Entertainment | 0 | variable |
| 🇯🇴 Jordan Transfer | 0 | variable |
| 📦 Other | 0 | variable |

### Entries (seed)
_0 seed entries — your logged expenses & payments live here._

### Phase roadmap
| # | Phase | Window | Goal |
|---|---|---|---|
| 1 | Phase 1 — Clear Jordan Obligations | 2026-06 → 2026-10 | Pay Jordan loan (closes Oct), clear Jordan credit card. Pay minimums on KSA cards. |
| 2 | Phase 2 — Destroy KSA Credit Cards | 2026-11 → 2027-09 | Attack the highest-interest card first, then the next, putting the monthly surplus toward the cards. |
| 3 | Phase 3 — Finish Car Loan | 2027-10 → 2028-01 | Double payments on car loan. Clear remaining balance by January 2028. |
| 4 | Phase 4 — Full Savings Mode | 2028-02 → 2031-12 | Shift to a high savings rate and invest steadily toward the house goal. |

### Source file manifest (SHA-256, first 16 hex)
| File | Bytes | Hash |
|---|---|---|
| `index.html` | 52,748 | `ac03489bd8bc70a4` |
| `sw.js` | 1,409 | `2233bc41bea72c55` |
| `manifest.json` | 480 | `fd67116f234d2295` |
| `README.md` | 1,650 | `b67d621fc21bba5e` |
| `icon-180.png` | 11,837 | `4f4aa4ab23cec3a9` |
| `icon-192.png` | 13,061 | `731c75ee35bbc385` |
| `icon-512.png` | 21,751 | `fa0dd4a4cf91109f` |
| `docs/generate-docs.mjs` | 6,945 | `500ab2491116065d` |
| `.githooks/pre-commit` | 483 | `4ce5d3c8a0750470` |
| `.gitattributes` | 134 | `aa3e3144fa6a086d` |
<!-- AUTO:GENERATED:END -->

## 5. Non-functional characteristics
| Property | State |
|---|---|
| Works offline | ✅ service worker caches the app (network-first for the page) |
| Installable / standalone | ✅ home-screen app, custom icon, adaptive theme |
| Theming & design | ✅ warm token-based light & dark, auto-follows the OS + manual Light / Dark / Auto switch; one category-colour palette; tabular-num figures |
| Privacy | ✅ data never leaves the device; no analytics, no server |
| Backup / Restore | ✅ JSON file (manual) — the only safety net |
| Multi-device sync | ❌ none — data is per-device, per-browser |
| Lock / encryption | ❌ none — anyone with the unlocked device can open it |

**Design system (finance-v5):** all colours, type, radii and shadows come from CSS custom properties on
`:root`, overridden for dark via `prefers-color-scheme` and a manual `data-theme` attribute (Light / Dark /
Auto switch in Settings, default Auto, persisted under `localStorage["finance_theme"]`, separate from the
finance data). One shared category-colour palette feeds the chips and bars; humanist system-font stack only
(no webfonts); tabular-nums for figures; over/under-budget is shown with a sign + icon, not colour alone.

## 6. Known limitations / review notes
1. ~~**Budget category roll-up**~~ — **Resolved in finance-v4.** Every variable category now tracks its
   own Plan-vs-Actual line — Food, Transport, Family, Bills, Health, Clothing, Entertainment, Jordan
   Transfer, Other — and each totals only its own expenses; Food no longer absorbs the rest. New budget
   keys default to 0 for existing data (nothing wiped).
2. **Seed data is neutralized.** The committed defaults are all zero / blank — no personal figures, bank
   names, card names, or roadmap specifics — so your real numbers live only in your device's `localStorage`.
   The public git history was rewritten on 2026-06-12 to remove the earlier personal values. (The storage
   key still contains your first name, kept deliberately so your existing on-device data isn't orphaned.)
3. **SMS parser tuning** — pending a real sample message to lock onto the bank's exact format.
4. **iOS Shortcut storage test** — pending (Safari vs home-screen PWA storage).
5. **Backup is the only safety net** — clearing Safari data wipes everything.
6. **Phases are hardcoded** — salary/budgets/debts are editable in Settings, but the four phase
   dates/goals live in `index.html` (`PHASES`).

## 7. Keeping this in sync (version control)
- **Automatic:** a `pre-commit` hook runs `docs/generate-docs.mjs`, which rewrites the §4 block from
  source and re-stages this file — so the doc and the app are always committed together and cannot drift.
  The app version is read from the service-worker cache tag (`finance-vN` in `sw.js`), which you bump per release.
- **One-time setup after a fresh clone:** `git config core.hooksPath .githooks`
- **Manual refresh anytime (no commit):** `node docs/generate-docs.mjs`
- **Auto vs manual boundary:** §4 (seed figures, structure, file manifest, version stamp) is generated.
  §1–3, 5, 6 and the changelog are written by hand — update them when behavior changes (or ask Claude Code to).

## 8. Changelog
| Version | Date | Changes |
|---|---|---|
| finance-v6 | 2026-06-12 | **Phase 1 re-architecture** — new data model (settings / per-category budgets / debts / entries) with in-place, zero-loss migration; five tabs (Dashboard · Log · Budget · Goals · Settings); a single unified **Log** (expense / card-or-loan-payment toggle) as the only money-out entry point; **automatic calculations** (debt balance from payments, month income with step-up + single-month override, all totals derived); editable Cards & Loans in Settings; SMS import now feeds the Log. Carries the v5 design system. SW cache → finance-v6. |
| finance-v5 | 2026-06-12 | Visual redesign — warm "fresh fintech" light/dark design system (token-based, auto + manual Light/Dark/Auto switch), category-colour chips, humanist typography (no monospace / all-caps), restyled cards/buttons/inputs/tabs/bars, tabular-num figures, over-budget shown with sign + icon (not colour alone). No logic/data changes. SW cache → finance-v5. |
| finance-v4 | 2026-06-12 | Budget fix — each variable category (Food, Transport, Family, Bills, Health, Clothing, Entertainment, Jordan Transfer, Other) now tracks its own Plan-vs-Actual line instead of Food absorbing six of them. New budget keys default to 0 for existing data (no wipe). SW cache → finance-v4. |
| finance-v3 | 2026-06-12 | Privacy: neutralized seed data (zeroed salary/debts/budgets/target, removed bank & card names and header name, genericized the roadmap) and rewrote the public git history to purge the earlier personal values. |
| finance-v2 | 2026-06-12 | Bank-SMS import: paste / clipboard / `#b64=` intake, on-device EN/AR parser, duplicate guard, iOS Shortcut path. Added this documentation system. |
| finance-v1 | 2026-06-12 | Initial release — Overview, Budget, Expenses, Debts, Plan, Settings; PWA + offline + backup/restore. Deployed to GitHub Pages. |
