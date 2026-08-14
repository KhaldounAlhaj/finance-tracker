# Finance v9.2 Reminder Occurrence Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure deleting a reminder-linked transaction restores its obligation, repair stale occurrence state already stored on devices, and make all occurrence consumers use one resolver.

**Architecture:** Keep the app's single-file runtime and model version 9. Add pure occurrence-resolution and repair helpers inside the existing `CORE_V9` block so production and Node tests execute identical logic. Route deletion through a dedicated reopen operation, leave explicit Skip separate, and run idempotent repair during migration/load.

**Tech Stack:** Dependency-free HTML/CSS/JavaScript PWA, browser `localStorage`, Node built-in test runner.

## Global Constraints

- Keep `localStorage["khaldoun_finance_v3"]` and `modelVersion: 9` unchanged.
- No CDN, package, framework, backend, analytics, telemetry or network call.
- Reminder templates never create transactions automatically.
- Delete reopens an occurrence; Skip explicitly skips one occurrence.
- A fulfilling entry resolves an occurrence logged even without an occurrence record.
- New Skip actions write `occurrences` only; legacy `skips` remains read-compatible.
- Repair runs inside the existing migration-recovery boundary and cannot partially persist.
- Preserve all unrelated user data during repair.
- Replace public hint `0000` with `0000`; history rewriting is outside this plan.
- Bump `sw.js` to `finance-v9.2` because `index.html` changes.
- Show the full diff before committing; never push without the owner's explicit **ship** instruction.

---

### Task 1: Add failing occurrence-integrity tests

**Files:**
- Modify: `tests/finance-core.test.mjs`
- Modify: `index.html:682-753` only to export new helpers after tests prove they are absent

**Interfaces:**
- Consumes: existing `occurrenceKey`, `entryFulfillsOccurrence`, `monthMetrics`
- Produces: test contract for `resolveOccurrence(state, reminderId, month)` and `repairOccurrenceState(state)`

- [ ] **Step 1: Extend the extracted core exports in the test harness**

Expose `resolveOccurrence` and `repairOccurrenceState` beside the existing core functions. Do not implement them yet.

- [ ] **Step 2: Add the deletion-regression fixture**

Create a state with a rent reminder, a linked rent entry, and `occurrences["rent:2026-08"]={status:"logged",entryId:"rent-entry"}`. Simulate deletion by removing the entry and occurrence link, then assert `monthMetrics` again includes rent in `plannedSpendingRemaining` and `cashObligationsLeft`.

- [ ] **Step 3: Add repair and resolver tests**

Cover entry-without-record → logged, dangling logged → upcoming, dangling logged plus legacy skip → skipped, stale `entryId` plus matching linked entry → backfilled logged, explicit Skip → skipped in both consumers, repair idempotence, and repair failure preserving the original serialized value. Add neutral `tests/fixtures/v9-dangling.json`.

- [ ] **Step 4: Run the focused tests and verify failure**

Run:

```powershell
node --test tests\finance-core.test.mjs
```

Expected: FAIL because `resolveOccurrence` and `repairOccurrenceState` are not defined.

### Task 2: Implement shared resolution and idempotent repair

**Files:**
- Modify: `index.html:682-753`
- Test: `tests/finance-core.test.mjs`

**Interfaces:**
- Produces: `resolveOccurrence(state, reminderId, month)` and `repairOccurrenceState(state)`
- Consumers: `monthMetrics`, `plannedOccurrenceRows`, `migrateV9`

- [ ] **Step 1: Implement the pure shared resolver**

The resolver must check fulfilling entries first, including migrated entries with no occurrence record; then validate logged entries, respect explicit skip/reschedule state, fall back to legacy skips, and otherwise return upcoming. It must not mutate state.

- [ ] **Step 2: Replace `monthMetrics` occurrence checks**

Use `resolveOccurrence` for every recurring occurrence. Logged, skipped and rescheduled occurrences do not reserve the original open obligation; upcoming does.

- [ ] **Step 3: Implement repair on a cloned state**

For each logged occurrence, backfill a matching entry, convert an explained legacy skip to explicit skipped, or delete an unexplained dangling record. Return the repaired state and preserve idempotence.

- [ ] **Step 4: Invoke repair from `migrateV9` for all incoming versions**

Ensure already-v9 payloads are repaired as well as legacy migrations. Keep input immutable and `modelVersion` at 9. Repair must stay inside the existing load/migration exception boundary so failure preserves the original serialized value.

- [ ] **Step 5: Run focused tests**

```powershell
node --test tests\finance-core.test.mjs
```

Expected: all finance-core tests pass.

### Task 3: Separate transaction deletion from occurrence Skip

**Files:**
- Modify: `index.html:617-627, 1589-1624`
- Test: `tests/finance-core.test.mjs`

**Interfaces:**
- Consumes: `occurrenceKey`, shared resolver, `state.entries`, `state.occurrences`, `state.skips`
- Produces: reminder-linked deletion that reopens instead of skips

- [ ] **Step 1: Add a pure reopen helper to the tested core**

Define `reopenOccurrenceForDeletedEntry(state, entry)` to remove the entry, delete the matching logged occurrence record, and remove the matching legacy skip key. Return the updated cloned state for direct testing.

- [ ] **Step 2: Write and run its failing test before implementation**

Assert the linked entry is removed, the occurrence record is absent, the skip key is absent, and monthly metrics reserve the obligation again.

- [ ] **Step 3: Update `delEntry`**

Use a normal delete confirmation explaining that the planned payment will return to due/overdue. Call the tested reopen helper. Do not route deletion through the Skip sheet.

- [ ] **Step 4: Repurpose the Skip sheet for explicit Skip confirmation**

Remove the delete-as-skip route, but keep `sh-skip`. Make `skipReminder` open it with occurrence-specific consequence copy. Confirmation writes only `state.occurrences[key]={status:"skipped"}` and does not append to `state.skips`; legacy keys remain readable through the resolver.

- [ ] **Step 5: Make planned-payment rendering use the shared resolver**

Replace its local occurrence-plus-skips fallback. Verify rendered status and metrics cannot disagree.

- [ ] **Step 6: Run finance-core tests**

```powershell
node --test tests\finance-core.test.mjs
```

Expected: all tests pass, including delete versus Skip distinction.

### Task 4: Apply approved cleanup and neutral example data

**Files:**
- Preserve current edits: `index.html`, `DOCUMENTATION.md`, `AGENTS.md`, `COLLAB-LOG.md`
- Modify: `index.html:1755-1782`
- Modify: `examples/finance-import-template.csv`
- Modify: `tests/import.test.mjs`

**Interfaces:**
- Consumes: Claude's pending copy changes and Codex's reviewed v9 source map
- Produces: direct Manage rows and neutral public import hints

- [ ] **Step 1: Remove the dead `Recurring items` row**

Delete the hidden row from `renderSettingsList` and remove the title-string filter. Define **Planned payments** and **Income plan & house goal** directly.

Update DOCUMENTATION.md §3.3 so `state.skips` is read-only legacy compatibility data and new skips use `state.occurrences`.

- [ ] **Step 2: Replace every executable-test and public-example `0000` literal with `0000`**

Update the three CSV rows and all test fixtures/assertions. Keep semantics identical: the value is an untrusted account hint, never a persisted configured ID.

- [ ] **Step 3: Run import tests and a privacy scan**

```powershell
node --test tests\import.test.mjs
rg -n "0000" tests examples
```

Expected: tests pass; `rg` returns no matches in tests or public examples. Documentation may retain the literal only to record the privacy and history-rewrite decision.

### Task 5: Release bookkeeping and complete verification

**Files:**
- Modify: `sw.js`
- Modify: `DOCUMENTATION.md`
- Modify: `COLLAB-LOG.md`
- Verify: `AGENTS.md`, `index.html`, all tests and cached assets

**Interfaces:**
- Produces: reviewable finance-v9.2 release candidate; no push

- [ ] **Step 1: Bump the cache**

Change `const CACHE = "finance-v9.1"` to `const CACHE = "finance-v9.2"`.

- [ ] **Step 2: Add the finance-v9.2 changelog row**

Document shared occurrence resolution, deletion reopening, load repair, dead-row cleanup and neutralized example hints. Do not claim MoM analysis or Update future reminders.

- [ ] **Step 3: Resolve collaboration-log items**

Remove deletion semantics, MoM trend and Update future reminders from Open questions. Record the latter two as finance-v9.3 backlog. Keep the `0000` history-rewrite question open until the owner answers whether it was real.

- [ ] **Step 4: Run the full suite**

```powershell
node --test tests\finance-core.test.mjs tests\import.test.mjs tests\release.test.mjs
```

Expected: all existing and new tests pass with zero failures.

- [ ] **Step 5: Run release and safety checks**

```powershell
git diff --check
rg -n "0000|posts automatically|pays .* automatically|Auto-posts" index.html tests examples
```

Expected: no stale copy or sensitive-looking hint remains.

- [ ] **Step 6: Perform manual browser QA**

At phone width in light and dark themes: log a reminder, delete it, verify it returns due/overdue and both headline figures restore the obligation; separately Skip an occurrence and verify it stays skipped. Reload a stale-state fixture and verify repair. Confirm no console error and offline reload works.

- [ ] **Step 7: Show the full diff before commit**

Include all inherited Claude edits, specs/plans, tests, runtime, docs, cache and collaboration-log changes. Do not commit until the owner approves.

- [ ] **Step 8: Commit without pushing after approval**

Commit the release intentionally. Then record the release commit hash in `COLLAB-LOG.md` through a follow-up bookkeeping commit, because a commit cannot contain its own hash. Do not push either commit until the owner says **ship**.

## Plan self-review

- Every acceptance criterion maps to a task.
- Tests precede production logic.
- Existing-device repair and future deletion behavior are independently covered.
- Shared resolution is consumed by both metrics and rendering.
- v9.3 features and history rewriting remain out of scope.
- No placeholder steps or dependency additions remain.
