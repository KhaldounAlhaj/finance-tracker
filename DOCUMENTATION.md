# Finance Tracker — App Documentation

<!-- VERSION --> app **finance-v10.9** · docs synced **2026-09-04** <!-- /VERSION -->

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

## 2. Modules — 3 zones on a bottom bar (v9)
| Tab | Purpose |
|---|---|
| **Overview** | Month-scoped control center: **Available within plan**, **Cash after commitments**, up to three overdue/planned reminders, spending and budget status, goal progress, and debt movement. Historical months show actual results. |
| **Log** | Confirmed money only: expense, refund, card/loan payment, income, or goal contribution. Date and time default locally and remain editable. Includes recent-activity filters, bank-SMS intake, and atomic CSV catch-up preview with duplicate protection. |
| **Manage** | The single home for planned-payment reminders, Budget Health, goals and commitments, income plan, budgets, categories, cards and loans, theme, backup, restore, and reset. |

A three-zone bottom bar keeps logging, reviewing, and configuration separate. Planned payments are reminders only and support **Log / Reschedule / Skip this month**; they never create transactions automatically.

## 3. Features
### 3.1 Core (v9 Financial Control Center)
- **Available within plan** = expense-category budgets − actual cash/card spending + refunds − open expense reminders. Card and loan payments are excluded because they are balance movements, not new spending.
- **Spent this month** = all expense purchases from every payment source − refunds returned to those sources. The Overview breaks this down by Cash/bank, Debit, JOD cash, Other and each configured credit card. Debt payments and goal contributions remain separate so card activity is never double-counted.
- **Cash left now** = confirmed income − confirmed immediate-liquidity outflows + refunds returned to immediate-liquidity sources. **After upcoming commitments** then subtracts open cash obligations and remaining goal reservations. These are monthly flows, not reconciled bank balances.
- **Category kinds** separate expense budgets from goal reservations; debt-linked categories are excluded from the spending-plan total. **Rollover** categories still carry unused budget.
- **Unified Log** supports expense, refund, card/loan payment, income, and goal contribution with editable local date/time. Creating a repeating item creates a reminder template only.
- **Paid with & revolving cards** — every expense records how it was paid: SAR cash/bank, JOD cash, debit,
  or one of your **credit cards**. A card purchase raises that card's balance; paying a card lowers it and is
  treated as a balance transfer, **not** new spending (the spend was the purchase — no double counting).
  Loan payments are cash outflows but not new category spending. Debt setup is minimal — name + amount owed + card/loan; bank, original,
  rate and budget link are optional "More details".
- **Reminder lifecycle** — each template produces occurrences at its own monthly / quarterly / semi-annual / yearly cadence. Occurrences remain overdue until manually logged, rescheduled, or skipped. Logging opens an editable draft; saving is the only operation that creates an entry.
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

### 3.3 Data model — `localStorage["khaldoun_finance_v3"]` (modelVersion 9; migrated in place, zero loss)
- `settings { salarySteps:{ "YYYY-MM": amount }, payday, houseTarget, houseTargetMonth,
  houseSavedStart, houseAccrueFrom, lastBackupAt, salaryOverrides }`
  — `salarySteps`: each amount takes effect from its month and carries forward until the next step;
  months before the first step have no salary. `salaryOverrides` still corrects a single month.
  (Old `salaryCurrent` / `salaryFrom` / `salaryFromAmount` migrate into steps automatically.)
- `categories [ { id, name, icon, group, kind:"committed"|"flexible"|"goal", rollover, archived } ]`
  · `budgets { <categoryId>: plannedAmount }`
- `commitments [ { id, name, target, dueMonth, categoryId, fundedStart, createdFrom } ]`
- `debts [ { id, name, bank, startingBalance, original, ratePerMonth, kind, category, closed } ]`
  — `closed:true` takes a settled account out of the debt total, the payoff projection and every
  account picker while keeping its name on all of its historical entries; only a zero-balance
  account may be closed, and reopening is always available
- `recurring [ { id, name, amount, type, categoryId, debtId, paidWith, dayOfMonth, everyMonths, startMonth, endMonth, active, isSalary } ]`
  — reminder templates only; `everyMonths` sets cadence and `startMonth` anchors occurrences
  · `occurrences { "recurringId:YYYY-MM": { status, to?, entryId?, updatedAt } }`
  · `skips [ "recurringId:YYYY-MM" ]` is read-only legacy compatibility data; new skips write `occurrences`
- `entries [ { id, date, occurredAt, amount, category, type:"expense"|"refund"|"payment"|"income"|"goal"|"balance_adjustment", debtId, paidWith, goalId, description, recurringId, sourceRef, importId, importedDuplicate } ]`
  — `paidWith`: null (SAR cash/bank) · "cashJOD" · "debit" · "otherPay" · a card's debt id (raises its balance)
- `phases [ { name, title, start, end, goal } ]` — the editable roadmap
- `imports [ { id, at, count } ]` records completed atomic CSV batches; import rows retain `sourceRef` for duplicate detection.

CSV account fields are review hints only. The preview requires explicit in-app selection of Paid with for expenses/refunds and Account paid for debt payments; arbitrary CSV account text is never persisted. Categories and goals use live dropdowns, unresolved included rows block confirmation, `source_ref` is optional, and the latest import batch can be undone by `importId`.
- **House saved is derived**: `houseSavedStart` + every confirmed contribution logged to the House savings category since
  `houseAccrueFrom` (v7's manual `houseSaved` migrates into `houseSavedStart`; nothing recomputable is stored).
- Every older shape upgrades in place: v7 gains kinds, rollover flags and `commitments`; v6 and legacy v1–v5
  chain through the earlier migrations first. Income sources (salary/bonus/gift/other) live on income entries'
  `category` field, separate from spending categories.

## 4. Generated reference
_Machine-generated from source on every commit — do not edit by hand._

<!-- AUTO:GENERATED:START — produced by docs/generate-docs.mjs · DO NOT EDIT BY HAND -->
_Synced **2026-09-04** · app version **finance-v10.9** · storage key `khaldoun_finance_v3`_

### Identity
- **Budget Tracker** — Personal finance, debt and house-savings tracker
- **Display:** standalone · **Theme:** #1f7a63
- **Tabs:** dashboard · log · settings
- **Categories:** 20 seed, fully editable in-app (rename / icon / group / kind / rollover / archive / add)

### Income & goal (seed defaults)
| Field | Value |
|---|---|
| Salary steps | none seeded — set in-app; each change takes effect from the month you pick and carries forward |
| Payday (day of month) | 1 |
| House target | 0 SAR by 2029-12 |
| House saved before tracking | 0 SAR (entries to House savings add on top) |

### Cards & loans (seed) — total starting balance **0 SAR**
| Name | Bank | Starting | Original | Rate | Kind | Linked | State |
|---|---|---|---|---|---|---|---|
| _(none in seed defaults)_ |  |  |  |  |  |  |  |

An account's `closed` flag defaults to `false` and is additive — an account closed on the
device leaves the debt total, the payoff projection and every account picker, but keeps its
name on all of its historical entries. Only a zero-balance account may be closed.

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
_0 seed reminder templates (salary planning is added on first run; nothing auto-posts) · 0 seed commitments · 0 seed entries — confirmed income, expenses, refunds, payments and goal contributions live here._

### Seed roadmap (copied into your data on first run — edit it in Goals)
| # | Phase | Window | Goal |
|---|---|---|---|
| 1 | Phase 1 — Build the baseline | 2026-01 → 2026-03 | Log income, expenses, commitments, and opening balances. |
| 2 | Phase 2 — Reduce expensive debt | 2026-04 → 2026-12 | Prioritize the highest-cost revolving balance. |
| 3 | Phase 3 — Finish remaining loans | 2027-01 → 2027-12 | Redirect released payments toward remaining balances. |
| 4 | Phase 4 — Grow long-term goals | 2028-01 → 2031-12 | Increase regular contributions toward selected goals. |

### Source file manifest (SHA-256, first 16 hex)
| File | Bytes | Hash |
|---|---|---|
| `index.html` | 199,622 | `b6eae0a5074568ef` |
| `sw.js` | 1,456 | `d233d42bd23eb9fa` |
| `manifest.json` | 478 | `554109b829335300` |
| `README.md` | 3,030 | `290744b5247db4d5` |
| `icon-180.png` | 23,893 | `de63b104b43ca1d0` |
| `icon-192.png` | 26,915 | `0cb0b374422b11ee` |
| `icon-512.png` | 148,189 | `d68c4eae11e7ba8f` |
| `docs/generate-docs.mjs` | 7,877 | `02075341b41cc951` |
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
| finance-v10.9 | 2026-09-04 | **Renamed to Budget Tracker.** The app now calls itself **Budget Tracker** on all four surfaces that name it: the browser tab, the iOS home-screen label (`Budget`), the install prompt (`manifest.json` name and short_name) and the first-run footer. A release test pins all four together and fails if any user-facing string still reads the old name, so the identity cannot drift again. No repository, URL, storage-key, model-version or migration change — the app is unchanged apart from what it is called. **iOS note:** an already-installed home-screen icon keeps its old label, because iOS snapshots the name at add-time; renaming the icon needs backup → remove icon → re-add → restore, since deleting an installed web app clears its local storage. SW cache → finance-v10.9. |
| finance-v10.8 | 2026-08-28 | **Closed accounts.** A card or loan can now be **closed** instead of deleted. Reported by the owner after paying off and shutting two credit cards: the only available action was **Delete**, which removed the account and left every past purchase made with it labelled "Other", because the source name could no longer be resolved. A closed account leaves the debt total, the payoff projection, the **Pay towards** and **Paid with** pickers, the planned-payment account picker and the CSV review pickers, and pauses any planned payment linked to it — but keeps its name on every historical entry, source row and drill-through. Closing is allowed **only at a zero balance**, so it can never hide money still owed; the refusal points at logging the final payment or **Reconcile statement balance**. Reopening restores the account everywhere and is always available. `debts[].closed` is additive with a safe default, so no storage-key, model-version or migration change. SW cache → finance-v10.8. |
| finance-v10.7 | 2026-08-15 | **Self-review corrections.** A month where refunds exceeded purchases was drawn in the spending trend exactly like a month of heavy spending — same colour, height set by magnitude — so a large refund read as a large outlay. Those months now use the positive treatment, show a `+` and say "returned to you" in their accessible label. Separately, `activityDrill` was declared below three functions that read it, which worked only because nothing called them during script evaluation; the declaration now sits above its consumers and a test enforces the order. No formula or data change. SW cache → finance-v10.7. |
| finance-v10.6 | 2026-08-15 | **The entry-type picker now explains itself.** Reported as confusing: the buttons at the top of Log looked like filters and appeared to do nothing. They choose what you are about to log, but Expense and Refund share every field, so switching between them changed exactly one word on the Save button. The picker is now headed **"What are you logging?"** and each type states its effect on your money the moment you pick it — what it does to the plan, to cash left now, and to a card or goal balance. The Recent activity filters below say plainly that they search what you have already logged and do not change the form. No behaviour change to any entry type. SW cache → finance-v10.6. |
| finance-v10.5 | 2026-08-15 | **The owed backlog, cleared.** Reminder semantics settled: logging a rescheduled occurrence now carries its moved date, so deleting that entry reopens on the date you moved it to, and **Next payment** reports a rescheduled date when one falls before the next natural occurrence. Logging from a reminder offers an explicit **Update future reminders** switch, off by default, so one occurrence stays one occurrence unless you opt in. The **bank-SMS parser** learned the transfer shape (`…من <account> لـ <service>`, which carries no balance line and had been losing whole transfers), captures the transaction time the bank prints, and refuses to fill the form from a declined message; a date without a time no longer vanishes into the datetime field. Overview gains a **six-month spending trend** with tappable months. Manage explains that **each device keeps its own copy** and that backup/restore is how you move between them. **Laptop composition** above 1100px: 1180px shell, top navigation, decisions left and reference figures right, 52px hero and a third "Free" reading on the plan bar — the phone layout is untouched below that width. No formula, storage-key, model-version or migration change. SW cache → finance-v10.5. |
| finance-v10.4 | 2026-08-15 | **Import and review fixes.** CSV rows are no longer blocked because their *notes* happen to mention a declined attempt — only a declared status marker at the start of the notes, or a declined/rejected transaction **type**, blocks a row. Free-text review guidance such as "successful purchase after an earlier declined attempt" now imports normally, where before it was silently rejected. An open activity drill now follows the month when the Overview tab resets to the current month, not only when the month arrows are used. The Roadmap phase editor collapses to a single column below 420px, so its month inputs no longer force sideways scrolling on a phone. No formula, storage-key, model-version or migration change. SW cache → finance-v10.4. |
| finance-v10.3 | 2026-08-15 | **QA accounting corrections** — statement reconciliations no longer count as spending or cash movement; legacy goal-category expenses use the same classification in totals and drill-through; card-funded goal movement does not reduce current liquidity; closed months now show spending by source, liquidity, debt payments and goal movement; dashboard drills clear conflicting Log filters and follow month navigation. No migration or stored-data rewrite. SW cache → finance-v10.3. |
| finance-v10.2 | 2026-08-14 | **Monthly spending and liquidity clarity** — Overview now separates Cash left now from After upcoming commitments, shows net purchases across every payment source, and keeps debt payments and goal contributions visible but outside spending to prevent double counting. Source, debt and goal rows drill into a clearable selected-month activity view. No migration or stored-data rewrite. SW cache → finance-v10.2. |
| finance-v10.1 | 2026-08-14 | **Budget status badge fix** — the On track badge now uses a dedicated status class instead of inheriting the 6px progress-track style. This restores the full pill, border and text without changing budget calculations or stored data. SW cache → finance-v10.1. |
| finance-v10 | 2026-08-14 | **Warm Modern Finance redesign** — Direction 1d with hero 2a, accessible warm light and dark themes, one dependency-free inline SVG icon family, decision-first Overview, amount-first Unified Log, clearer planned-payment actions, four-state Budget Health, complete debt ledgers, seven-route Manage hub, and semantic CSV review. Responsive hardening covers iPhone and centered laptop usability without changing formulas, storage, migrations, or offline privacy. SW cache → finance-v10. |
| finance-v9.2 | 2026-08-14 | **Reminder occurrence integrity** — deleting a reminder-linked entry now reopens the planned occurrence instead of silently skipping it. A shared resolver keeps dashboard metrics and planned-payment views aligned, and load-time repair safely fixes dangling logged occurrence records while preserving legacy fulfilled entries. Explicit Skip remains a confirmed action and writes only the current occurrence model. Example import card digits are now obviously fake. SW cache → finance-v9.2. |
| finance-v9.1 | 2026-08-14 | **Account-safe CSV import** — `account_ref` and `paid_with` are treated as non-secret hints only and are never persisted as account IDs. Expense and refund rows require a confirmed **Paid with** choice (cash / debit / other / a configured card), payment rows a confirmed **Account paid**, and goal rows a live goal category; rows with unresolved required choices are blocked from confirmation. `source_ref` became optional — without it, duplicate detection falls back to normalized type, timestamp, amount, description and the original account hint, and re-runs after edits and again immediately before confirming. Declined/rejected rows are permanently non-importable. Bulk assignment applies only to included, compatible rows. Each successful import carries one `importId` and can be undone by removing just that batch. No model-version change. SW cache → finance-v9.1. |
| finance-v9 | 2026-08-14 | **Financial Control Center** — three-zone navigation (Overview · Log · Manage); reminder-only planned payments with Log / Reschedule / Skip; editable transaction date and time; refunds, goal contributions, card and loan payment separation; Available within plan plus Cash after commitments; per-category Budget Health; monthly debt movement and statement reconciliation; atomic CSV catch-up preview with duplicate protection; modelVersion 9 zero-loss migration; no CDN or external runtime dependencies. |
| finance-v8.3 | 2026-07-18 | **New app icon** — gold monogram on dark, supplied by Khaldoun; regenerated at 512/192/180 from a 1024² source. SW cache → finance-v8.3 so installed devices refetch the icons. (iOS note: the home-screen icon is snapshotted at add-time — updating it needs backup → remove icon → re-add → restore, since deleting an installed web app clears its local storage.) |
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
