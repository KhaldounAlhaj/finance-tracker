# Finance Tracker — App Documentation

<!-- VERSION --> app **finance-v8.2** · docs synced **2026-07-18** <!-- /VERSION -->

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

## 2. Modules — 5 tabs on a bottom bar (v8)
| Tab | Purpose |
|---|---|
| **Dashboard** | The daily glance, always anchored to the real current month — **Safe to spend today** hero, Spent / Left tiles, a Committed · Flexible · Set-aside strip, house fund with verdict badge, total debt with a payoff note, and **Upcoming this week** (auto-posts, with ends-soon hints). Browsing back shows a calm closed-month summary. |
| **Log** | One page for all money — **Expense / Card·loan / Income** toggle, the bank-SMS box (paste → auto-fill), a **"Paid with"** choice (SAR/JOD cash · debit · any of your credit cards — a card purchase raises that card's balance), a **"Repeats" switch (monthly · every 3 or 6 months · yearly) with an optional "until"** — forever by default — that creates the auto-posting rule inline (add the gym once; it ends itself), and recent entries with edit / delete / **Skip** (for auto-posts) / **↻ make recurring**. |
| **Budget** | Grouped envelopes (Home · Family · Jordan · Living · Obligations) with kind badges (AUTO / GOAL), **↻ rollover** carry, a **today pacing line** on every bar, over-by warnings in words, and a header with Planned / Actual / Difference + Committed / Flexible / **Safe-per-day**. |
| **Goals** | Where you stand **today**: house fund with needed-vs-pace and an on-track / short-by verdict, **Commitments** (school fees, trips, insurance — funded %, monthly set-aside, on-pace badges), **Debt payoff** (per-account projected close date + interest ahead), and the **editable roadmap**. |
| **Settings** | Theme (Light / Dark / Auto); overlays for **Salary & house goal** (payday, target month, saved-start), **Recurring items** (pause / end dates / **renew**), **Budgets**, **Categories** (rename / icon / group / kind / rollover / archive), **Cards & loans**; backup with an **age nudge**, restore, reset. |

A bottom tab bar (thumb reach on large phones) replaces the old top tabs; a first-run screen welcomes a fresh install and offers backup restore.

## 3. Features
### 3.1 Core (v6 re-architecture → v7 configurability → v8 planner + design)
- **Safe to spend today** — income − committed bills − goal set-asides, spread over the days left in the
  month; the Dashboard hero and the per-day figure on Budget. "Committed" is the **monthly equivalent** of
  the recurring items themselves (amount ÷ interval) — an annual rent or yearly iqama weighs 1/12 on every
  month's number instead of shocking a single month.
- **Category kinds** — every category is **committed** (posts itself), **flexible** (day-to-day choices) or
  **goal** (money being set aside); the split powers the safe-to-spend math. **Rollover** categories carry
  unspent budget into the next month.
- **Unified Log** — expense / card-loan payment / income in one form; the **"Repeats"** switch (monthly /
  every 3 or 6 months / yearly, optional "until" — forever by default) creates the auto-posting rule inline.
- **Paid with & revolving cards** — every expense records how it was paid: SAR cash/bank, JOD cash, debit,
  or one of your **credit cards**. A card purchase raises that card's balance; paying a card lowers it and is
  treated as a balance transfer, **not** new spending (the spend was the purchase — no double counting).
  Loan payments remain spending. Debt setup is minimal — name + amount owed + card/loan; bank, original,
  rate and budget link are optional "More details".
- **Recurring lifecycle** — each item posts on its day **at its own cadence** — monthly, quarterly,
  semi-annual or yearly, anchored to a first-payment month (iqama every March stays every March). Salary
  posts on payday; items pause/resume, may carry an end month, show **ENDED** with one-tap **Renew**, and
  single months are skippable via a gentle sheet. Idempotent — never double-posts, never fires off-cadence.
- **Commitments** — known future costs (school fees, trip home, insurance): target + due month → required
  monthly set-aside, funded % (entries in the linked category count automatically), on-pace verdicts.
- **Debt payoff projections** — from each account's linked recurring installment: projected close date and
  interest ahead (monthly-rate amortization); the Dashboard states the projected debt-free date.
- **House goal** — target + target month; saved = starting amount + everything logged to House savings;
  needed-per-month vs your recent pace → an honest **on-track / short-by** verdict.
- **Editable everything** — categories, budgets, roadmap phases, accounts, recurring, commitments: all data
  in the app, never code.
- **Backup / Restore** — round-trips the full v8 shape; a **backup-age nudge** appears after 30 days; the
  first-run screen offers restore. **Reset** to defaults. **PWA** — installable, offline.

### 3.2 Bank-SMS import (since finance-v2 — now feeds the Log expense form)
- **Intake (3 ways):** paste into the Log, the **📋 Paste** (clipboard) button, or a `#b64=` deep link from an
  iOS Shortcut. **On-device parser** — amount, merchant, date, category guess; English + Arabic; skips incoming
  money; 100% client-side (the `#b64=` fragment never leaves the device).

### 3.3 Data model — `localStorage["khaldoun_finance_v3"]` (modelVersion 8; migrated in place, zero loss)
- `settings { salaryCurrent, salaryFrom, salaryFromAmount, payday, houseTarget, houseTargetMonth,
  houseSavedStart, houseAccrueFrom, lastBackupAt, salaryOverrides }`
- `categories [ { id, name, icon, group, kind:"committed"|"flexible"|"goal", rollover, archived } ]`
  · `budgets { <categoryId>: plannedAmount }`
- `commitments [ { id, name, target, dueMonth, categoryId, fundedStart, createdFrom } ]`
- `debts [ { id, name, bank, startingBalance, original, ratePerMonth, kind, category } ]`
- `recurring [ { id, name, amount, type, categoryId, debtId, dayOfMonth, everyMonths, startMonth, endMonth, active, isSalary } ]`
  — `everyMonths` (1 / 3 / 6 / 12) sets the cadence; `startMonth` anchors which months it fires
  · `skips [ "recurringId:YYYY-MM" ]`
- `entries [ { id, date, amount, category, type:"expense"|"payment"|"income", debtId, paidWith, description, recurringId } ]`
  — `paidWith`: null (SAR cash/bank) · "cashJOD" · "debit" · "otherPay" · a card's debt id (raises its balance)
- `phases [ { name, title, start, end, goal } ]` — the editable roadmap
- **House saved is derived**: `houseSavedStart` + every entry logged to the House savings category since
  `houseAccrueFrom` (v7's manual `houseSaved` migrates into `houseSavedStart`; nothing recomputable is stored).
- Every older shape upgrades in place: v7 gains kinds, rollover flags and `commitments`; v6 and legacy v1–v5
  chain through the earlier migrations first. Income sources (salary/bonus/gift/other) live on income entries'
  `category` field, separate from spending categories.

## 4. Generated reference
_Machine-generated from source on every commit — do not edit by hand._

<!-- AUTO:GENERATED:START — produced by docs/generate-docs.mjs · DO NOT EDIT BY HAND -->
_Synced **2026-07-18** · app version **finance-v8.2** · storage key `khaldoun_finance_v3`_

### Identity
- **Finance Tracker** — Personal finance, debt and house-savings tracker
- **Display:** standalone · **Theme:** #1f7a63
- **Tabs:** dashboard · log · budget · goals · settings
- **Categories:** 20 seed, fully editable in-app (rename / icon / group / kind / rollover / archive / add)

### Income & goal (seed defaults)
| Field | Value |
|---|---|
| Salary — current | 0 SAR |
| Salary — from 2027-04 | 0 SAR |
| Payday (day of month) | 1 |
| House target | 0 SAR by 2029-12 |
| House saved before tracking | 0 SAR (entries to House savings add on top) |

### Cards & loans (seed) — total starting balance **0 SAR**
| Name | Bank | Starting | Original | Rate | Kind | Linked |
|---|---|---|---|---|---|---|
| _(none in seed defaults)_ |  |  |  |  |  |  |

### Categories & budgets (seed) — planned **0 SAR** · 20 categories
| Category | Planned | Group | Kind |
|---|---|---|---|
| 🏠 Rent | 0 | Home | committed |
| ⚡ Bills & utilities | 0 | Home | committed |
| 🛒 Groceries & household | 0 | Home | flexible |
| 💑 Wife & personal | 0 | Family | flexible |
| 👶 Baby girl | 0 | Family | flexible ↻ |
| 🎓 School fund | 0 | Family | goal ↻ |
| 💊 Health | 0 | Family | flexible |
| 🏘️ Parents' rent support | 0 | Jordan | committed |
| 🇯🇴 Family support & gifts | 0 | Jordan | flexible |
| ✈️ Travel | 0 | Jordan | goal ↻ |
| 🚗 Transport / fuel | 0 | Living | flexible |
| 🍽️ Dining & entertainment | 0 | Living | flexible |
| 👕 Clothing | 0 | Living | flexible |
| 🎁 Gifts & occasions | 0 | Living | flexible |
| 🤲 Charity | 0 | Living | flexible |
| 📦 Other | 0 | Living | flexible |
| 🪪 Iqama & gov fees | 0 | Obligations | committed |
| 🚙 Car loan | 0 | Obligations | committed |
| 📋 Jordan loan | 0 | Obligations | committed |
| 🏡 House savings | 0 | Obligations | goal |

### Recurring, commitments & entries (seed)
_0 seed recurring items (salary auto-creates on first run) · 0 seed commitments · 0 seed entries — your income, expenses & payments live here._

### Seed roadmap (copied into your data on first run — edit it in Goals)
| # | Phase | Window | Goal |
|---|---|---|---|
| 1 | Phase 1 — Clear Jordan Obligations | 2026-06 → 2026-10 | Pay Jordan loan (closes Oct), clear Jordan credit card. Pay minimums on KSA cards. |
| 2 | Phase 2 — Destroy KSA Credit Cards | 2026-11 → 2027-09 | Attack the highest-interest card first, then the next, putting the monthly surplus toward the cards. |
| 3 | Phase 3 — Finish Car Loan | 2027-10 → 2028-01 | Double payments on car loan. Clear remaining balance by January 2028. |
| 4 | Phase 4 — Full Savings Mode | 2028-02 → 2031-12 | Shift to a high savings rate and invest steadily toward the house goal. |

### Source file manifest (SHA-256, first 16 hex)
| File | Bytes | Hash |
|---|---|---|
| `index.html` | 125,296 | `3375ab1807bbc1a3` |
| `sw.js` | 1,411 | `1f49c0ef58cc132c` |
| `manifest.json` | 480 | `667075e74e294a37` |
| `README.md` | 1,650 | `b67d621fc21bba5e` |
| `icon-180.png` | 11,837 | `4f4aa4ab23cec3a9` |
| `icon-192.png` | 13,061 | `731c75ee35bbc385` |
| `icon-512.png` | 21,751 | `fa0dd4a4cf91109f` |
| `docs/generate-docs.mjs` | 7,327 | `5676471b784e86fc` |
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

**Design system (finance-v8):** the warm cream-and-green "companion" palette from the Claude Design pass,
implemented as CSS custom properties with full light + dark themes — **every text/surface pair measured
≥ 4.5:1 in both** (light-mode inks were darkened from the design draft to pass WCAG). Manual Light / Dark /
Auto (persisted at `localStorage["finance_theme"]`, separate from finance data) plus a header quick-toggle.
Bottom tab bar for one-handed reach; ≥ 44px touch targets; `dir="auto"` on user text for Arabic fragments;
tabular numerals everywhere; `prefers-reduced-motion` respected; system fonts only — no webfonts, no CDNs.

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
6. ~~**Phases are hardcoded**~~ — **Resolved in finance-v7.** The roadmap is editable in Goals (add / edit /
   delete phases); the in-code `PHASES` is only a first-run seed. Update your house deadline (e.g. 2030) there.

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
| finance-v8.2 | 2026-07-18 | **Paid-with & revolving cards** (use-first feedback #2) — every expense records its payment method (SAR cash/bank · JOD cash · debit · any credit-card account · other); card purchases **raise** that card's balance, card payments lower it and no longer count as spending (balance transfer — the spend was the purchase; loans unchanged). Entry rows show a "via …" tag. Cards & loans setup simplified to name + amount owed + kind, with bank/original/rate/budget-link folded into optional "More details" (original defaults to amount owed). SW cache → finance-v8.2. |
| finance-v8.1 | 2026-07-18 | **Cadence release** (first use-first friction fix) — recurring items get a frequency: monthly / every 3 / every 6 / **yearly**, anchored to a "first payment" month (Saudi-style annual or semi-annual rent and yearly iqama now model correctly); "until" is optional everywhere — **forever by default**. Committed & safe-to-spend switch to the **monthly equivalent** of recurring items (amount ÷ interval), so an annual payment weighs 1/12 on every month instead of shocking one; recurring manager shows cadence + next posting and ≈/month totals; Upcoming respects cadence. Existing items migrate as monthly. SW cache → finance-v8.1. |
| finance-v8 | 2026-07-17 | **The ideal-app release** — Claude-Design port: warm light/dark "companion" palette (WCAG-verified ≥4.5:1 both themes), bottom tab bar, first-run onboarding with restore. Planner: category kinds (committed / flexible / goal), **Safe-to-spend-today**, rollover envelopes, **Commitments** with set-aside math, per-debt **payoff projections** with interest, house verdict vs an editable target month. Recurring created inline from the Log ("Repeats monthly" + "until"), skip-a-month sheet, ENDED + Renew. Backup-age nudge; dashboard anchored to the current month with closed-month look-backs. In-place migration v1–v7 → v8 (`houseSaved` → `houseSavedStart` + logged accrual). Fixed multi-month date arithmetic in projections. SW cache → finance-v8. _Deferred to v8.1: avalanche-vs-snowball simulator, payoff-order timeline, auto-snapshots._ |
| finance-v7 | 2026-07-17 | **Configure-everything release** — full income tracking (salary auto-posts on payday; bonuses/gifts/one-offs logged via an Income toggle in the Log; Remaining = actual income − spent); recurring engine (rent, parents' rent, iqama, loan installments post themselves; recurring payments also pay down the linked account; skip-a-month by deleting that copy; pause/resume); categories became editable data with a life-based 20-category seed grouped Home/Family/Jordan/Living/Obligations (baby girl, school fund, parents' rent support, charity…); roadmap/phases editable in Goals; SMS parser learns baby & remittance merchants. In-place zero-loss migration from v6 and v1–v5. SW cache → finance-v7. |
| finance-v6 | 2026-06-12 | **Phase 1 re-architecture** — new data model (settings / per-category budgets / debts / entries) with in-place, zero-loss migration; five tabs (Dashboard · Log · Budget · Goals · Settings); a single unified **Log** (expense / card-or-loan-payment toggle) as the only money-out entry point; **automatic calculations** (debt balance from payments, month income with step-up + single-month override, all totals derived); editable Cards & Loans in Settings; SMS import now feeds the Log. Carries the v5 design system. SW cache → finance-v6. |
| finance-v5 | 2026-06-12 | Visual redesign — warm "fresh fintech" light/dark design system (token-based, auto + manual Light/Dark/Auto switch), category-colour chips, humanist typography (no monospace / all-caps), restyled cards/buttons/inputs/tabs/bars, tabular-num figures, over-budget shown with sign + icon (not colour alone). No logic/data changes. SW cache → finance-v5. |
| finance-v4 | 2026-06-12 | Budget fix — each variable category (Food, Transport, Family, Bills, Health, Clothing, Entertainment, Jordan Transfer, Other) now tracks its own Plan-vs-Actual line instead of Food absorbing six of them. New budget keys default to 0 for existing data (no wipe). SW cache → finance-v4. |
| finance-v3 | 2026-06-12 | Privacy: neutralized seed data (zeroed salary/debts/budgets/target, removed bank & card names and header name, genericized the roadmap) and rewrote the public git history to purge the earlier personal values. |
| finance-v2 | 2026-06-12 | Bank-SMS import: paste / clipboard / `#b64=` intake, on-device EN/AR parser, duplicate guard, iOS Shortcut path. Added this documentation system. |
| finance-v1 | 2026-06-12 | Initial release — Overview, Budget, Expenses, Debts, Plan, Settings; PWA + offline + backup/restore. Deployed to GitHub Pages. |
