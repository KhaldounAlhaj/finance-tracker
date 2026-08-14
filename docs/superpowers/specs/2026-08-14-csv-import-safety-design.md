# CSV Import Safety Design

**Approved:** 2026-08-14

## Goal

Make catch-up import safe and practical for screenshot-derived and bank-exported CSV files. CSV values may suggest classification, but the user confirms every account-affecting choice inside the app before saving.

## Canonical behavior

- `account_ref` and `paid_with` are non-secret hints only. They are never persisted as account IDs or arbitrary strings.
- Expense and refund rows require a confirmed **Paid with** choice: Cash, Debit, Other, or a configured credit card.
- Payment rows require a confirmed **Account paid** choice from configured cards and loans.
- Goal rows require a confirmed live goal category. Income rows need no account selection.
- Category uses the app's live categories. Payment categories derive from the selected debt and are not treated as budget spending.
- A reliable hint may be displayed as a suggestion, but it does not count as confirmation.
- Included rows with unresolved required choices are blocked from confirmation.
- Bulk controls may assign Paid with, Account paid, or Category to selected compatible rows. Every row remains editable.

## Validation and safety

- Supported types are expense, refund, payment, income, and goal.
- `source_ref` is optional. When absent, duplicate detection uses normalized type, timestamp, amount, description, and the original account hint.
- Duplicate detection reruns after edits and immediately before confirmation.
- Declined or rejected rows are permanently non-importable.
- Unknown categories and account hints never create hidden IDs or raw account values.
- Confirmation is atomic: validation failure or cancellation writes nothing.
- A successful import receives one `importId`, reports imported/excluded/duplicate/blocked totals, and can be undone by removing only entries in that batch.

## Preview interaction

- Summary shows total, ready, needs review, duplicate, blocked, and excluded counts.
- Each row shows include state, type, amount, timestamp, description, category, account control when relevant, source hint, and validation status.
- Mobile controls use native selects and at least 44px targets.
- A duplicate may be included only through an explicit override.
- Bulk assignment applies only to included compatible rows and never overrides declined rows.

## Compatibility

- The localStorage key and model version remain unchanged; no migration is needed.
- Existing entries and previous import batches remain untouched.
- Parsing and saving remain entirely on-device with no CDN or external dependency.
- The screenshot-derived CSV is regenerated with card endings as hints and no assumed configured account names.

