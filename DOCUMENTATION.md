# Finance Tracker — App Documentation

<!-- VERSION --> app **finance-v5** · docs synced **2026-06-12** <!-- /VERSION -->

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

## 2. Modules (UI tabs)
| Tab | Purpose |
|---|---|
| **Overview** | Current-phase banner with progress; four stats (Monthly Salary, Spent this month, Remaining, House Saved); Total Debt Remaining with % paid. |
| **Budget** | Plan vs Actual per category for the selected month, plus a month summary (Planned total, Actual spent, Difference). |
| **Expenses** | Lists the selected month's expenses; add via the ＋ button, delete per row. |
| **Debts** | Each debt with balance, original, interest rate and % paid; "Update Debt Balance" form. |
| **Plan** | House-savings goal progress and the four-phase roadmap timeline; "Update House Savings" form. |
| **Settings** | Edit planned budget amounts, salary and house target; Backup / Restore (JSON); Reset to defaults. |

A header **month switcher** (‹ ›) scopes Overview / Budget / Expenses to a chosen month.

## 3. Features
### 3.1 Core
- **Expense logging** — add (description, amount, date, category) and delete; duplicate guard.
- **Budget Plan-vs-Actual** — variable categories total your logged spend; fixed lines show plan only.
- **Debt tracking** — per-account balances, interest, progress vs original; manual balance updates.
- **House savings + roadmap** — savings progress vs target and a four-phase debt→savings plan.
- **Backup / Restore** — download/upload a JSON snapshot (the only safety net; see §6).
- **PWA** — installable to the home screen, works offline via a service worker.

### 3.2 Bank-SMS import (added in finance-v2)
- **Intake (3 ways):** paste into the ＋ sheet, the **📋 Paste** (clipboard) button, or a
  `#b64=` deep link opened by an iOS Shortcut.
- **On-device parser** — extracts amount, merchant, date and guesses a category; understands
  English + Arabic bank texts; skips incoming money (deposits/salary/refunds); warns on duplicates.
- **Privacy** — parsing is 100% client-side; the `#b64=` fragment is never sent to the server.
- **iOS Shortcut path** — Message automation → Base64-encode the SMS → open the `#b64=` URL.
  Open item: confirm the deep link writes into the home-screen app's storage (Safari-vs-PWA test).

## 4. Generated reference
_Machine-generated from source on every commit — do not edit by hand._

<!-- AUTO:GENERATED:START — produced by docs/generate-docs.mjs · DO NOT EDIT BY HAND -->
_Synced **2026-06-12** · app version **finance-v5** · storage key `khaldoun_finance_v3`_

### Identity
- **Finance Tracker** — Personal finance, debt and house-savings tracker
- **Display:** standalone · **Theme:** #5458E0
- **Tabs:** overview · budget · expenses · debts · plan · settings
- **Expense categories:** food, transport, family, bills, health, clothing, entertainment, jordan, other

### Income & goal (seed defaults)
| Field | Value |
|---|---|
| Salary — current | 0 SAR |
| Salary — from 2027-04 | 0 SAR |
| House target | 0 SAR |

### Debts (seed) — total **0 SAR**
| Debt | Bank | Balance | Original | Rate |
|---|---|---|---|---|
| Credit Card 1 |  | 0 | 0 | 0% |
| Credit Card 2 |  | 0 | 0 | 0% |
| Credit Card 3 |  | 0 | 0 | 0% |
| Car Loan |  | 0 | 0 | 0% |

### Monthly budget (seed) — planned **0 SAR**
| Category | Planned | Type |
|---|---|---|
| 🏠 Rent | 0 | fixed |
| 🪪 Iqama | 0 | fixed |
| 🍽️ Food & Dining | 0 | variable |
| 🚗 Transport / Fuel | 0 | variable |
| 👨‍👩‍👧 Family | 0 | variable |
| ⚡ Bills | 0 | variable |
| 💊 Health | 0 | variable |
| 👕 Clothing | 0 | variable |
| 🎬 Entertainment | 0 | variable |
| 🇯🇴 Jordan Transfer | 0 | variable |
| 📦 Other | 0 | variable |
| 🚗 Car Loan Pmt | 0 | fixed |
| 📋 Jordan Loan | 0 | fixed |
| 🏡 House Savings | 0 | fixed |

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
| `index.html` | 45,815 | `b8ec47009d6441d7` |
| `sw.js` | 1,409 | `550b35b8800bfb57` |
| `manifest.json` | 480 | `fd67116f234d2295` |
| `README.md` | 1,650 | `b67d621fc21bba5e` |
| `icon-180.png` | 11,837 | `4f4aa4ab23cec3a9` |
| `icon-192.png` | 13,061 | `731c75ee35bbc385` |
| `icon-512.png` | 21,751 | `fa0dd4a4cf91109f` |
| `docs/generate-docs.mjs` | 6,044 | `3623b3efb9e36842` |
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
| finance-v5 | 2026-06-12 | Visual redesign — warm "fresh fintech" light/dark design system (token-based, auto + manual Light/Dark/Auto switch), category-colour chips, humanist typography (no monospace / all-caps), restyled cards/buttons/inputs/tabs/bars, tabular-num figures, over-budget shown with sign + icon (not colour alone). No logic/data changes. SW cache → finance-v5. |
| finance-v4 | 2026-06-12 | Budget fix — each variable category (Food, Transport, Family, Bills, Health, Clothing, Entertainment, Jordan Transfer, Other) now tracks its own Plan-vs-Actual line instead of Food absorbing six of them. New budget keys default to 0 for existing data (no wipe). SW cache → finance-v4. |
| finance-v3 | 2026-06-12 | Privacy: neutralized seed data (zeroed salary/debts/budgets/target, removed bank & card names and header name, genericized the roadmap) and rewrote the public git history to purge the earlier personal values. |
| finance-v2 | 2026-06-12 | Bank-SMS import: paste / clipboard / `#b64=` intake, on-device EN/AR parser, duplicate guard, iOS Shortcut path. Added this documentation system. |
| finance-v1 | 2026-06-12 | Initial release — Overview, Budget, Expenses, Debts, Plan, Settings; PWA + offline + backup/restore. Deployed to GitHub Pages. |
