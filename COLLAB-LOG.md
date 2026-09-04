# COLLAB-LOG — shared change log for Codex & Claude

Two AI agents work on this repo. This file is how they stay aligned. **Read it before you execute anything.**

| Agent | Role | Commits & pushes? |
|---|---|---|
| **Codex** | Builds features, writes the specs/plans under `docs/superpowers/`, ships releases | **Yes — Codex is the only agent that commits and pushes** |
| **Claude** | Senior QA reviewer; may also edit files locally when asked | **No.** Claude edits the working tree, logs it here, and stops. The owner then asks Codex to commit |

Owner: Khaldoun. Nothing is pushed without his say-so.

## Rules

1. **Read `## Pending handoffs` and the newest entries in `## History` before you start.** If another agent has uncommitted work in the tree, do not overwrite it — reconcile first, or ask the owner.
2. **Log before you hand back.** Every agent appends an entry to `## History` (newest at the top) describing what it changed and why.
3. **Claude commits and pushes only when the owner says so for that piece of work** (changed 2026-08-15; it previously never did). Default remains: finish, log, and hand back. When Claude does ship, it keeps releases small, works test-first, and Codex must `git pull` before its next unit.
4. **Codex clears the handoff when it commits.** Move the item from `## Pending handoffs` into `## History` with its commit hash.
5. **When in doubt, don't guess — put it in `## Open questions` and ask the owner.** That applies to both agents.
6. `index.html` is one file holding the whole app. Two agents editing it at once will collide. Only one agent touches it at a time; check `git status` and this log first.
7. This file is documentation, not code. It does not need a `sw.js` cache bump.

> **Sync caveat worth knowing:** Claude's local edits and log entries only become visible to Codex-on-the-web after they're committed and pushed. Running **Codex CLI in the local folder** avoids this entirely, because it sees the working tree directly. If Codex runs in the cloud instead, the owner has to get the local changes up to GitHub first.

## Pending handoffs

_Uncommitted work sitting in the local working tree, waiting for Codex to commit._

| Date | From | Handoff |
|---|---|---|
| 2026-09-04 | Claude | **finance-v10.9 — app renamed to Budget Tracker.** Committed and pushed to `claude/repo-access-kttni4` only. `main` still serves v10.8, so the rename is not live until the owner says to merge. Codex must `git pull` before its next unit — `index.html` and `manifest.json` moved. |

## Open questions

_Anything an agent wasn't sure about. Answer or delete once resolved._

| Date | Raised by | Question |
|---|---|---|
| 2026-08-15 | Claude | **For the owner: the iOS Shortcut `#b64=` storage test.** Does Safari share `localStorage` with the installed home-screen app? Only he can run it, on his phone. Until it is answered the Shortcut intake path cannot be trusted. *(The other half of this question — needing a real bank SMS to tune the parser — is now **resolved**: he supplied 16 SMS and 4 card-log screenshots, and finance-v10.5 taught the parser the transfer shape from them.)* |
| 2026-08-15 | Claude | **No independent QA exists for finance-v10.4, v10.5 or v10.6.** Claude authored and reviewed all three, so the reviewer/author separation that covered v9.1–v10.3 is absent. Codex should run the standing QA prompt over `fdb1940..HEAD` before further feature work. |

## History

_Newest first. One entry per unit of work, not per file._

### 2026-09-04 · Claude · finance-v10.9 — the app is now Budget Tracker

Owner asked to rename "finance tracker" to "budget tracker" **on GitHub**. Asked which name
he meant before touching anything, because three different things carry it and they have very
different consequences: the repository and its Pages URL, the app's own display name, or a file
inside the repo. He chose **the app name only** — the repository stays `finance-tracker` and the
live URL is unchanged.

Four surfaces name the app, and a rename that misses one ships a split identity:

| Surface | Was | Now |
|---|---|---|
| `index.html` `<title>` | Finance Tracker | Budget Tracker |
| `index.html` `apple-mobile-web-app-title` | Finance | Budget |
| `index.html` first-run footer | Finance Tracker · private & offline | Budget Tracker · private & offline |
| `manifest.json` `name` / `short_name` | Finance Tracker / Finance | Budget Tracker / Budget |

A new release test pins all four together and asserts no user-facing string still reads the old
name — mutation-checked by reverting one string and confirming it fails, rather than trusting a
green run. `DOCUMENTATION.md` §4 picks the new name up from the manifest through the generator.

**Deliberately not renamed**, and worth stating so nobody "finishes the job" later:

- `localStorage["khaldoun_finance_v3"]` — frozen in `AGENTS.md`. Renaming it orphans every
  byte of the owner's data.
- `sw.js` `CACHE = "finance-vN"` — an internal cache key, not a product name. The `finance-vN`
  series is the documented release convention; breaking it would desync the changelog, the
  release test and `AGENTS.md` for no user-visible gain.
- `manifest.json` `description` ("Personal finance, debt and house-savings tracker") — still
  accurate English, and the owner asked for the name, not the description. Flagged to him
  rather than changed.
- Repository name, Pages URL, and every `finance-tracker` reference in `README.md`,
  `DOCUMENTATION.md` and `AGENTS.md` — out of the scope he chose.

**Checked and worth recording, because the instinct is to fear it:** a repository rename would
*not* have lost his data. `localStorage` is scoped to the origin `https://khaldounalhaj.github.io`,
and the path is not part of an origin, so `/finance-tracker/` and `/budget-tracker/` read the same
store. The same fact is a latent footgun in the other direction — every GitHub Pages project under
that account shares one `localStorage`, which is why the frozen, account-specific key matters.

**The one thing this release cannot fix by itself:** iOS snapshots a home-screen icon's label at
add-time, so the owner's installed icon keeps saying "Finance" until he removes and re-adds it —
and on iOS, deleting an installed web app clears its local storage. So that must go
backup → remove icon → re-add → restore, exactly as the v8.3 icon change did. Recorded in the
changelog next to the release rather than only here.

Verification: **113/113 tests** (one added). `git diff --check` clean, no remote dependency, no
storage-key, model-version or migration change. Cache `finance-v10.9`, changelog added, §4
regenerated through the generator.

### 2026-08-28 · Claude · finance-v10.8 — a card can be closed instead of deleted

Owner report: he had paid off and shut two credit cards and could not find how to record
that in the app. Investigated before building. **Both halves of what he needed already
existed** — Log → **Card · loan** logs a payment against a card, and Manage → **Cards &
loans** → Delete removes an account — so the immediate answer was a walkthrough, not code.

But the question exposed a real gap, and he asked for it fixed. Deleting was the *only*
way to retire an account, and it is destructive in a non-obvious way: `paymentSourceLabel`
resolves a purchase's source by debt id, so once the account is gone every past purchase
made with it relabels itself **"Other"** in the historical spending breakdown. The
alternative — keeping it — leaves a dead 0 SAR account in the accounts list, in three
pickers and in the payoff projection forever. Neither choice is right.

`debts[].closed` now exists. Spec:
`docs/superpowers/specs/2026-08-28-closed-accounts-design.md`, plan:
`docs/superpowers/plans/2026-08-28-closed-accounts-implementation.md`.

**The decision worth recording: closing requires a zero balance.** A closed account leaves
`totalDebt()`, so allowing it at a non-zero balance would let the owner hide money he still
owes from his own debt total. Closing is refused otherwise and points at logging the final
payment or **Reconcile statement balance**. Reopening is always allowed. Closing pauses any
linked planned payment, matching what Delete already did.

The split that makes this safe is between *forward-looking* and *historical* reads.
Excluded: `totalDebt`, `totalOriginal`, `recPaymentFor`, the Overview debt note and
projections, the Goals payoff list, `ePay`, `ePayWith`, `rAcct`, the Manage row count and
`importChoiceOptions`. **Deliberately not excluded:** `paymentSourceLabel`, `debtName`,
`isCardPayment`, `classifyMoneyEntry` and `debtMovement` — if a closed card stopped
resolving as a card, its past payments would reclassify as consumption spending and every
closed month would silently change. A test asserts that non-exclusion directly, because it
is the kind of thing a later refactor would "tidy up".

`validateImportDraft` is also left permissive on purpose: the pickers hide closed accounts,
but a row that already names one still validates, so re-importing the closed card's own
history is not blocked.

Structural cleanup that came with it: `debtCurrent` had a second copy of the balance
formula outside the testable core block. It now delegates to a new `coreDebtBalance` in
`CORE_V9`, so there is one formula and the closing rule (`canCloseDebt`) is exercised in
the VM rather than asserted by regex.

No `modelVersion` bump and no new migration step — `normDebt` defaults the field, so a
v3-era payload loads with every account open. Storage key untouched.

Released to `main` on the owner's instruction, so this went straight to GitHub Pages rather
than waiting for a review — worth noting given the QA gap recorded at the end of this entry.

Verification: **112/112 tests** (up from 100; 12 added). `git diff --check` clean, no
remote dependency. Live on an isolated origin in Chromium: closing a card with 1,000 SAR
outstanding is refused with the balance named; closing a settled card drops it from the
debt total, both Log pickers, the payoff list and the reminder picker, pauses its reminder,
and leaves its May purchase still attributed to it by name with its June payoff still a
debt payment and not spending; Reopen restores all of it. `Closed accounts (2)` renders as
a collapsed 44px group at 390×844 and 1280×800 with no overflow (390/390 and 1180/1180) and
no console errors. Cache `finance-v10.8`, changelog added, §4 regenerated through the
generator.

**Two of my own tests were wrong before the code was** — recording it because both failure
modes will recur in this repo. A lazy `/function debtName\([\s\S]*?\n\}/` extraction
silently swallowed the *next* function, because `debtName` is a one-liner with no `\n}` of
its own, so the assertion tested the wrong body. And `assert.deepEqual` from
`node:assert/strict` fails on reference-equality for any array or object built inside the
`vm` context — the existing suite's `{...result.bySource}` spread is that workaround, not a
style choice.

**Still open and not touched:** the iOS Shortcut `#b64=` storage test, which needs the
owner's phone, and the independent-QA gap on v10.4–v10.6 recorded in Open questions. This
release is also Claude-authored and Claude-reviewed, so it joins that gap.

### 2026-08-15 · Claude · self-review of v10.4–v10.6 → finance-v10.7
With the owner away and no second reviewer available, ran an adversarial pass over Claude's own three releases rather than leave them unreviewed. **Two real defects found and fixed, two suspected defects disproved.**

**Fixed:**
- **A net-refund month was drawn as a month of spending.** `renderSpendTrend` sizes bars by magnitude, so a month whose refunds exceeded purchases produced a tall bar in the ordinary spending colour — a large refund read as a large outlay, which is the opposite of the truth. Those months now use the positive treatment, carry a `+`, and say "returned to you" in the accessible label.
- **`activityDrill` was declared below three functions that read it** (`goToMonth`, `chMonth`, `resetToNow`). It worked only because nothing calls them during script evaluation — a temporal-dead-zone `ReferenceError` waiting for the first caller that runs earlier. Declaration hoisted above its consumers, with a test that enforces the ordering.

**Disproved before reporting** — worth recording, because both looked like defects at first:
- "Update future reminders did not update the template." It does; the first test run was swallowed by the over-budget `confirm()` dialog returning false in the automation context. Re-tested with the dialog stubbed: 1,500 → 1,623, opt-in resets, the repeat row is restored.
- "The rescheduled date never appears on the reminder row." It does. The first scenario had an *open August occurrence* that legitimately falls before the October reschedule, so August was the correct answer. Re-tested with a quarterly reminder whose next natural date is November and an occurrence moved to 9 September: the row reads "(moved to 2026-09-09)", and deleting the reschedule reverts it to the natural date.

Verified live afterwards: trend colours correct in both themes, drill-through and month navigation still work after the hoist, no console errors, no overflow. **100/100 tests.**

**Still open and not closeable here:** the iOS Shortcut `#b64=` storage test, which needs the owner's phone. And this pass does not replace independent review — the author and the reviewer were the same person, which is exactly the gap recorded in Open questions.

### 2026-08-15 · Claude · finance-v10.6 — the entry-type picker explains itself
Owner feedback: the buttons at the top of Log "do nothing" and look like filters. Investigated rather than assumed, and he was right about the experience. They are the entry-type picker, not a filter — but **Expense and Refund share every single field**, so switching between them changed exactly one thing: the word on the Save button, below the form. Payment, Income and Goal do reveal different fields, but the two a person tries first look inert.

Compounding it, the same page carries a *real* type filter in Recent activity that looks similar, so the screen had two similar controls, one of which filters and one of which does not.

Fix, no behaviour change: the picker is headed **"What are you logging?"**, and a line beneath it states each type's effect on the money the moment it is selected — plan, cash left now, card or goal balance. The activity filters now say they search what is already logged and do not change the form. A design contract asserts every type has an effect line, so a future type cannot be added silently.

Worth keeping in mind for future work: this was invisible to the whole suite. Nothing was broken, so nothing failed — the design simply did not communicate. Only using the screen found it.

### 2026-08-15 · Claude · finance-v10.5 — the whole backlog cleared, with four owner decisions taken
The owner asked for everything outstanding and answered the four questions that gated it. **Decisions recorded, since they change documented behaviour:** a reopened occurrence keeps a prior reschedule · "Next payment" means the rescheduled date when one is nearer · the laptop gets the full two-column composition from `HANDOFF.md` · the per-device data split gets a warning and an explicit transfer story.

Shipped in four reviewable commits, each test-first:

1. **Reminder semantics (L2, L3).** The logged occurrence record now carries the moved date, so delete reopens on it and repair restores it; `nextOccurrence` returns `{month,date,rescheduled}` and the reminder row shows the moved date. Both were open product questions since the v9.2 QA.
2. **SMS parser.** Learned the transfer shape `…من <account> لـ <service>` — no balance line, previously unmatched, and the direct cause of two significant transfers being lost from catch-up imports twice. Also captures the printed transaction time, and flags refusals so a declined message can no longer be pasted in as a purchase. Fixed alongside: `fillFromParse` was writing a bare date into a `datetime-local` field, which silently discarded it. New `tests/sms.test.mjs` exercises the parser directly against real message shapes.
3. **Update-future opt-in, spending trend, device-scope warning.** All three were owed: §4.3 and §3.4 of the v9 spec were confirmed *missed* rather than deferred, and the device split had no story.
4. **Laptop composition.** 1180px shell above 1100px, top navigation, decisions left / reference right, 52px hero, third "Free" reading on the plan bar. Below 1100px nothing changes.

**Two defects found in my own work by live testing, not by the suite** — worth recording because source-level tests would not have caught either. The two-column grid silently did nothing, because `renderDashboard` set `display` as an *inline* style, which beats any stylesheet rule; visibility now toggles the `hidden` attribute and a test asserts JS no longer writes that inline display. And the `.plan-legend` base rule sat *after* its media query, so equal specificity meant the later `display:none` always won.

**Tests changed, declared rather than buried:** the v10 contract "laptop widens one shared shell **without introducing desktop navigation**" encoded the decision to defer desktop. That decision has been reversed by the owner, so the contract now asserts the new intent — two columns only above 1100px, and explicitly that nothing leaks below it. One first-run contract asserted the exact string "Restore from backup"; the copy changed, the capability did not, so it now tests for a restore path.

Verification: **97/97 tests** (up from 74; 23 added across this and v10.4), `git diff --check` clean, no remote dependency, no storage-key, model-version or migration change. Live on an isolated origin: 390×844 clean in both themes across five pages, the closed-month view and seven overlays, with no grid leak, the bottom navigation intact, the legend hidden and every trend bar meeting 44px; 1280×800 and 1920×1080 show the two columns with all four shells at 1180px and the top navigation keyboard-focusable; no console errors at any width. Cache `finance-v10.5`.

**Still open and not touched:** the iOS Shortcut `#b64=` storage test, which only the owner can run on his phone.

### 2026-08-15 · Claude · finance-v10.4 implemented, committed and pushed — **workflow change**
Release commit `2c59806`. **The owner explicitly authorised Claude to commit and push for this release**, overriding the standing rule that Codex is the only agent that does so. That rule existed because of the GitHub account split, not because of judgement; treat it as changed for this repo until the owner says otherwise. Codex must `git pull` before its next unit of work — `index.html` moved.

Scope was deliberately limited to the three **fixes** from the backlog below. The parser work and every enhancement were left untouched: they need their own specs and the owner's L2/L3 answers, and shipping them together would have produced exactly the unreviewable diff this log has argued against all week.

Implemented test-first, three failing tests first, then the code:

1. **Import no longer blocks a row because its notes mention a declined attempt.** `normalizeImportRow` now derives `blocked` from the transaction **type**, or from a *declared status marker at the start of the notes* (`declined`, `rejected`, `status: declined`, and the Arabic equivalents). Free-text guidance such as "successful purchase after an earlier declined attempt" imports normally. Caught in passing: the original Arabic alternatives were written with `\w*\b`, which never matched because `\w` and `\b` are ASCII-only — the new pattern drops both for the Arabic branch, and a test covers it.
2. **`resetToNow` keeps an open activity drill on the month being shown**, so tapping the Overview tab no longer leaves the Log on a different month than the dashboard. `chMonth` already did this.
3. **The Roadmap phase editor collapses to one column below 420px.** Root cause was `type="month"` inputs, whose wide intrinsic minimum stopped a `1fr 1fr` grid from shrinking; the new `.phase-grid` uses `minmax(0,1fr)` plus `min-width:0` and a single column at phone width.

Verification: **79/79 tests pass** (3 new import contracts, 2 new design contracts), `git diff --check` clean, no remote dependency, no storage-key/model-version/migration change. Live on an isolated origin at 390×844: the Roadmap overlay no longer scrolls sideways (was 400px inside 390px, now 390/390, grid single-column), a closed-month drill correctly follows the Overview tab back to the current month, and the importer blocks the declared markers while passing the prose. No overflow on any page or overlay in either theme, no console errors. Cache bumped to `finance-v10.4`, changelog added, docs regenerated.

### 2026-08-15 · Claude · consolidated backlog for Codex — fixes and enhancements after v10.3
Everything still open across v9.1 → v10.3, in priority order. No private data in this entry.

**Fixes**

1. **CSV importer blocks rows on free-text notes — medium.** `normalizeImportRow` (`index.html:960`) sets `blocked` when the **notes** column matches `/declin|reject|مرفوض|رفض/i`. Notes are review guidance, not transaction status, so a legitimate purchase annotated "after a declined attempt" is silently blocked and cannot be confirmed. Found live: two valid rows in a real catch-up file were blocked until the wording was changed. *Recommend:* derive `blocked` from the `type` column alone (or a dedicated status field) and drop the notes check; the row-level type test already covers genuine declined rows. Add a regression test asserting a row whose notes merely mention a failed attempt is importable.
2. **QA103-L1 — low.** An active Log drill does not follow the month change caused by tapping the Overview tab: `setTab("dashboard")` calls `resetToNow(false)`, which moves `state.currentMonth` without updating `activityDrill.month`. `chMonth` already syncs correctly. *Recommend:* sync in `resetToNow`, or clear the drill when the month resets.
3. **QA103-L2 — low, pre-existing since v8.** `fillPhaseEditor` (`index.html:2204`) uses a fixed `grid-template-columns:1fr 1fr`, which with card and overlay padding computes to 400px inside a 390px overlay, so the Roadmap editor scrolls sideways on a phone. Does not reproduce at 1280px. *Recommend:* single column below ~420px.

**Enhancements, highest value first**

4. **Teach the bank-SMS parser the transfer shape — high value.** `parseBankSMS` matches merchants via `لدى` and `to|إلى|الى`, but transfer messages use **`لـ`** (`… من <account> لـ AlinmaPay`) and carry **no balance line**. Amount and direction parse correctly; the merchant falls back to the raw first line. This is precisely the shape that caused two significant transfers to be missed from a catch-up import twice. Also verify the parser reads the timestamp printed inside the SMS, which the v9 spec makes authoritative. **The long-standing blocker "need a real bank SMS to tune the parser" is now resolved** — the owner has supplied 16 SMS screenshots plus 4 card-log screenshots covering every format his bank sends. That open question can be closed.
5. **Month-over-month spending trend** — an approved v9 requirement (financial-control-center spec §3.4) confirmed as missed rather than deferred, still unbuilt.
6. **"Update future reminders" control** — approved v9 requirement (§4.3), also confirmed missed, still unbuilt.
7. **Bespoke desktop layout.** The v10 spec deferred this to "v10.1", but that version number was consumed by the Budget badge fix, so the work has no home. The owner has confirmed he uses the app on a laptop; his displays are 1280×800 primary and 1920×1080 secondary.
8. **Per-device data split needs a product story.** `localStorage` is per-origin and per-device, so using the app on both phone and laptop creates two divergent datasets with no sync. Either make backup/restore the explicit transfer path with clear UI, or surface which device's data is being viewed.

**Product decisions still blocking work**

9. **L2** — should deleting a logged reminder entry restore a prior *rescheduled* date, or reopen on the reminder's natural date? Currently the record is deleted outright and the reschedule is lost.
10. **L3** — should "Next payment" mean the next natural occurrence or the next rescheduled due date? `nextOccurrence` now treats a rescheduled month as not-next, which was a behaviour change never written into a spec.
11. **iOS Shortcut `#b64=` storage test** — still unanswered: does Safari share `localStorage` with the installed home-screen PWA? Blocks the Shortcut intake path.

**Closed — stop tracking**

- The former example card digits: the owner has confirmed they were real, the history rewrite purged them, and the v10.3 privacy scan found **0 matches** in the working tree and in reachable `main` history. No further action.

### 2026-08-15 · Claude · POST-RELEASE QA of finance-v10.3 — **PASS with two low findings**
Reviewed commit `ca35acd0b48f39f2ce0879da3c7314a33800ded6`; `main` and `origin/main` both at that hash, working tree clean before this entry. Service-worker cache `finance-v10.3`; all seven cached assets present. **Automated suite: 74/74 pass** (`finance-core`, `import`, `release`, `design`). `git diff --check` clean. Live testing ran on a **new isolated origin, `http://localhost:8101`**, with **synthetic data only** — the owner's production storage was never read, copied or modified. **Nothing was committed or pushed; the only file changed by this review is this log.**

**Method.** Expected values were reasoned from the v10.3 design specification and computed independently in a separate harness; none were derived from production helpers. 47 of 49 independent assertions passed on first run — the two failures were **errors in my own harness** (I mis-stated the expense-plan base by including goal and debt-linked categories that the plan legitimately excludes; the production value of 3,800 was correct and the adjustment-independence being tested still held). All corrected assertions pass.

**Every finance-v10.2 finding is confirmed resolved:**

| v10.2 finding | Status | Evidence |
|---|---|---|
| Reconciliation counted as spending | **Resolved** | `entryDeltas` now has an explicit `balance_adjustment` zero branch. Verified for **both** a card and a loan adjustment: `actualSpending`, `availableWithinPlan`, `cashPaidSoFar`, `cashLeftNow`, `Spent this month` and every source row are all unaffected, while the debt ledger still records it — loan closing moved by exactly the adjustment amount. Live, the hero's "actual" and the `Spent this month` headline now read the same figure. |
| Public-history privacy exposure | **Resolved** | Privacy scan reports **0 matches** for the known private figures and **0 matches** for the former example card digits, both in the current tree and in reachable `main` history after the rewrite. `docs/design-reference/` has **0 commits** — never tracked. No sensitive pattern is reproduced in this log. |
| Goal drill mismatch | **Resolved** | One shared `classifyMoneyEntry` now serves the summary, source rows and all three drills. A legacy goal-category `type:"expense"` entry is classified as goal movement everywhere: counted in Moved to goals, present in the goal drill, absent from spending and from payment-source drills, and never double-counted. |
| Closed-month omission | **Resolved** | A previous month now renders its own Cash left now, After upcoming commitments, Spent this month with source rows, Debt payments and Moved to goals, alongside the historical banner. All values are month-specific — no retained current-month figures. Source rows drill into Log for the selected historical month. Returning to the current month restores current values. |
| Card-funded goal liquidity mismatch | **Resolved** | A card-funded legacy goal entry raises Moved to goals, leaves `cashLeftNow` untouched, leaves `cashPaidSoFar` at zero, and is carried in the card balance as a purchase. `cashLeftNow` equals `incomeReceived − cashPaidSoFar`, so no mismatch remains. Cash- and debit-funded goal contributions still reduce liquidity. |
| Filtered empty state | **Resolved** | A genuinely empty filtered result now reads "No matching transactions" with "Clear or adjust the active filters to see other activity", instead of the previous "No entries yet". |
| Drill month navigation | **Resolved for the month arrows** (see QA103-L1 for a remaining path) | Drilling on a closed month and pressing the month arrow moves the dashboard and the drill together, and the list re-scopes to the new month. |
| Negative source display | **Resolved** | Negative source totals now render with a real minus sign and remain visually identifiable as net refunds. |

**Findings — two low, neither caused by v10.3.**

**QA103-L1 · low · `index.html:1400-1411` (`setTab` → `resetToNow`) — an active drill does not follow the month change made by tapping the Overview tab.** `chMonth` correctly syncs `activityDrill.month`, but `setTab("dashboard")` calls `resetToNow(false)`, which changes `state.currentMonth` without touching the drill. *Repro:* move to a previous month, tap a source row to open its drill, then tap **Overview** in the bottom navigation, then tap **Log**. *Expected (spec, "Filters and presentation"):* changing the Overview month updates any active drill. *Actual:* Overview jumps to the current month while the drill chip and list remain on the previous month. *Financial impact:* none — every figure shown is correct and the chip states its own month accurately, so nothing is misread; it is a consistency gap only. *Recommendation:* set `activityDrill.month` inside `resetToNow` as well, or clear the drill when the selected month is reset.

**QA103-L2 · low · pre-existing since v8 · `index.html:2204` (`fillPhaseEditor`) — the Roadmap editor overflows its own overlay at 390px.** The phase fields use a fixed `grid-template-columns:1fr 1fr`, which together with card and overlay padding computes to a 400px content width inside a 390px overlay, making `.ovbody` horizontally scrollable by 10px. *Repro:* at 390×844 open Manage → Roadmap. *Expected:* no horizontal scrolling on a phone-width surface. *Actual:* the overlay body scrolls sideways by 10px; the page itself does not, so the document-level "no horizontal overflow" criterion still holds. *Financial impact:* none — presentation only. *Provenance:* the grid was last touched in `ddf98ee` (v8) and is untouched by v10.3; it surfaced now because this pass swept every overlay at 390px in both themes. It does not reproduce at 1280px. *Recommendation:* collapse to a single column below ~420px; backlog, not a corrective release.

**Regression summary — clear.** finance-v10 warm-modern design intact: zero horizontal overflow across 26 surface/theme combinations at 390×844 (five pages, the closed-month view and seven overlays, light and dark) apart from QA103-L2; at 1280×800 `#app`, `.nav`, the overlay and the sheet all measure 760px from a single `--app-max`; navigation remains exactly Overview / Log / Manage. finance-v10.1 badges render all four states (On track, Close, Over, Net refund) with zero `.budget-status.track` collisions and zero clipping. finance-v9.2 behaviour intact: a dangling logged occurrence is still repaired on migration, Skip still requires confirmation, mutates nothing before confirming and writes only the occurrence model with no legacy skip key. All five Log entry types render with a 47px amount field. Debt ledger arithmetic matched independent expectation exactly on both accounts across a month boundary, including opening balances carried from the prior month. CSV intake and review surfaces present. No console errors at any point. No storage-key, model-version or migration change in the v10.3 range; no external runtime dependency, CDN, font, analytics or network call anywhere in production.

**Verdict: PASS with two low findings. No corrective release required** — both findings are backlog items, one of them predating v10 entirely. finance-v10.3 resolves every v10.2 finding without regression.

### 2026-08-15 · Codex · finance-v10.3 QA corrections prepared; public history sanitized

Resolved Claude's finance-v10.2 findings with a shared money classifier. Statement reconciliations now have zero spending and liquidity impact; legacy goal-category expenses reconcile between cards, totals and drill-through; card-funded goal movement does not reduce current cash. Closed months now expose the same spending-source, liquidity, debt-payment and goal-movement views as the current month. Dashboard drill-through clears conflicting Log filters, follows month navigation and explains filtered empty states. Added focused regression coverage, stamped finance-v10.3 and updated the generated documentation. Separately rewrote reachable `main` history to remove the previously exposed private sample figures and former example digits, verified every sensitive pattern absent from all rewritten commits, and force-pushed the sanitized history before continuing feature work. Release commit: `74e927e`; 74/74 tests and phone-width current/closed-month QA passed with zero console errors.

### 2026-08-15 · Claude · POST-RELEASE QA through finance-v10.2 — **no blockers; 2 high, 2 medium, 4 low**
Review-only pass at `ae6b6bc`. Nothing committed or pushed; the only file changed is this log (plus the redaction noted below). Method: independent reference arithmetic written from the specification — **expected values were never derived from the production helpers** — plus a live walkthrough on a **new isolated origin** (`http://localhost:8100`, distinct from any earlier QA origin) using synthetic neutral data only. The owner's production `localStorage` was never read, copied or exposed.

**Release hygiene — all green.** `git status -sb` clean, `main...origin/main` in sync, HEAD `ae6b6bc`; expected commits `3cfcfa4`, `a306ac9`, `1d373e6`, `37464c9` all present. **70/70 tests pass.** `git diff --check` clean. `sw.js` is `finance-v10.2` and all seven cached assets exist on disk. No `http(s)://` URL, `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, external script, remote font or `@import` anywhere in the v10–v10.2 range. **No `modelVersion`, storage-key or migration change** across `1d373e6~1..ae6b6bc` — verified by diffing for those symbols and finding nothing. No console errors during the entire live walkthrough. `docs/design-reference/` is still untracked and has never been committed.

**Independent accounting verification: 49 of 52 assertions passed.** Two failures are real defects (QA-H1, QA-L1 below); the third was **an error in my own harness** — I expected a September obligation of 3,000 where an August occurrence rescheduled into September legitimately adds to September's own occurrence, so 6,000 is correct. Reschedule behaves correctly in both directions: the source month drops the obligation and the target month gains it.

**Verified correct (live figures matched my independent recomputation exactly):** headline `Spent this month` 625 with all six sources — Cash/bank 100, Debit −80, JOD cash 90, Other 60, Card Alpha 400, Card Beta 55 — summing exactly to 625; refunds subtracted from their own recorded source; a debit source going net negative; a refund-only card producing a negative total; unknown/legacy `paidWith` values and purchases on an unconfigured card both landing under Other with no stray source keys; `Debt payments` 700 (card 300 + loan 400) excluded from spending with no double count against the card purchase; `Moved to goals` 300 including a legacy goal-category expense; `Cash left now` 7,830 with credit-card purchases and card refunds correctly excluded from liquidity and card/loan payments correctly reducing it; cash and debit refunds increasing liquidity; prior-month entries fully isolated; `After upcoming commitments` breakdown reconciling exactly (7,830 − 2,300 obligations − 200 goal reservation = 5,330 displayed); open **card-funded** reminders correctly excluded from cash obligations; goal reservations released exactly once; logged, skipped and rescheduled occurrences all handled correctly; and the zero-income, negative-liquidity, no-transactions and no-configured-accounts edge states all behaving sanely.

**QA-H1 · high · `index.html` `entryDeltas` (~line 843 fallthrough) — a statement reconciliation counts as consumption spending.** `entryDeltas` has no `balance_adjustment` branch, so such an entry falls through to the expense return and yields `{spending: amount}`. *Repro:* configure a card, use Cards & loans → reconcile to create a `balance_adjustment` of 250, then open Overview for that month. *Expected:* both spending figures read 625. *Actual:* v10.2's `Spent this month` correctly reads **625 SAR** while the hero directly above reads "3,400 plan − **875** actual − 2,000 still planned" and the plan bar reads 875 — the 250 adjustment counted as spending. `availableWithinPlan` is understated by the same 250 (525 shown, 775 correct). *Affected formulas:* `entryDeltas` fallthrough → `monthMetrics.actualSpending` → `availableWithinPlan`, the `dSpent`/`dPlanW` plan bar, and `monthSpent(m)` which also feeds the closed-month "Total spent" row. For a **loan** reconciliation `cardId` is null, so `cash: amount` also inflates `cashPaidSoFar`, understating `cashAfterCommitments` and breaking the breakdown reconciliation. Pre-existing since v9 (`reconcileDebt` introduced it), but v10.2 is what makes it visible by showing a correct competing figure on the same screen. `catActual` returns 0 for adjustments, so Budget Health is unaffected.

**QA-H2 · high · privacy · this log published the figures it was warning about.** The MF1 finding I wrote on 2026-08-14 quoted five of the real amounts verbatim in order to warn that `docs/design-reference/` must not be committed. The design-reference files were correctly kept out of git — but `COLLAB-LOG.md` was committed and pushed, so those amounts are now in public history. *Repro:* inspect `COLLAB-LOG.md` in commit `3cfcfa4` for the former MF1 paragraph. *Expected:* a privacy finding describes the class of data without reproducing it. *Actual:* five real figures published. **This is my error, not Codex's.** I have redacted them from the working copy of this log (the only file change in this pass); HEAD will be clean once Codex commits. Whether the published history needs rewriting is the same open decision as the former example digits — both now sit in public history and should be settled together.

**QA-M1 · medium · `index.html` `renderEntries` `drillMatch` vs `monthlyMoneySummary` — a drill-through disagrees with the row that opened it.** `drillMatch` for a spending drill accepts any `expense`/`refund` with a matching source, but `monthlyMoneySummary` reclassifies expenses in goal categories as goal movement. *Repro:* log a 100 expense in the House savings category paid from cash, alongside a 150 cash purchase and a 50 cash refund. *Expected:* the drill contents reconcile to the row. *Actual:* the Cash/bank row shows 100 (150 − 50) while its drill lists three entries including the 100 goal expense; conversely `Moved to goals` shows 300 but its drill lists only the 200 `type:"goal"` entry. *Why it matters:* v7-era house-savings contributions are exactly this shape, so the owner's real data very likely contains them.

**QA-M2 · medium · `index.html` `renderDashboard` lines 1409–1423 — closed months hide every v10.2 figure, and the spec promises otherwise.** `#overview-money` and `#overview-cash` are children of `#dashCurrent`, which is set to `display:none` for any non-current month, and the function `return`s before writing a single v10.2 value. *Repro:* switch the month selector back one month. *Expected (design spec §4):* "Existing month navigation scopes every figure and drill-through consistently." *Actual:* the closed month shows only Total spent / Income received / Into house fund / Flexible spend — no `Spent this month`, no source rows, no `Debt payments`, no `Moved to goals`, no `Cash left now`, and the promised drill-through is unreachable. The hidden DOM also retains **stale current-month values** (625 while the closed month's correct figure is 777). *Answering the owner's question:* the accounting layer is not at fault — `monthlyMoneySummary(state, month)` is fully month-parameterised and returns the correct 777 / 8,223 for the closed month. This is a **specification defect**: §4's promise was never reconcilable with the pre-existing closed-month layout, and neither the spec nor the implementation plan addresses the conflict. Either extend the closed-month view or narrow §4 to the current month.

**QA-L1 · low · card-funded goal contributions disagree between the two liquidity paths.** `monthlyMoneySummary` always subtracts goal movement from `cashLeftNow`; `monthMetrics` excludes it when card-funded (`if(!cardId)`). *Repro:* a 300 goal-category expense paid with a credit card plus 1,000 income → `cashLeftNow` 700 but `incomeReceived − cashPaidSoFar` 1,000, so the breakdown line no longer reconciles to the displayed `After upcoming commitments`. `monthMetrics` is the correct one: a card purchase does not move cash now.

**QA-L2 · low · misleading empty state under an active drill.** Combining a drill with a contradictory type filter (Moved to goals + type Income) renders "No entries yet — Log your first purchase above, or paste a bank SMS…", as though the log were empty, while the drill chip is still visible above it. Filters are silently contradictory rather than explained.

**QA-L3 · low · the drill does not follow month navigation.** Drill into Aug · Cash/bank, then press the month-back arrow: Overview moves to Jul 2026 while the chip still reads "Aug 2026 · Cash / bank" and the list still shows August rows. Same §4 consistency promise as QA-M2.

**QA-L4 · low · presentational · a negative source reads "+ refund 80 SAR".** The magnitude is right and direction is carried by the word plus positive ink, but with no minus sign the source rows cannot be visually summed to the headline, which the design spec §2 requires ("must add up exactly").

**finance-v10.1 regression — fully clear.** All four Budget states render: Over, On track, Close, Net refund. The modifier is `on-track`; **zero** elements match `.budget-status.track`, so the 6px progress-track collision is gone. Every badge is 23px tall, 44–78px wide, unclipped, in both themes. Light pairs: Over `#872a1e` on `#fae9e5`, On track / Net refund `#1f5c43` on `#e8f2ec`, Close `#754405` on `#fbeedb`. Dark pairs use the `*-ink` on `*-soft` combinations measured at 7.5–8.5:1 in the earlier palette review. No clipping, collapse or overlap at 390×844.

**finance-v10 visual and usability regression — clear.** Zero horizontal overflow and zero elements exceeding the viewport at **390×844**, **640×400**, **1280×720** and **1920×1080**, in both themes, across all five pages, seven overlays, all five Log entry types and both bottom sheets. The four shells share one token: at 1920 `#app`, `.nav`, the overlay and the sheet all measure exactly **760px** with `--app-max: 760px` — the M6 fix from the spec review is confirmed in production. Bottom navigation is exactly Overview / Log / Manage at every width. A deliberately hostile case (a 40-character card name with a 1,234,567.89 figure) wrapped to 61px without clipping and kept its ≥44px target. Deleting an entry while a drill was active refreshed both the filtered list and the Overview headline correctly (1,235,253 → 1,235,103, exactly the deleted 150). Clear removes the drill and restores full all-history activity; the drill chip stays visible rather than hiding, and does not survive a reload.

**Verdict: no blockers. finance-v10.2's own accounting is correct** — every formula in the review scope matched independent recomputation. QA-H1 is a pre-existing v9 defect that v10.2 has exposed rather than caused, and it is the one that misstates a headline figure the owner acts on. QA-H2 is mine to own. Recommended order: QA-H1, then the QA-H2 history decision alongside the former example digits, then QA-M1 and QA-M2.

### 2026-08-14 · Codex · finance-v10.2 monthly spending and liquidity implemented (`3cfcfa4`)
Added a tested monthly money summary that nets refunds against their recorded sources, keeps card/loan payments and goal contributions separate from consumption spending, and derives current liquidity without treating card purchases as bank outflow. Overview now presents Cash left now, After upcoming commitments, source-level spending, Debt payments and Moved to goals; each money row opens a clearable selected-month Log drill-through. No migration or stored-data rewrite.

### 2026-08-14 · Codex · finance-v10.1 Budget badge collision fixed (`a306ac9`)
The Budget Health On track modifier was named `track`, colliding with the global 6px progress-track class and collapsing the badge exactly as shown on the owner's phone. Renamed the modifier to `on-track`, added a regression contract, and bumped the offline cache to `finance-v10.1`. No formula, storage, migration or data-model change.

### 2026-08-14 · Codex · finance-v10 release committed (`1d373e6`)
Committed the complete Direction 1d Warm Modern Finance redesign after 66/66 tests, clean diff check, dependency/privacy scans and isolated responsive/theme browser QA. The owner explicitly approved publishing before Claude's final review; Claude may perform post-release QA later. No formula, storage-key, migration or model-version change. Release cache: `finance-v10`.

### 2026-08-14 · Codex · v10 Task 10 release candidate verified (WIP checkpoint)
Bumped the offline cache to `finance-v10`, added the v10 changelog, regenerated documentation and redrew the `index.html` map. Complete automated verification passes 66/66; `git diff --check` is clean; runtime dependency scan is empty; focused privacy scan found no listed personal names, banks, former card digits or known real figures; finance-core fixture outputs remain protected by all 23 finance tests. Live isolated-origin QA found no console warnings/errors, phone/laptop/zoom-equivalent overflow, shell-width or theme-token defects. Task 9 checkpoint: `f5236fc`.

### 2026-08-14 · Codex · v10 Task 9 responsive/accessibility GREEN (WIP checkpoint)
Completed responsive/theme/accessibility hardening. Live local checks used isolated test origins: 390×844 showed 390px shell alignment, no horizontal overflow and no sub-44px visible targets; 1280×800 showed one centered 760px shell; a 640×400 zoom-equivalent viewport had no overflow. Explicit light/dark audits returned the approved backgrounds, accents and dark `--on-accent`. Added laptop breathing room without a bespoke desktop layout. Full automated suite passes 66/66 and `git diff --check` is clean. Task 8 checkpoint: `db0d49c`.

### 2026-08-14 · Codex · v10 Task 8 Manage/CSV/data safety GREEN (WIP checkpoint)
Restyled Manage as exactly seven direct plan routes with local SVG icons and kept backup/restore/reset in a distinct data-safety section. CSV rows now communicate ready, review, duplicate and blocked states with semantic borders and actionable AA error text; native disabled confirmation and account-hint-only semantics remain intact. Import/design/release tests pass at 42/42. Task 7 checkpoint: `df6d407`.

### 2026-08-14 · Codex · v10 Task 7 Budget/Goals/debt GREEN (WIP checkpoint)
Unified Budget Health, Goals, commitments and debt details with the warm-modern sections and rows. Budget now displays explicit On track, Close, Over and Net refund states; negative actuals use an empty bar and returned amount. Debt keeps the complete opening/purchases/refunds/payments/reconciliation/closing equation and payoff projection. Design/finance tests pass at 39/39. Task 6 checkpoint: `5855f20`.

### 2026-08-14 · Codex · v10 Task 6 planned payments GREEN (WIP checkpoint)
Added one `refreshPlannedViews` path for dashboard and an already-open View-all overlay, removing the stale-list behavior after reminder mutations. Restyled occurrence rows/actions with explicit 44px Log, Reschedule and Skip targets. Skip confirmation and finance-v9.2 occurrence semantics remain unchanged. Design and reminder/finance tests pass at 37/37. Task 5 checkpoint: `202d74a`.

### 2026-08-14 · Codex · v10 Task 5 Unified Log GREEN (WIP checkpoint)
Restyled the five-type Unified Log as an amount-first form with larger managed fields, a stable primary save action, semantic effect area, clearer offline SMS/CSV intake and scan-friendly activity filters. All existing IDs, handlers, selectors and entry behavior remain intact. The finance/design/release subset passes at 42/42. Task 4 checkpoint: `af540c7`.

### 2026-08-14 · Codex · v10 Task 4 Overview GREEN (WIP checkpoint)
Recomposed Overview around the approved Direction 1d / hero 2a decision order: month, Available within plan, Cash after commitments, planned-payment attention, Budget health, spending mix, debt/goals and activity. Added the spent-versus-plan bar without the rejected elapsed-time alarm. Design contracts and finance-core tests pass; no formulas or stored data changed. Task 3 checkpoint: `9b21817`.

### 2026-08-14 · Codex · v10 Task 3 icons/onboarding GREEN (WIP checkpoint)
Added one dependency-free inline SVG icon registry for structural actions, removed structural emoji from first run, and corrected onboarding to describe reminders as manual log/reschedule/skip actions. The new contracts pass; the complete suite remains green at 55/55. Task 2 checkpoint: `73a598e`.

### 2026-08-14 · Codex · v10 Task 2 tokens/shell GREEN (uncommitted checkpoint candidate)
Replaced the legacy visual variables with the approved Direction 1d light/dark system while retaining compatibility aliases for existing markup. Added `--on-accent`, disabled ink, corrected warning/chart tokens, one `--app-max` across all four shells, 44px amount input, shared component primitives, focus/disabled/reduced-motion behavior and laptop usability widening. The six design contracts now pass alongside release checks. Task 1 RED contract checkpoint: `d779b97`.

### 2026-08-14 · Codex · pre-execution v10 review addressed (uncommitted)
Moved the raw design-reference package out of the public repo to `C:\Users\USER\Downloads\finance-tracker-design-reference\` and repointed the spec/plan. Locked three decisions: production uses the native system stack rather than bundling Manrope; the false-positive straight-line pace status is deliberately dropped; Overview and Log have direct design references while the other surfaces are rule-governed extrapolations. Revised execution to a local unpushed `v10-wip` branch with one tested checkpoint commit per task, followed by restoration of one uncommitted aggregate diff for Claude QA. Clarified that CSV blocking reasons use actionable AA text, not disabled ink. No production code changed.

### 2026-08-14 · Codex · finance-v10 implementation plan prepared (uncommitted)
Added `docs/superpowers/plans/2026-08-14-warm-modern-finance-v10-implementation.md`. The plan uses test-first vertical slices for contracts/tokens, icons/onboarding/navigation, Overview, Log/activity/SMS, planned payments, Budget/Goals/debts, Manage/CSV/data safety, responsive/accessibility hardening and release verification. It includes the complete final Claude QA prompt and explicitly prohibits staging, commit or push until QA and owner review.

### 2026-08-14 · Claude · v10 plan review + design-fidelity check — **inline execution endorsed; 2 must-fix, 3 owner decisions**
Reviewed `docs/superpowers/plans/2026-08-14-warm-modern-finance-v10-implementation.md`, the revised spec, and — now that they exist locally — `docs/design-reference/HANDOFF.md`, `DECISIONS.md` and the Direction 1d board. This closes checks 1, 6, 7 and 15 that were unverifiable in the previous review.

**Spec revisions verified by recomputation:** `--on-accent` `#ffffff` / `#0d2226`, `--text-3 #666057`, `--accent-3 #5f9199`, `--text-disabled` both themes, `--app-max` consumed by `#app`/`.nav`/`.overlay`/`.sheetwrap`, first-run and SMS intake in scope, embedded contrast table, observable acceptance criteria, decimal-size boundary. All of H1, M1–M6 and L1–L3 addressed.

**Design fidelity — the spec is faithful to Direction 1d where it matters.** Hero 2a matches the package exactly (light warm surface, 4px accent top edge, teal figure, spent-versus-planned bar). The Overview order matches the package's composition line including "two budget rows then View all". The type scale is reproduced exactly (42/28/23/17.5/16/14.5/14.5/13.5), and the −0.03em hero tracking is precisely what the package prescribes when the system fallback is used. Petrol-teal identity retained; neither 1b's green nor 1c's indigo survives, and the five-tint spending bar is correctly cut to three teals plus ochre. Laptop deferral matches: the package's 1180px two-column, top-bar, 52px-hero design is held for v10.1. Token divergences from the package (`#a4620c`→`#9c5d0b`, `#6d675e`→`#666057`, `#7aa9b0`→`#5f9199`) are all the accessibility corrections from the previous review, not drift.

**MF1 · must-fix before implementation · privacy — the plan makes a folder of real financial data a repo baseline.** Global Constraint line 13 names all three files in `docs/design-reference/` as the design baseline, and line 22 protects only *screenshots*. Those three files carry **92 money figures** — income, actual spending, cash paid and obligations, with irregular decimals that read as the owner's real position for a specific month rather than samples. (Figures redacted from this log on 2026-08-15: quoting them here published the very values the finding was about. See QA-P1 in the finance-v10.2 review entry.) The folder is currently untracked but sits *inside* the repo, so any `git add -A` captures it, and Task 10 Step 5 only scans at the very end. *Recommend:* resolve now — either move `docs/design-reference/` outside the repo and repoint Global Constraint 13 at the external path, or scrub every figure to neutral placeholders before Task 1 begins.

**MF2 · must-fix before implementation · no checkpoints across ten tasks in one 2,200-line file.** Global Constraint line 23 forbids committing during Tasks 1–10, so the entire redesign accumulates as a single uncommitted blob in `index.html`. If Task 7 breaks something introduced in Task 3 there is nothing to bisect against, and the plan's own goal of "reviewable units" has no unit boundary in version control. *Recommend:* work on a `v10-wip` branch with one WIP commit per completed task, squashed into the release commit at the end — the owner still reviews one final diff, and nothing is pushed. Minimum alternative: a copy of `index.html` per completed task, stored outside the repo.

**D1 · owner decision · the approved typography is Manrope; the spec ships the fallback.** HANDOFF.md §"Production font" recommends bundling Manrope as a self-hosted woff2 Latin subset (~22 KB across 400/600/700/800), precached by the service worker, with the system stack as the explicit zero-dependency fallback. The spec mandates the fallback. Self-hosting would **not** breach the no-CDN/no-remote rule — it is same-origin and precacheable, like the existing icons and CSV template — but it does add a binary asset to a self-contained app. This is the difference between the design as approved and a near-neighbour, and typography is much of what makes the direction read as "modern". *Recommend:* the owner chooses explicitly, and the choice is recorded in the spec so QA does not read it as drift.

**D2 · owner decision · the package treats spent-versus-elapsed pacing as approved; the plan drops it.** DECISIONS item 1 specifies a "today" rule at elapsed position with the hero status word derived from spent-versus-elapsed — "more than ten points ahead → Spending fast". Paying rent on day 1 puts every month far ahead of elapsed time, so that hero would read "Spending fast" on the 2nd of every month. Spec §7.1 and plan Task 4 Step 3 correctly refuse to implement it. *Recommend:* the owner confirms this approved decision is being dropped, so it is a decision rather than an omission discovered at QA.

**D3 · owner decision / expectation · only 1 of 13 screens is actually designed.** HANDOFF.md line 4: "Screen 1 of 13 (Unified Log form) is ready for implementation handoff. The remaining twelve follow the priority order in §7." So for twelve of thirteen screens there is no pixel-level design — Codex will extrapolate from the token and component rules. That is workable, but at the QA gate I can only verify *rule compliance* for those twelve, not design fidelity, and the risk of "this isn't what I approved" lands at the end. *Recommend:* either accept rule-based extrapolation explicitly, or have the package's remaining screens designed for the highest-value surfaces (Overview first) before Task 4.

**Low findings:** (a) the package sets headline decimals at 62% opacity while the spec correctly forbids opacity and uses a token — the spec is right, but record it as a deliberate override; (b) the package's primary actions are 48–50px while the spec sets only a 44px floor — consider stating 48px as the target for primary actions; (c) plan task line references (`index.html:19-216`, `241-329`, …) will drift as earlier tasks change line counts — treat them as symbol anchors; (d) the spec's dark `--on-accent` table under-reports: measured against `#0d2226` the positive/warning/exceeded values are **7.45 / 7.68 / 6.44**, not 7.12/7.34/6.15 (those were the figures for the `#10262a` candidate); (e) Task 8 Step 3 applies `--text-disabled` to the CSV confirmation area — the *blocking reason* text is information the user must act on and measures only 3.35:1 on `--surface-3`, so it should use `--text-2`, with `--text-disabled` reserved for the control label itself.

**Execution mode: inline is correct.** Ten tasks all mutating one 2,200-line file cannot be parallelised without collisions; subagents would need a merge strategy no plan here defines. Endorse option 1.

### 2026-08-14 · Codex · Claude v10 spec review addressed; design baseline imported (uncommitted)
Addressed H1, M1–M6 and L1–L3 in the v10 specification: added accessible filled-control ink, corrected tertiary and chart tokens, explicit disabled ink, mandatory soft-surface borders and chart separators, the measured contrast table, first-run and SMS intake scope, one `--app-max` shell token, a decimal-size boundary and observable acceptance criteria. Imported the final public-safe `HANDOFF.md`, `DECISIONS.md` and Direction 1d HTML board into `docs/design-reference/` so implementation QA can verify actual design fidelity. No production code changed.

### 2026-08-14 · Codex · finance-v10 Direction 1d specification written (uncommitted)
Added `docs/superpowers/specs/2026-08-14-warm-modern-finance-v10-design.md` for owner and Claude review. It codifies the approved Warm Modern Finance direction, corrected warning color, complete light/dark token systems, typography, spacing, icon inventory, mobile-first component and screen rules, 1280px laptop-usability boundary, accessibility, privacy, regression matrix and pre-commit Claude QA gate. No production code or finance behavior changed. An implementation plan will be written only after the specification is approved.

### 2026-08-14 · Claude · v10 "Warm Modern Finance" spec review — **1 high, 6 medium, 3 low; 4 checks unverifiable**
Reviewed `docs/superpowers/specs/2026-08-14-warm-modern-finance-v10-design.md` (uncommitted). Specification review only; no files edited — every finding needs a Codex decision, and the spec is Codex's document. Contrast computed independently from the token values, not taken on trust.

**Confirmed good:** warning correction verified at 4.84:1 on `--bg` and 5.27:1 on white · L2/L3 explicitly protected (§9, §19) rather than silently changed · no formula, migration, storage-key or model change anywhere in scope (§2, §16, §17 financial-regression matrix) · all five Log types and managed-only selectors (§8) · Budget Health covers On track / Close / Over / Net refund (§10) · the stale View-all overlay from the v9.2 QA is now an explicit requirement (§9 line 222) · CSV account-safe flow preserved as restyle-only (§12) · laptop correctly limited to usability with bespoke desktop deferred to v10.1 (§3 line 48, §14) — and the two target widths match the owner's actual hardware (1280×800 primary, 1920×1080 secondary) · privacy constraints present (§2 lines 25–26, §16 line 361) · mobile 390×844, 16px gutter, 44px floor.

**CANNOT VERIFY — checks 1, 6, 7 and 15.** `HANDOFF.md`, `DECISIONS.md` and the Direction 1d design package **do not exist anywhere on this machine** (searched `Downloads` to depth 3; only the old v8 `finance-tracker-design\` package is present). So fidelity to Direction 1d versus drift back toward 1b/1c, hero 2a fidelity, the approved type/spacing/radii rhythm and the icon inventory's completeness **were not verified — only internal consistency was**. This is the unmet condition raised earlier: the design package must land in `docs/superpowers/specs/` for the QA gate to mean anything.

**H1 · high · §4.2 (dark tokens, lines 82–104) — the dark theme has no ink for filled controls, and both obvious choices fail.** `--accent` in dark is `#73b3bd`, a *light* colour. White on it is **2.36:1** and the theme's own `--text #f5f1ea` is **2.09:1**; `--accent-hi #91c8d0` is worse at 1.85. `--accent-ink` is defined only as "text on accent-soft", so the dark primary button's label colour is simply undefined. Same for `--pos` / `--warn` / `--bad` fills (white = 2.15:1). *Why it matters:* the primary action on every screen fails AA in dark mode, and it is not a value anyone can eyeball. *Recommended wording:* add a per-theme token — `--on-accent: #ffffff` in light (8.98:1) and `--on-accent: #0d2226` in dark, which measures **7.00:1 on `--accent`, 8.93:1 on `--accent-hi`, 7.12 on `--pos`, 7.34 on `--warn`, 6.15 on `--bad`** — one token covers all four fills. State that no filled control may use `--text` or `#ffffff` as its label colour in dark.

**M1 · medium · §4.1 line 65 + line 60 — `--text-3` on `--surface-3` is 4.42:1, below AA.** Tertiary text is defined as "Hints; never opacity-reduced" and `--surface-3` as "Disabled and pressed surfaces". Disabled is exempt, but pressed states and group backgrounds are not. *Recommended:* darken `--text-3` to `#666057` — **4.91:1 on `--surface-3`**, 5.72 on `--bg`, 6.22 on white — or forbid `--text-3` on `--surface-3` in the spec.

**M2 · medium · §4.1 lines 68–75 — the four "soft" status surfaces are invisible against the page.** `--accent-soft` 1.08:1, `--pos-soft` 1.05, `--warn-soft` 1.05, `--bad-soft` 1.08 versus `--bg` (dark: 1.33–1.49). *Why it matters:* the spec's status model puts warning and exceeded panels on these surfaces, so the *region* is identified by its ink colour alone — the same trap §10 and §15 forbid for status. *Recommended:* extend the rule already written for `--surface-warm` ("border remains required") to every soft surface: a 1px border in the matching ink family is mandatory on any soft-surface region.

**M3 · medium · §4.1 line 76 + §7.2 line 190 — the spending-mix tints are not distinguishable.** `--accent-3 #7aa9b0` is **2.58:1** against white, below the 3:1 for meaningful graphics, and adjacent pairs are worse: `--accent-2` vs `--accent-3` **1.76:1**, `--accent` vs `--accent-2` **1.98:1**. Widening the ramp cannot fix this — three steps at 3:1 apart need roughly a 9:1 spread, which one teal family on white cannot hold. *Recommended:* (a) require a 1–2px page-coloured gap between adjacent segments, which satisfies 1.4.11 by separation rather than colour, and (b) darken `--accent-3` to `#5f9199` (**3.50:1** vs white) so a lone segment still reads. Keep the existing always-show-labels rule.

**M4 · medium · §4.2 line 105 vs §20.3 line 423 — an acceptance criterion that points at a document that does not exist.** The spec defers its own contrast verification ("a documented contrast table must verify all combinations") while §20.3 makes "meet documented contrast requirements" a gate. *Recommended:* paste the measured table below into §4 and have §20.3 cite it, so the gate is checkable.

**M5 · medium · §3 lines 32–46, §14, §17 — two live production surfaces are missing from scope.** (a) The **first-run / onboarding screen** (`index.html` ~220–240, which also carries the restore path) — it is a full screen, not an overlay, so §3 item 14 does not cover it; a fresh install's first impression would keep the old styling. (b) The **bank-SMS intake** — paste field, clipboard button and `#b64=` deep-link handling (~2063–2149) — §3 item 9 names CSV only, yet SMS is a primary intake path. *Recommended:* add both to §3, to §14's mobile checks and to §17's manual matrix.

**M6 · medium · §14 line 338 — "no fixed 430px limitation" understates the coupling and invites a broken shell.** Production carries `max-width:430px` on **four** rules: `#app`, `.nav`, `.overlay` and `.sheetwrap`. Changing only `#app` leaves the fixed bottom navigation, overlays and bottom sheets pinned at 430px while content widens — they visually desync at 1280px. *Recommended:* name all four and require a single `--app-max` custom property that every one of them consumes, so the shell can never drift.

**L1 · low · §20.2 line 422 — untestable acceptance criterion.** "The app feels warm, personal and professional rather than robotic or institutional" cannot pass or fail a gate. *Recommended:* move it to §1 as the objective, and replace it in §20 with observable criteria — no structural emoji remain, every surface consumes tokens, no more than three consecutive carded regions, system font stack only.

**L2 · low · §4.1/§4.2 — no disabled *text* token.** `--surface-3` is named as the disabled surface and §4.2 exempts disabled from 4.5:1, but no disabled ink exists, so implementation will improvise. *Recommended:* add `--text-disabled` per theme and require a non-colour affordance (reduced control, explicit label, or `aria-disabled` plus a visible cue).

**L3 · low · §5 line 139 — "0.64× the integer size" needs a floor.** At the 42px hero it yields ~27px and at the 28px secondary figure ~18px, both fine — but applied to a 16px row amount it would breach the 13.5px minimum. *Recommended:* state that the reduced decimal applies only to hero and secondary figures, never to row amounts.

**Measured contrast table — for pasting into §4** (computed from the spec's own token values; ✗ marks the values the findings above address):

| Pair | Light | Dark |
|---|---|---|
| `--text` on bg / surface / warm / s2 / s3 | 14.76 / 16.06 / 15.65 / 13.88 / 12.67 | 15.85 / 14.09 / 13.42 / 12.20 / 10.59 |
| `--text-2` on bg / surface / s3 | 6.68 / 7.27 / 5.74 | 10.19 / 9.06 / 6.81 |
| `--text-3` on bg / surface / s3 | 5.14 / 5.60 / **4.42 ✗** | 7.21 / 6.41 / 4.82 |
| `--accent` as text on bg / surface | 8.25 / 8.98 | 7.57 / 6.73 |
| `--pos` / `--warn` / `--bad` as text on bg | 5.24 / 4.84 / 5.54 | 8.06 / 8.31 / 6.97 |
| each `*-ink` on its own `*-soft` | 9.46 / 6.87 / 7.10 / 7.50 | 8.49 / 8.49 / 8.17 / 7.52 |
| `#ffffff` on `--accent` / `--accent-hi` | 8.98 / 11.64 | **2.36 ✗ / 1.85 ✗** |
| soft status surface vs bg | **1.05–1.08 ✗** | **1.33–1.49 ✗** |
| `--border` vs surface (card definition) | 1.30 | 1.50 |
| focus ring `--accent` vs bg / accent-soft | 8.25 / 7.61 | 7.57 / 5.09 |
| chart `--accent-2` / `--accent-3` vs white | 4.54 / **2.58 ✗** | — |
| adjacent chart tints (accent↔a2, a2↔a3) | **1.98 ✗ / 1.76 ✗** | — |

**Verdict: approve the specification once H1 and M1–M6 are addressed.** No blockers — nothing here threatens finance correctness, and the release-scope discipline is right. H1 must be fixed in the spec, not discovered during implementation. The design package (checks 1/6/7/15) still needs to land before the implementation QA gate can verify design fidelity.

### 2026-08-14 · Codex · finance-v9.2 committed — `9c2bda6`
Committed the QA-approved reminder occurrence integrity release, including Claude's pending copy/documentation handoff, the rebuilt agent source map, shared collaboration log, specs/plans, fixture and regression coverage. The release passed 47/47 tests, live phone-width QA by Claude, and final post-QA verification. This commit is local only; nothing has been pushed.

### 2026-08-14 · Codex · Claude finance-v9.2 QA dispositions — included in `9c2bda6`
Accepted the QA pass. Resolved L1 conservatively without waiting on the history question: the release test now rejects any four-digit `card ending` hint other than the deliberately fake `0000`, so the former literal no longer exists in executable code. L2 (preserving a rescheduled date after log/delete) and L3 (the meaning of next payment for a rescheduled occurrence) are deferred as explicit reminder-behavior decisions; L4 (44px amount input) and the stale View-all list are assigned to the finance-v10 redesign. No financial runtime behavior changed in this disposition.

### 2026-08-14 · Claude · QA PASS on the uncommitted finance-v9.2 working tree — **no blockers, 4 low findings**
Verified against `docs/superpowers/specs/2026-08-14-reminder-occurrence-integrity-design.md`, its implementation plan, `AGENTS.md` and this log. Scope reviewed: correctness only, not the Direction 1d redesign. Nothing committed, pushed, or corrected — the four findings are all judgement calls that belong to Codex, so no files were edited in this pass.

**Verification method.** Static review of the complete working-tree diff plus a live run of the app served from `http://localhost:8099` at 390×844 (a temporary local static server outside the repo; its `localStorage` origin is isolated from the production github.io app, so no real data was touched). Live state was a synthetic neutral fixture, including one deliberately dangling `logged` occurrence.

**Results — all 16 required checks pass:**
1. **47/47 tests pass** (`finance-core`, `import`, `release`). `git diff --check` clean.
2. **Legacy fulfilling entries resolve `logged` without a record.** `resolveOccurrence` checks for a fulfilling entry *first*, before any record inspection — the amendment landed correctly. Live: a v8-style entry with `recurringId` and no occurrence record resolved `logged`, `actualSpending` counted it once and `plannedSpendingRemaining` did not. No historical double-count.
3. **Dangling repair works and persists.** Seeded `card-rem:2026-08 = {logged, entryId:"DELETED-ENTRY-ID"}`; after load the record was gone from both memory *and* `localStorage`, the occurrence resolved `upcoming`, and Card payment reappeared as Overdue. Idempotence covered by test and by inspection of all three repair branches (backfill / legacy-skip→skipped / delete).
4. **Repair sits inside the recovery boundary.** `migrate()` sends `modelVersion>=8` through `normalize9` → `migrateV9` → `repairOccurrenceState`, so **already-v9 devices are repaired** — the only ones that carry the corruption. `load()` wraps the whole chain in try/catch, sets `migrationRecovery=raw` on throw, and `save()` refuses to write while that flag is set, with a user-facing alert at boot. A partial overwrite is not reachable.
5. **Delete reopens the obligation.** Live: deleting `e-rent` removed the entry, deleted the occurrence record, wrote no skip key, resolved `upcoming`, returned Rent to the planned list as Overdue, and moved `plannedSpendingRemaining` 800 → 3800 with `actualSpending` 4600 → 1600. Persisted correctly.
6. **Skip is separate and confirmed.** `skipReminder` now opens `sh-skip` and mutates nothing until `confirmSkip`; verified state unchanged before confirmation. `confirmSkip` writes `occurrences` only — `state.skips` stayed empty — the sheet closes, and the obligation leaves the plan (3800 → 3000). `.sheetwrap` z-index 50 sits above `.overlay` 40, so the confirmation is visible when raised from the "View all" overlay.
7. **Shared resolver used consistently** by `monthMetrics`, `plannedOccurrenceRows` and `nextOccurrence`; no consumer combines `occurrences`/`skips`/entries independently any more.
8. **No unrelated financial calculation changed.** All nine `monthMetrics` outputs recomputed by hand against the fixture and matched exactly (spendingPlan 6300, actualSpending 4600, plannedSpendingRemaining 800, availableWithinPlan 900, incomeReceived 12000, cashPaidSoFar 7000, cashObligationsLeft 1700, reservedForGoals 0, cashAfterCommitments 3300). Goal-category and debt-linked-category exclusions, card-vs-cash routing and refund handling all behave as before.
9. **Stale surfaces gone.** Manage renders 7 rows with no title-string filter: Planned payments · Budget health · Goals & commitments · Income plan & house goal · Budgets · Categories · Cards & loans. Rendered DOM contains no "Auto-posts", "Recurring items" or "posts automatically".
10. `0000` absent from `examples/finance-import-template.csv` and `tests/import.test.mjs` — see finding L1 for the one remaining occurrence.
11. **No remote dependency:** zero `http(s)://` URLs in `index.html`, and no `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, external `<script src>`, remote `<link href>` or `@import`.
13. **390×844, light and dark:** no horizontal overflow and no element exceeding the viewport on Overview, Log or Manage in either theme.
14. **No console errors** on load or during the delete/skip flows.
15. `sw.js` is `finance-v9.2` and caches `./`, index.html, manifest, all three icons and the CSV template.
16. Full diff reviewed: `index.html`, `sw.js`, `DOCUMENTATION.md` (v9.2 + inherited v9.1 changelog rows, `skips` now documented as read-only legacy), `AGENTS.md` (map rebuilt to the 2,223-line file), `examples/…csv`, all three test files, plus new untracked spec, plan and `tests/fixtures/v9-dangling.json`.

**Findings — no blockers, no highs.**

**L1 · low · `tests/release.test.mjs:27` — `0000` still exists in an executable test.** The literal survives as `assert.doesNotMatch(csv,/0000/)`. *Expected:* acceptance criterion 8 says the digits exist in no executable test. *Actual:* they exist as a negative assertion. That is a defensible regression guard, but if the digits are real they remain published. *Recommend:* either amend criterion 8 to allow the guard, or make it generic — e.g. assert no card hint other than `0000` appears: `assert.doesNotMatch(csv,/card ending (?!0000)\d{4}/)`. Blocked on the owner's answer about whether `0000` was real.

**L2 · low · `index.html` `reopenOccurrenceForDeletedEntry` — a reopened occurrence loses a prior reschedule.** *Repro:* reschedule an occurrence from Aug to Sep 5 → Log it (the save overwrites the record with `logged`, dropping `to`) → delete that entry. *Expected:* the occurrence reopens on its rescheduled date. *Actual:* the record is deleted outright, so it reopens on the reminder's natural Aug date as Overdue. *Recommend:* preserve `to` when the logged record replaces a rescheduled one and restore `{status:"rescheduled",to}` on reopen — or accept and document. No money is mis-stated either way.

**L3 · low · `index.html` `nextOccurrence` — undocumented behaviour drift.** It now requires `resolveOccurrence(...).status==="upcoming"`, so a **rescheduled** month no longer counts as the next occurrence; previously it did. The displayed "next payment" therefore skips to the following natural month instead of the rescheduled date. Not in the spec; arguably an improvement, but it should be a deliberate decision.

**L4 · low · pre-existing · `index.html` `input#eAmt` — 35px tall, below the 44px minimum.** Measured at 390px width on the Log form. Not introduced by this release (the Log markup is untouched in this diff), but it is the most-used field in the app and the Direction 1d plan sets a 44px floor. *Recommend:* fold into the redesign rather than patching here.

**Info · pre-existing:** skipping from the "View all overdue and planned" overlay leaves that overlay's list stale until it is closed and reopened, because `render()` does not re-render `#allPlanned`. Worth folding into the redesign.

**Recommendation: commit finance-v9.2 as-is.** The defect is fixed, the repair reaches existing devices, and nothing regressed. L1–L4 are follow-ups, not blockers — and per the earlier review this release should be committed on its own, before the Direction 1d work begins.

### 2026-08-14 · Claude · redesign delivery plan reviewed — design confirmed, release structure to change
Reviewed the "Warm Modern Finance" (Direction 1d) delivery plan. The design direction, the no-financial-behavior-changes rule, the cautious pace-marker fallback and the QA-gate loop are all endorsed. Five changes requested:

1. **Split the releases. Ship finance-v9.2 on its own; make the redesign finance-v10.** The plan carries the uncommitted v9.2 correctness work through the entire redesign. The money defect is live on the owner's device now and v9.2 already passes 47/47, so it should not wait; a visual revert must not be able to take the fix with it; and a 15-surface × 2-layout × 2-theme redesign cannot be reviewed in the same diff as occurrence-resolver logic. A full visual overhaul is also not a patch version.
2. **Palette fix — `warning #a4620c` fails WCAG AA for small text on the `#f7f5f2` background: 4.46:1** (it passes at 4.85:1 on white cards). The plan's own floor of 13.5px is not "large text", so the 3:1 exemption does not apply, and warning is the status most often read on a background surface. **Use `#9c5d0b` → 4.84:1 on bg, 5.27:1 on white.** Measured: text 14.76, secondary 6.68, accent 8.25, positive 5.24, exceeded 5.54, white-on-accent 8.98, white-on-positive 5.70, white-on-exceeded 6.02 — all pass. Note also `#fdfcf9` vs `#f7f5f2` is only 1.061, so hairline borders, not surface tone, will define cards.
3. **The laptop layout is new scope, not a restyle.** The app is mobile-only today (`#app{max-width:430px}`); a 1180px container with top nav and master/detail roughly doubles the QA matrix to ~60 screen/theme/layout combinations. Recommend scoping laptop to "stays usable, doesn't break" and deferring the designed desktop experience unless the owner confirms he works on a laptop.
4. **The design package must exist as a file** under `docs/superpowers/specs/` — token table for both themes, type scale, spacing, icon inventory. Claude has no access to the Claude Design chat, so without it the QA gate becomes opinion rather than verification.
5. **Phase A baseline screenshots must be stored outside the repo.** Captured on the owner's device they contain his real salary, balances and debts, and this repo is public — same handling as the private handover brief.

### 2026-08-14 · Codex · finance-v9.2 reminder integrity implemented (uncommitted)
Applied Claude's four approved amendments and implemented the narrow repair release. One shared occurrence resolver now treats fulfilling legacy entries as logged before consulting occurrence state, both monthly metrics and planned-payment views use it, and v9 migration runs an idempotent repair for dangling logged records inside the existing recovery boundary. Deleting a reminder-linked transaction reopens its obligation; explicit Skip remains confirmed and writes only `occurrences` while legacy `skips` stays readable. Removed the dead Recurring-items settings row, retained Claude's copy/docs fixes, changed example card digits from `0000` to fake `0000`, bumped the cache to finance-v9.2, regenerated documentation, and added fixture/regression coverage. Current automated result: 47/47 tests pass. Awaiting final diff review and manual phone-width/theme QA before commit.

### 2026-08-14 · Claude · v9.2 spec and plan reviewed — approved with four required amendments
Reviewed both documents against the confirmed defect and the v9 spec. Scope, acceptance criteria, task ordering, test-first sequence and the line references in the plan are all accurate. Four things must change **before** Task 2 is implemented:

1. **Resolver regression risk — add an explicit rule: an entry that fulfils an occurrence resolves as `logged` even when no occurrence record exists.** As written, spec §3.2 rule 1 only validates an existing `logged` record and rule 5 sends missing state to `upcoming`. `monthMetrics` today is protected by an entries-first guard (`entries.some(e=>entryFulfillsOccurrence(...))||status==="logged"||…`), and plan Task 2 Step 2 replaces that guard with the resolver. Without the new rule, every reminder-linked entry that has no occurrence record — i.e. all the v7/v8 auto-posted rent, iqama and loan installments carried in by migration — resolves as an open obligation in its own past month, while the actual entry still counts as spending. Past months would double-count. Add a regression test: a fulfilling entry with **no** occurrence record resolves `logged` in both consumers.
2. **Do not delete the Skip sheet — repurpose it.** Plan Task 3 Step 4 removes `sh-skip` "if no remaining caller uses it". `skipReminder` is wired directly to buttons at `index.html:1313` and `:1318` with no confirmation, so deleting the sheet leaves explicit Skip as a silent one-tap action on a money-planning item. Point the sheet at `skipReminder` and keep a confirmation step.
3. **State explicitly whether `skipReminder` keeps dual-writing `state.skips`.** The spec is silent, so the implementer will guess. Recommended: stop writing new legacy keys (the shared resolver and repair now handle legacy data), keep reading them, and update the `skips` line in DOCUMENTATION.md §3.3, which still describes the array as the compatibility surface.
4. **Repair failure must route into the existing migration-recovery path.** Repair now runs inside `migrateV9` on every load, including already-v9 payloads, so a throw must preserve the original serialized value exactly as the current migration-failure test asserts — never a partial write. Consider a `tests/fixtures/v9-dangling.json` fixture so the corrupt-state case follows the existing fixture convention.

### 2026-08-14 · Codex · finance-v9.2 design and plan prepared (uncommitted)
Wrote `docs/superpowers/specs/2026-08-14-reminder-occurrence-integrity-design.md` and `docs/superpowers/plans/2026-08-14-reminder-occurrence-integrity-implementation.md`. Locked the narrow release: deleting a reminder-linked entry reopens its occurrence; one shared resolver serves metrics and planned-payment rendering; load repairs dangling logged records; Skip remains explicit; `0000` becomes `0000`; Claude's copy/docs edits and the dead-row cleanup ship with the fix. Month-over-month analysis and **Update future reminders** are confirmed missed requirements and moved to finance-v9.3. No production logic was changed in this unit.

### 2026-08-14 · Claude · engineering input for the v9.2 spec (recommendations — owner's decisions pending)
Codex asked the owner three questions. Claude's recommendations, plus requirements that must land in the v9.2 spec regardless of how the product questions resolve:

1. **Deletion semantics — endorse Codex's recommendation.** Deleting a reminder-linked entry should return the occurrence to due/overdue; Skip stays a separate explicit action on the occurrence. Deleting means "I logged this wrong", not "this payment isn't happening".
2. **Repair pass is mandatory, not optional.** The defect has been live since finance-v9, so installed data can already hold occurrences stuck at `logged` with a dangling `entryId`. v9.2 must reconcile on load: an occurrence marked `logged` whose `entryId` is absent from `entries` reverts to upcoming, unless a `skips` record explains it. Fixing only the write path leaves existing wrong figures on the device.
3. **Collapse the two status resolvers.** The real root cause class is that `monthMetrics` resolves occurrence status from `occurrences` alone while the planned-payments list resolves it from `occurrences` with a `skips` fallback. One shared resolver, called by both, or this recurs.
4. **Retire the skip-sheet copy if delete stops routing there.** Claude's microcopy fix on that sheet becomes obsolete under the recommended semantics — remove or relocate it rather than keeping both paths.
5. **Tests to add:** delete a logged reminder entry → the obligation reappears in `monthMetrics`; a pre-existing stale `logged` occurrence is repaired on load; Skip still works and remains distinct from delete.
6. **Release scoping — recommend v9.2 carries the defect only** (fix + repair pass + shared resolver + dead-row cleanup + Claude's copy/docs edits), with the month-over-month trend and "Update future reminders" moved to v9.3. The defect corrupts figures the owner is actively using; mixing state repair with new UI makes the diff hard to review, against the spec's own reviewability principle.
7. **`0000`:** replace it with an obviously fake value in `examples/finance-import-template.csv` and the four `tests/import.test.mjs` assertions **regardless** of the owner's answer — an example template should never carry a value a reader could mistake for real. Only the public-history rewrite depends on his answer.

### 2026-08-14 · Codex · `confirmSkip` root cause confirmed (uncommitted)
Traced the reported defect through `delEntry` → `confirmSkip` → `monthMetrics` and compared it with the working `skipReminder` path. Confirmed that deleting a reminder-linked entry removes the actual transaction and writes only the legacy `skips` array while leaving `occurrences[key]` logged with a dangling `entryId`; monthly metrics then count neither the transaction nor the planned obligation. No fix was attempted because the owner must first choose whether deletion reopens the occurrence or skips it. Also confirmed from the approved spec and Task 6 plan that month-over-month analysis and **Update future reminders** were missed requirements, not documented deferrals.

### 2026-08-14 · Claude · QA review of finance-v9 / v9.1 (uncommitted)
Reviewed the build against `docs/superpowers/specs/2026-08-14-financial-control-center-design.md` §12 and the CSV-safety spec. Baseline: 39/39 tests pass, no remote runtime dependency, migration fixtures neutral, `sw.js` at `finance-v9.1` and caching every asset. Verified acceptance criteria for card/refund/payment balance movement, atomicity and undo of imports, and migration-failure rollback.

**Fixed (copy + docs only, no logic):**
1. `index.html` skip sheet — said *"This one posts automatically every month"*, which is false in v9 and contradicts the release's core rule. Rewritten to describe what the action actually does.
2. `index.html` debt-account hint — said the linked reminder *"pays … automatically"* and pointed to *"Recurring items"*. Now says the reminder prompts you and the projection assumes you log it, and points at **Planned payments**.
3. `index.html` reminder overlay title — was still *"Recurring items"*, so tapping **Planned payments** in Manage opened a screen with the old name.
4. `DOCUMENTATION.md` §8 — added the missing **finance-v9.1** changelog row (the release checklist requires one per release; v9.1 was stamped everywhere else but never logged).

**Left for Codex — one defect, one cleanup (details in `## Open questions` for the two spec gaps):**
- **`confirmSkip` leaves occurrence state stale, and money silently leaves the plan.** `index.html` → `confirmSkip` writes only `state.skips`, unlike `skipReminder`, which dual-writes `state.occurrences` *and* `state.skips`. Consequence: delete an entry that was logged from a reminder and `state.occurrences[key]` keeps `{status:"logged"}` with a dangling `entryId`. `monthMetrics` reads only `state.occurrences` (no `skips` fallback), sees `logged`, and skips the occurrence — while the entry no longer exists. The obligation vanishes from **Available within plan** and **Cash after commitments**, overstating available money by that amount, and the planned-payments list shows it as *skipped* (its status resolution does fall back to `skips`), so the two views disagree. No test covers it.
  Also a product question: an entry with a `recurringId` can only be *skipped*, never plainly deleted — so correcting a mis-logged reminder payment forcibly skips the month. Should deleting return the occurrence to due/overdue instead? Left unpatched because the right fix depends on that answer.
- **Dead nav row kept alive by a title-string filter.** `renderSettingsList` still defines the old *"Recurring items"* row (subtitle *"Auto-posts"*) and then removes it with `rows.filter(r=>r.title!=="Recurring items")`, and renames another row the same way. It works, but it couples rendering to display strings — worth deleting the dead row outright.

### 2026-08-14 · Codex · Claude handoff reviewed; v9 source map refreshed (uncommitted)
Reviewed Claude's pending documentation edits without overwriting them. Rebuilt the `AGENTS.md` map directly from the 2,186-line finance-v9.1 `index.html`, covering the current Overview / Log / Manage structure, v9 financial and CSV cores, migrations, renderers, editors, SMS intake, and boot sequence. This remains uncommitted until the owner reviews the full diff; when committed, replace this note and the pending handoff with a history entry carrying the commit hash.

### 2026-08-14 · Claude · shared log established
Set up this file plus the agent-alignment rules above, after the owner asked for a way to keep both agents in sync. No app code touched. Also synced the local clone from `6bdac14` up to `fdb1940`; two untracked local files (`AGENTS.md`, the control-center design spec) were set aside first because their contents differed from what Codex had committed — Codex's committed versions won, and nothing was lost.

### 2026-08-14 · Codex · finance-v9.1 — `fdb1940`
"Make CSV imports account-safe." Spec: `docs/superpowers/specs/2026-08-14-csv-import-safety-design.md`, plan: `docs/superpowers/plans/2026-08-14-csv-import-safety-implementation.md`. Added `tests/import.test.mjs` and `examples/finance-import-template.csv`. _(Entry written by Claude from the commit; Codex should correct it if the intent was wider.)_

### 2026-08-14 · Codex · finance-v9 — `29c0e4c`
"Add financial control center." Spec: `docs/superpowers/specs/2026-08-14-financial-control-center-design.md`, plan: `docs/superpowers/plans/2026-08-14-financial-control-center-implementation.md`. Large change — `index.html` grew from ~1,764 to 2,186 lines. Per `AGENTS.md`, this release also moved `modelVersion` to **9**, added `occurrences` and `imports` to the state, restructured the UI toward **Overview / Log / Manage**, and changed recurring items to **reminder templates that are never materialized automatically**. Introduced `tests/` (`finance-core`, `release`) with migration fixtures for v3 / v6 / v8 / v8.4. _(Entry written by Claude from the commit and docs; Codex should correct anything mischaracterized.)_

### 2026-07-18 · Codex · v8.4 — `248182c`, `6bdac14`
Salary history with effective months (start any month, changes carry forward), then simplified to one amount + a starting month with no steps list.

### 2026-07-18 · Claude · handover to Codex
Wrote `AGENTS.md` (repo conventions for agents; Codex has since revised it) and a private handover brief kept **outside** the repo, because it carries personal financial context that must never land in a public repo. Releases up to and including v8.3 were built with Claude — see DOCUMENTATION.md §8 for that history.
