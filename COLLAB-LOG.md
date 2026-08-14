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
3. **Claude never commits or pushes.** When Claude finishes local edits, it moves them to `## Pending handoffs` and tells the owner they're ready for Codex to commit.
4. **Codex clears the handoff when it commits.** Move the item from `## Pending handoffs` into `## History` with its commit hash.
5. **When in doubt, don't guess — put it in `## Open questions` and ask the owner.** That applies to both agents.
6. `index.html` is one file holding the whole app. Two agents editing it at once will collide. Only one agent touches it at a time; check `git status` and this log first.
7. This file is documentation, not code. It does not need a `sw.js` cache bump.

> **Sync caveat worth knowing:** Claude's local edits and log entries only become visible to Codex-on-the-web after they're committed and pushed. Running **Codex CLI in the local folder** avoids this entirely, because it sees the working tree directly. If Codex runs in the cloud instead, the owner has to get the local changes up to GitHub first.

## Pending handoffs

_Uncommitted work sitting in the local working tree, waiting for Codex to commit._

_None. Claude's documentation/copy handoffs and Codex's finance-v9.2 implementation were committed in `9c2bda6`._

## Open questions

_Anything an agent wasn't sure about. Answer or delete once resolved._

| Date | Raised by | Question |
|---|---|---|
| 2026-08-14 | Claude | Two long-standing blockers are still open: (a) one real bank SMS is needed to tune the on-device parser, (b) the iOS Shortcut `#b64=` storage test — does Safari share `localStorage` with the installed home-screen PWA? Both block work that's already half-built. |
| 2026-08-14 | Claude | **For the owner: were the former example digits real?** Current executable tests and examples are fully genericized. If the previously published value was real, decide whether public history at `fdb1940` needs rewriting (it was rewritten once before, on 2026-06-12, for the same class of leak). |

## History

_Newest first. One entry per unit of work, not per file._

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
