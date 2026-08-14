# Finance v9.2 Reminder Occurrence Integrity Design

**Date:** 2026-08-14  
**Status:** Proposed for owner review  
**Release:** `finance-v9.2`

## 1. Objective

Prevent a reminder obligation from silently disappearing when its logged transaction is deleted, repair already-corrupted local state, and make every consumer resolve reminder occurrence status through one rule.

This is a narrow correctness release. Month-over-month analysis and **Update future reminders** remain approved requirements but move to finance-v9.3.

## 2. Confirmed defect

A transaction logged from a reminder stores an occurrence as `logged` with an `entryId`. Deleting that transaction currently adds a legacy `skips` key but leaves the occurrence `logged`. `monthMetrics` then excludes the planned obligation while the deleted transaction no longer contributes an actual amount. Available within plan and Cash after commitments are overstated.

The planned-payments renderer and monthly metrics also resolve status differently: the renderer falls back to `state.skips`, while metrics read `state.occurrences` directly.

## 3. Product behavior

### 3.1 Delete and Skip are different actions

- Deleting a reminder-linked transaction means the transaction was logged incorrectly.
- After deletion, that occurrence returns to its implicit due or overdue state.
- Deletion must remove the linked `logged` occurrence record and any legacy skip key for the same occurrence.
- Skip remains an explicit action on an open occurrence. It creates no transaction and marks only that occurrence skipped.
- Deleting must no longer route through the Skip sheet. The obsolete delete-as-skip copy and controller are removed.
- Repurpose the existing Skip sheet for explicit `skipReminder` confirmation, so Skip is never a silent one-tap change.
- New skips write only `state.occurrences[key]={status:"skipped"}`. Stop adding legacy `state.skips` keys, but continue reading and repairing existing keys.

### 3.2 Shared occurrence resolver

Add one pure resolver used by both `monthMetrics` and planned-payment rendering:

```text
resolveOccurrence(state, reminderId, month) ->
  { key, status, record, entry }
```

Resolution order:

1. Any existing entry that fulfils the occurrence resolves it as `logged`, even when no occurrence record exists. This preserves migrated v7/v8 history.
2. A `logged` record is valid only when its `entryId` references an existing entry that fulfils that occurrence, or a matching linked entry can be found.
3. Explicit `skipped` and `rescheduled` records are respected.
4. A legacy `state.skips` key resolves as skipped when no valid explicit state overrides it.
5. A dangling logged record with no matching entry resolves as skipped only when a legacy skip explains it; otherwise it resolves as upcoming.
6. Missing state with no fulfilling entry resolves as upcoming.

No consumer may independently combine `occurrences`, `skips`, and entries after this release.

### 3.3 Load-time repair

Every load runs an idempotent repair without changing `modelVersion` or the storage key:

- For each `logged` occurrence, verify its linked entry.
- If `entryId` is stale but a matching linked entry exists, backfill the correct `entryId`.
- If no matching entry exists and the key is in `state.skips`, replace the record with `skipped`.
- If no matching entry and no skip exists, remove the stale record so the occurrence returns to due/overdue.
- Preserve valid skipped and rescheduled records.
- Preserve all entries, reminders, imports, balances and unrelated state.
- Run repair inside the existing migration/load exception boundary. If repair throws, preserve the original serialized value exactly and use the existing migration-recovery path; never write partial repair state.

The repaired state is saved through the normal load path. Running repair repeatedly produces the same result.

## 4. Included cleanup

- Preserve Claude's approved copy corrections and finance-v9.1 changelog row.
- Remove the dead `Recurring items` settings row and title-string filter; render **Planned payments** directly.
- Replace `0000` with the obviously fake hint `0000` in the public CSV example and corresponding tests. No configured account ID is introduced or persisted.
- Update documentation to describe `state.skips` as read-only legacy compatibility data; new skip actions write `state.occurrences` only.
- Refresh `AGENTS.md` and `COLLAB-LOG.md` as already reviewed.
- Bump the service-worker cache to `finance-v9.2` and add a finance-v9.2 changelog row.

Whether public Git history must be rewritten remains a separate privacy decision based on whether `0000` was real. It does not block replacing the current files.

## 5. Out of scope

- Month-over-month trend and chart drill-through: finance-v9.3.
- **Update future reminders** control: finance-v9.3.
- Bank-SMS parser tuning and the iOS `#b64=` storage test.
- New model fields or a `modelVersion` increment.
- Any backend, network dependency or synchronization feature.

## 6. Acceptance criteria

1. Deleting a reminder-linked transaction makes its obligation reappear in monthly metrics and planned payments.
2. Deletion never writes a skip state.
3. Explicit Skip remains skipped and does not reappear as due.
4. Existing dangling logged records repair on load according to the rules above.
5. A stale `entryId` is backfilled when a valid matching linked entry exists.
6. Monthly metrics and planned-payment rows use the same resolver.
7. A fulfilling legacy entry without an occurrence record resolves logged in both consumers.
8. Repair is idempotent, preserves unrelated data, and repair failure preserves the original serialized value through migration recovery.
9. Explicit Skip is confirmed in the existing sheet, writes no new legacy skip key, and remains distinct from delete.
10. `0000` no longer exists in executable tests or public example data; documentation may mention it only to record the privacy decision.
11. No remote runtime dependency is added.
12. The complete Node test suite passes, including new regressions and `tests/fixtures/v9-dangling.json`.
13. `sw.js` uses `finance-v9.2` and caches every required asset.
14. The owner sees the full diff before any commit, and nothing is pushed without an explicit **ship** instruction.

## 7. Required regression tests

- Delete a logged reminder transaction; assert the entry is absent, occurrence resolves upcoming, and the planned cash/spending obligation returns.
- Repair a `logged` occurrence whose `entryId` is absent; assert it becomes upcoming.
- Repair a stale logged occurrence with a matching linked entry; assert its `entryId` is corrected and it remains logged.
- Repair a dangling logged occurrence with a legacy skip; assert it becomes skipped.
- Explicitly skip an occurrence; assert both metrics and planned-payment status resolve skipped.
- Resolve a fulfilling migrated entry with no occurrence record; assert it is logged and does not create a phantom historical obligation.
- Force repair to fail through the existing migration-recovery path; assert the original serialized value is preserved exactly.
- Run repair twice; assert the second result equals the first.
- Assert the public CSV fixture and tests use `0000`, not `0000`.

## 8. Self-review

- No placeholders or unresolved implementation semantics remain.
- Delete and Skip have distinct, testable meanings.
- Existing-device repair and future write-path protection are both covered.
- Shared resolution addresses the root cause rather than only one caller.
- Scope is limited to financial correctness, necessary cleanup and release bookkeeping.
