# Finance Tracker — Financial Control Center Redesign

**Date:** 2026-08-14
**Status:** Approved for implementation
**Scope:** Information architecture, reminder-first planning, debt ledger, CSV/SMS catch-up import, and zero-loss migration

## 1. Product objective

Finance Tracker is a private, offline financial control center. It must make three activities obvious:

1. **See** the current financial position and what needs attention.
2. **Log** confirmed money movements.
3. **Manage** future plans, accounts, budgets, and goals.

The house goal remains important, but it is one goal within overall financial management rather than the app's primary organizing concept.

## 2. Navigation

Replace the five bottom tabs with three:

| Zone | Purpose |
|---|---|
| **Overview** | Monthly status, planned-payment reminders, budget health, spending analysis, debt progress, and goals. |
| **Log** | Confirmed expenses, refunds, debt payments, and income; recent activity; SMS and CSV intake. |
| **Manage** | Planned payments, budget, cards and loans, goals and commitments, income plan, categories, preferences, and backup. |

Each financial editor has exactly one home. Overview may link to an editor but must not duplicate it.

## 3. Overview

Overview is month-scoped and answers four questions:

- What can I safely spend?
- What payments need attention?
- Where did the money go, and which budgets are exceeded?
- Are debts and goals progressing?

### 3.1 Monthly summary

Show income, actual spending, planned remaining, safe-to-spend today, and goal set-asides. Historical months show actual results; the current month also shows remaining-day guidance.

### 3.2 Planned payments

Show reminders grouped as overdue, due soon, later this month, and upcoming next month. Each current/overdue occurrence supports:

- **Log payment**
- **Reschedule**
- **Skip this month**

No reminder creates a transaction automatically.

### 3.3 Budget health

Show exceeded categories first, followed by categories approaching their limits. Display planned, actual, remaining/over amount, and percentage. Color must not be the only warning signal.

### 3.4 Spending analysis

Show category/group breakdown and month-over-month spending trend. Selecting a segment opens the matching Log history. Default period is the selected month; optional filters include category, account/payment method, and transaction type.

### 3.5 Debt and goals

Show compact summaries on Overview. Full account/goal details open from Manage.

## 4. Planned-payment reminders

### 4.1 Definition

A planned payment is a reminder/template, not an actual financial entry. It contains:

- Name
- Expected amount
- Category or linked debt account
- Expected date/day
- Frequency: one-time, monthly, every 3 months, every 6 months, or yearly
- Optional end date
- Active/paused state

### 4.2 Occurrence states

Each scheduled occurrence is one of:

- Upcoming
- Due today
- Overdue
- Logged
- Rescheduled
- Skipped

Overdue occurrences remain visible until logged, rescheduled, or skipped.

### 4.3 Log payment

The action opens the standard Log form as an unsaved draft. It is prefilled from the reminder and captures the current local date and time. Before saving, the user can edit amount, actual date/time, category/account, payment method, and description.

Saving creates the actual entry, marks only that occurrence logged, and calculates the next occurrence. Editing one amount/date does not change the template unless the user explicitly selects **Update future reminders**.

### 4.4 Skip and reschedule

- **Skip this month:** removes only that occurrence from planned calculations. It creates no entry and the next recurrence remains scheduled.
- **Reschedule:** moves only that occurrence by default. Future dates change only with explicit confirmation.

## 5. Log

Log contains real, confirmed money movements only:

- Expense
- Refund
- Card/loan payment
- Income

The default date and time are the current local values and remain editable before saving. Entries can also be edited after saving.

Recent activity supports search and filters for date range, type, category, and payment method/account.

## 6. Debt-account ledger

### 6.1 Credit cards

- A purchase paid with a card counts as spending and increases that card's owed balance.
- A card payment reduces the owed balance and does not count as new spending.
- A refund reduces category spending and reduces the card's owed balance.

The SMS `balance`/`رصيد` field is not imported as owed debt because bank messages may report available credit instead.

### 6.2 Loans

A loan payment is a real cash outflow. It reduces the app's calculated balance under the existing simplified model. The account editor supports an explicit balance reconciliation when the bank's actual outstanding balance is available.

Separate interest/fee entry types are out of scope for this release.

### 6.3 Progress display

For each account show:

- Opening balance for the selected month
- New card purchases
- Refunds
- Payments
- Closing calculated balance
- Net movement this month
- Projected closing date when a planned payment exists

For revolving cards, emphasize net balance movement rather than a misleading simple percentage-paid metric.

## 7. CSV catch-up import

### 7.1 Purpose

CSV import supports periods when the user could not log daily. Screenshot-derived CSV files and bank-exported CSV files use the same preview-and-confirm flow.

### 7.2 Canonical template

The supported CSV columns are:

| Column | Required | Meaning |
|---|---:|---|
| `occurred_at` | Yes | Local timestamp in `YYYY-MM-DD HH:mm` format |
| `type` | Yes | `expense`, `refund`, `payment`, or `income` |
| `amount` | Yes | Positive numeric amount |
| `currency` | Yes | ISO code such as `SAR` or `JOD` |
| `description` | Yes | Merchant or user-facing description |
| `category` | No | Category ID/name guess; editable in preview |
| `paid_with` | No | Cash/bank, debit, other, or linked card reference |
| `account_ref` | No | Non-secret account matching hint, such as card last four digits |
| `source_ref` | Yes | Stable duplicate-detection reference/hash |
| `notes` | No | Import/review notes |

Rejected/declined transactions are never included as importable rows.

### 7.3 Preview

Nothing is saved on file selection. Preview shows every row with:

- Include/exclude checkbox
- Type
- Date/time
- Amount/currency
- Description
- Category
- Payment method/account
- Duplicate/new/error status

The user can edit fields before confirming.

### 7.4 Duplicate protection

Use `source_ref` when present. Otherwise compare normalized type, timestamp, amount, merchant/description, and account reference. Duplicate rows default to excluded but can be deliberately overridden.

Import is atomic: invalid rows do not silently partially import. The completion summary reports imported, skipped, duplicate, and failed counts.

### 7.5 SMS format learned from real samples

The parser recognizes Arabic/English bank-message patterns for point-of-sale and online purchases, credit-card refunds, card payments, and rejected transactions. Transaction date/time inside the SMS is authoritative; message/screenshot time is not. Real samples and personal transaction data must remain outside the public repository.

## 8. Manage

Manage contains:

1. Planned payments
2. Monthly budget
3. Cards and loans
4. Goals and commitments
5. Income plan
6. Categories
7. Preferences
8. Backup and restore

Preferences contain app behavior/theme only; financial configuration is not hidden under generic settings.

## 9. Data migration and rollback

The update must preserve existing on-device data.

- Keep `localStorage["khaldoun_finance_v3"]` unchanged as the storage key.
- Add a new `modelVersion` migration; never reset to defaults during upgrade.
- Preserve all entries, categories, budgets, debts, commitments, goals, roadmap phases, settings, and skips.
- Convert existing recurring rules into planned-payment reminder templates.
- Keep already-materialized recurring entries as historical actual entries.
- Do not generate new actual entries during migration.
- Preserve existing skips as skipped occurrences.
- Run migration on a deep copy, normalize and validate it, then replace the primary value only on success.
- On failure, retain the original serialized state and show a recovery message.
- Make migration idempotent.

Before release, test migrations from legacy v3, v6, v8, and current v8.4 fixtures. A fresh manual backup is required before the owner updates the installed phone app.

## 10. Error handling and offline behavior

- All parsing and import remain on-device.
- No analytics, telemetry, CDN, backend, or third-party network calls.
- Malformed CSV/SMS data must produce row/message-level errors without changing saved data.
- App calculations remain usable offline.
- Service-worker cache is bumped for the release.

## 11. Delivery sequence

To keep diffs reviewable:

1. Data model, migration, and reminder engine
2. Three-zone navigation and Manage reorganization
3. Log updates, refund type, and reminder confirmation flow
4. Debt-ledger summaries and calculation corrections
5. CSV import preview, deduplication, and SMS parser tuning
6. Overview analysis and charts
7. Documentation, migration fixtures, full phone-width QA, and release backup check

Each step must show its full diff before commit. No push occurs until the owner explicitly says **ship**.

## 12. Acceptance criteria

- Existing v8.4 phone data migrates with no missing or duplicated records.
- Planned payments never create actual entries automatically.
- Overdue reminders persist; skip removes only one occurrence.
- Logging from a reminder opens an editable draft with current date/time.
- Card purchases, refunds, and payments move balances correctly without double-counting spending.
- Loan payments remain cash outflows and reduce the simplified calculated balance.
- CSV preview detects existing manual/SMS entries and overlapping import rows.
- Rejected SMS transactions cannot be imported as spending.
- Overview totals reconcile exactly to Log entries.
- App works offline and at iPhone width in both themes.
