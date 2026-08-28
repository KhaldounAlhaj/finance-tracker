# Closed Accounts — Design Specification

Date: 2026-08-28
Status: Owner approved

## Objective

Give a card or loan a **closed** state, so an account that has been paid off and
shut can stop appearing in forward-looking figures and pickers **without**
deleting it and losing the name attached to its history.

## The problem

Today `Manage → Cards & loans` offers only **Delete**. Both available choices are wrong:

- **Delete** removes the account, and every past purchase made with it loses its
  source name. `paymentSourceLabel` cannot resolve the id and the historical
  "Spent this month" breakdown relabels those purchases **"Other"**.
- **Keep it** leaves a 0 SAR account in the accounts list, in the reminder
  account picker, in the "Pay towards" and "Paid with" dropdowns, and in the
  debt-payoff projection, forever.

## Model

- `debts[].closed` — boolean, default `false`.
- Absent on every existing install; `normDebt` defaults it, so a v3-era payload
  loads with `closed:false` on every account. **No `modelVersion` bump and no
  new migration step**: no stored value is reinterpreted, and the field is
  additive with a safe default. Parallel to `categories[].archived`.

## Closing rule

An account may be closed **only when its current balance is exactly 0**
(`|balance| < 0.005`). Closing is refused otherwise, pointing the owner at
logging the final payment or **Reconcile statement balance**.

This is a deliberate constraint: closed accounts leave `totalDebt()`, so a
non-zero balance could otherwise be hidden and the owner would under-count what
he owes. Truthful totals outrank convenience.

Closing also pauses any linked planned payment (`recurring[].active=false`),
matching what **Delete** already does.

Reopening is always allowed and restores the account to every active surface.
It does **not** un-pause reminders — the owner re-enables those deliberately.

## What a closed account leaves

Forward-looking figures and every place the owner picks an account:

- `totalDebt()`, `totalOriginal()` and the Overview debt note and projections
- The **Debt payoff** list on Goals
- **Pay towards** (`ePay`) and **Paid with** (`ePayWith`) on the Log form
- The planned-payment account picker (`rAcct`)
- The `Manage → Cards & loans` row count and remaining total
- CSV review pickers (`importChoiceOptions`) — both account and card lists
- `recPaymentFor`, so a closed account reports no linked planned payment

## What a closed account keeps

History must read exactly as it did before the account was closed:

- `paymentSourceLabel` still names it, so past purchases keep their source row
- `debtName` still names it in activity rows and drill-throughs
- `isCardPayment` and `classifyMoneyEntry` still treat it as a card, so past
  card payments stay debt payments and never become consumption spending
- `debtCurrent` and `debtMovement` still compute over it
- Its entries stay in the Log, in every filter and in every drill-through
- `validateImportDraft` still accepts a row that already names it, so a
  historical backfill is never blocked — only the pickers hide it

## Presentation

`Manage → Cards & loans` lists active accounts as today, then a **Closed
accounts** group in a collapsed `<details>` carrying the count. Each closed row
is read-only apart from **Reopen** and **Delete**, and states that its history
is intact.

Each active account gains a **Close** action beside **Delete**, and **Delete**
now says what it costs: past purchases lose the account name.

## Compatibility and release

- No storage-key change. No `modelVersion` change. No new migration step.
- No external dependency, no network call, no build step.
- Release cache: `finance-v10.8`.
- All 100 existing tests stay green; new tests cover the closing rule, every
  exclusion and every preservation above.
