# Monthly Spending and Liquidity — Design Specification

Date: 2026-08-14  
Status: Owner-approved design; implementation not started

## 1. Objective

Make the Overview answer three different questions without mixing their accounting meanings:

1. How much was spent on purchases this month, and through which payment sources?
2. How much liquid money remains now?
3. How much liquid money is forecast to remain after upcoming commitments?

The design must preserve the existing no-double-counting treatment of credit-card purchases and repayments.

## 2. Overview composition

Place a new **Spent this month** summary after the liquidity figures and before Budget Health.

The summary contains:

- **Spent this month** — the headline net-purchase figure.
- **By payment source** — compact rows for every source with activity in the selected month: Cash/bank, Debit card, JOD cash, Other, and each configured credit card by name.
- **Debt payments** — a separate confirmed total for card and loan repayments.
- **Moved to goals** — a separate confirmed total for goal contributions.

Sources with no monthly activity may be omitted. The source amounts must add up exactly to the headline net-purchase figure.

## 3. Accounting rules

### 3.1 Spent this month

`Spent this month = all expense purchases − all refunds`

- Include purchases regardless of whether they were paid using cash/bank, debit, JOD cash, Other, or a credit card.
- Assign every expense to its recorded `paidWith` source.
- Assign every refund to its recorded return source and subtract it from that source.
- A source may show a negative net amount when its refunds exceed its purchases.
- Exclude debt payments, balance adjustments, income and goal contributions.

This figure represents consumption spending, not cash leaving bank accounts.

### 3.2 Debt payments

`Debt payments = confirmed card payments + confirmed loan payments`

Debt payments remain outside **Spent this month** because the underlying card purchase was already counted when it occurred. This prevents double counting.

### 3.3 Moved to goals

`Moved to goals = confirmed goal contributions`

Goal contributions remain outside **Spent this month** because they move money into savings rather than consume it.

### 3.4 Liquidity figures

The Overview exposes two separate liquidity meanings:

- **Cash left now** = confirmed income − confirmed immediate-liquidity outflows + refunds returned to immediate-liquidity sources.
- **After upcoming commitments** = Cash left now − open cash obligations − remaining goal reservations.

Immediate-liquidity sources are Cash/bank, Debit, JOD cash and Other. Credit-card purchases and credit-card refunds affect the corresponding card balance, not current liquidity. A card payment reduces liquidity when logged.

These are monthly flow figures, not reconciled bank balances. The UI must not label either one as “Bank balance” unless a future account-opening-balance and reconciliation feature is implemented.

## 4. Interaction

- Tapping a payment-source row opens Recent Activity filtered to the selected month and source.
- Tapping **Debt payments** opens Recent Activity filtered to payment entries.
- Tapping **Moved to goals** opens Recent Activity filtered to goal contributions.
- Existing month navigation scopes every figure and drill-through consistently.
- Empty states use plain language and never display a misleading source breakdown.

## 5. Data and compatibility

- Reuse existing entries and `paidWith` values; no model-version or migration change.
- Preserve local-only storage, offline operation and zero external dependencies.
- Do not infer missing payment sources. Legacy or unclassified values appear under **Other**.
- No stored financial data is rewritten.

## 6. Tests and acceptance criteria

1. Cash, debit, credit-card and Other purchases all contribute to **Spent this month** and their own source totals.
2. A refund subtracts only from its recorded return source.
3. Source totals equal the headline spending total, including a negative source total where applicable.
4. Card and loan payments appear under **Debt payments** and do not increase spending.
5. Goal contributions appear under **Moved to goals** and do not increase spending.
6. Cash liquidity excludes credit-card purchases and credit-card refunds but includes card and loan payments as cash outflows.
7. Each drill-through opens the selected month with the correct activity filter.
8. Existing finance, migration, import, design and release tests remain green.
9. Phone-width light/dark QA confirms readable totals, 44px interaction targets and no horizontal overflow.

## 7. Out of scope

- Bank-account opening balances or statement reconciliation.
- Multi-device synchronization.
- New charts or month-over-month trends.
- Changes to budget, debt, reminder or goal calculations beyond exposing the approved totals.
