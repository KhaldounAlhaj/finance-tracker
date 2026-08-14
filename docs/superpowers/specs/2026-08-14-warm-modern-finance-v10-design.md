# Finance v10 — Warm Modern Finance Design

**Date:** 2026-08-14  
**Status:** Approved for implementation planning after Claude review amendments  
**Release:** `finance-v10`  
**Direction:** Direction 1d with hero 2a

**Private local design references used for fidelity review:**

- `C:\Users\USER\Downloads\finance-tracker-design-reference\HANDOFF.md`
- `C:\Users\USER\Downloads\finance-tracker-design-reference\DECISIONS.md`
- `C:\Users\USER\Downloads\finance-tracker-design-reference\Direction 1d.dc.html`

These files stay outside the public repository because their fictional but realistic fixture figures must not be mistaken for owner data or swept into a broad Git add. The self-contained requirements in this specification are the committed implementation baseline; the private files are a local visual-fidelity aid for Codex and Claude. Superseded design artifacts are intentionally excluded.

## 1. Objective

Turn Finance Tracker into a calm, modern, professional personal-finance app while preserving every verified finance-v9.2 calculation, migration, reminder rule and privacy constraint.

The redesign combines the warmth and legibility of direction 1b with the hierarchy and decision aids of direction 1c. The result is a new petrol-teal identity rather than a conventional banking-blue, fintech-purple or savings-green interface.

This release is a visual and interaction-quality redesign. It must not change financial formulas or reinterpret stored data.

## 2. Non-negotiable constraints

- Three primary areas only: **Overview · Log · Manage**.
- Planned payments are reminders; they never create transactions automatically.
- Logging from a reminder opens an editable draft with the current date and time. Saving is the only mutation point.
- Preserve `localStorage["khaldoun_finance_v3"]`, `modelVersion:9`, all migration behavior and existing phone data.
- Preserve finance-v9.2 occurrence resolution, repair and delete-versus-Skip behavior.
- Offline-only and dependency-free: no CDN, remote font, icon library, framework, analytics, telemetry, backend or third-party request.
- Keep the production app self-contained in `index.html` plus existing local PWA assets.
- All committed examples remain fictional, neutral and free of personal financial information.
- Baseline screenshots containing real data stay outside the public repository.

## 3. Release scope

Apply one coherent visual system to every existing production surface:

1. Overview dashboard
2. Unified Log form for expense, refund, debt payment, income and goal contribution
3. Recent activity and filters
4. Planned payments, overdue list and reminder actions
5. Budget Health
6. Goals and commitments
7. Cards and loans
8. Debt ledger and statement reconciliation
9. CSV intake, preview, assignment, confirmation and undo
10. Manage hub
11. Income plan and house goal
12. Categories, budgets and roadmap editors
13. Backup, restore and reset
14. All overlays, sheets, dialogs, validation, empty and recovery states
15. Light and dark themes
16. First-run/onboarding and its restore path
17. Bank-SMS paste, clipboard and `#b64=` deep-link intake

Mobile receives the designed experience. Laptop support in v10 means centered, readable, keyboard-usable and free of broken mobile constraints at widths around 1280px. A bespoke two-column dashboard, top navigation and master/detail management system are deferred to v10.1.

## 4. Visual identity

### 4.1 Light theme tokens

| Role | Token | Value | Use |
|---|---|---|---|
| Page | `--bg` | `#f7f5f2` | Warm stone canvas |
| Main surface | `--surface` | `#ffffff` | Cards, sheets, controls |
| Warm surface | `--surface-warm` | `#fdfcf9` | Hero and selected emphasis; border remains required |
| Raised/inset | `--surface-2` | `#f1eee9` | Group backgrounds and quiet controls |
| Strong inset | `--surface-3` | `#e8e4dd` | Disabled and pressed surfaces |
| Border | `--border` | `#e6e1d9` | Resting dividers and card definition |
| Strong border | `--border-2` | `#d3ccc2` | Focus-adjacent and selected structure |
| Main text | `--text` | `#23211e` | Primary copy and numbers |
| Secondary text | `--text-2` | `#5b564f` | Explanations and metadata |
| Tertiary text | `--text-3` | `#666057` | Hints; never opacity-reduced |
| Disabled text | `--text-disabled` | `#817a70` | Disabled controls only, paired with a non-color disabled cue |
| Accent | `--accent` | `#17505c` | Primary action and identity |
| Accent strong | `--accent-hi` | `#103e48` | Pressed state and strong emphasis |
| Filled-control ink | `--on-accent` | `#ffffff` | Text/icons on accent and semantic filled controls |
| Accent soft | `--accent-soft` | `#e4eef0` | Selection and informational background |
| Accent ink | `--accent-ink` | `#10414b` | Text on accent-soft |
| Positive | `--pos` | `#2b7355` | Favorable state |
| Positive soft/ink | `--pos-soft` / `--pos-ink` | `#e8f2ec` / `#1f5c43` | Positive status surfaces |
| Warning | `--warn` | `#9c5d0b` | Close-to-limit status; replaces failing `#a4620c` |
| Warning soft/ink | `--warn-soft` / `--warn-ink` | `#fbeedb` / `#754405` | Warning surfaces |
| Exceeded | `--bad` | `#b03a2b` | Over-plan and destructive state |
| Exceeded soft/ink | `--bad-soft` / `--bad-ink` | `#fae9e5` / `#872a1e` | Error surfaces |
| Chart tints | `--accent-2` / `--accent-3` / `--ochre` | `#3f7f8c` / `#5f9199` / `#c08a4a` | Charts only, never small text |

The warning color measures at least 4.84:1 against the page background and 5.27:1 against white. `--surface-warm` and `--bg` are intentionally close; cards rely on borders and spacing, not color contrast alone.

### 4.2 Dark theme tokens

| Role | Token | Value |
|---|---|---|
| Page | `--bg` | `#161817` |
| Main surface | `--surface` | `#202321` |
| Warm surface | `--surface-warm` | `#242723` |
| Raised/inset | `--surface-2` | `#2b2e2b` |
| Strong inset | `--surface-3` | `#343834` |
| Border | `--border` | `#3b403c` |
| Strong border | `--border-2` | `#505650` |
| Main text | `--text` | `#f5f1ea` |
| Secondary text | `--text-2` | `#c9c3b9` |
| Tertiary text | `--text-3` | `#aaa49a` |
| Disabled text | `--text-disabled` | `#7f847e` |
| Accent | `--accent` | `#73b3bd` |
| Accent strong | `--accent-hi` | `#91c8d0` |
| Filled-control ink | `--on-accent` | `#0d2226` |
| Accent soft | `--accent-soft` | `#243a3e` |
| Accent ink | `--accent-ink` | `#b9e0e5` |
| Positive | `--pos` | `#75bd98` |
| Positive soft/ink | `--pos-soft` / `--pos-ink` | `#22372d` / `#a9dfc2` |
| Warning | `--warn` | `#e1a654` |
| Warning soft/ink | `--warn-soft` / `--warn-ink` | `#402f1c` / `#f0c987` |
| Exceeded | `--bad` | `#e98778` |
| Exceeded soft/ink | `--bad-soft` / `--bad-ink` | `#452723` / `#f4b2a8` |

No filled control may use `--text` or `#ffffff` as its label color in dark mode; accent, positive, warning and exceeded fills use `--on-accent`. Disabled controls may be exempt from 4.5:1, but combine `--text-disabled` with an unmistakable non-color cue and native `disabled` or `aria-disabled` semantics.

### 4.3 Measured contrast baseline

| Pair | Light | Dark |
|---|---|---|
| `--text` on bg / surface / warm / s2 / s3 | 14.76 / 16.06 / 15.65 / 13.88 / 12.67 | 15.85 / 14.09 / 13.42 / 12.20 / 10.59 |
| `--text-2` on bg / surface / s3 | 6.68 / 7.27 / 5.74 | 10.19 / 9.06 / 6.81 |
| `--text-3` on bg / surface / s3 | 5.72 / 6.22 / 4.91 | 7.21 / 6.41 / 4.82 |
| `--accent` as text on bg / surface | 8.25 / 8.98 | 7.57 / 6.73 |
| `--pos` / `--warn` / `--bad` as text on bg | 5.24 / 4.84 / 5.54 | 8.06 / 8.31 / 6.97 |
| Each `*-ink` on its own `*-soft` | 9.46 / 6.87 / 7.10 / 7.50 | 8.49 / 8.49 / 8.17 / 7.52 |
| `--on-accent` on accent / accent-hi / pos / warn / bad | 8.98 / 11.64 / 5.70 / 5.27 / 6.02 | 7.00 / 8.93 / 7.12 / 7.34 / 6.15 |
| Focus ring `--accent` vs bg / accent-soft | 8.25 / 7.61 | 7.57 / 5.09 |
| Chart accent-2 / accent-3 vs white | 4.54 / 3.50 | Not used as dark-theme text |

Soft status surfaces cannot define a region alone. Every accent, positive, warning or exceeded soft-surface region requires a 1px border in its matching ink family. Segmented charts require a 1–2px page-colored gap between adjacent segments plus labels and values; meaning never depends on tint contrast alone.

### 4.4 Shape, elevation and spacing

- Radii: 10px compact, 14px controls, 20px cards, full pill only for status and compact inline actions.
- Spacing scale: 4, 8, 12, 14, 18, 22 and 28px.
- Resting cards: border plus a nearly imperceptible hairline shadow.
- Raised shadow: reserved for menus, overlays and sheets.
- Never use heavy floating-card shadows or glassmorphism.
- Card a region when it contains an action or headline figure.
- Render scan-heavy lists as open sections with hairline rows.
- Never show more than three consecutive carded regions.

## 5. Typography and numbers

Use the local system stack:

```css
-apple-system, "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif
```

No remote font is permitted. All financial numbers use tabular numerals.

This is a deliberate production decision rather than an omission from the Manrope-based design artifact: native SF/Segoe rendering is faster, offline-safe and visually at home on the owner's iPhone. A bundled Manrope asset is not part of v10.

| Role | Size / weight |
|---|---|
| Hero figure | 42px / 800 / `-0.03em` |
| Secondary figure | 28px / 800 / `-0.03em` |
| Page title | 23px / 800 |
| Section title | 17.5px / 800 |
| Row amount | 16px / 700 |
| Label | 14.5px / 600 |
| Body | 14.5px / 400 |
| Metadata | 13.5px / 400 |

No meaningful text is smaller than 13.5px. Reduced decimals apply only to the 42px hero and 28px secondary figure; they never apply to 16px row amounts or other columnar values. They render at 0.64× the integer size and one weight down using a dedicated text token rather than opacity. Columnar amounts remain one uniform size for alignment.

Number rules:

- Two decimals for financial figures.
- Thousands separators.
- Currency named once per figure/group, not repeated mechanically on every row.
- `− 1,200.00` for outflow, `+ 560.00` for inflow and `No change` for zero effects.
- Never display a double negative or `+ −` combination.

## 6. Navigation and shell

- Retain Overview, Log and Manage as the only primary navigation destinations.
- Define one responsive `--app-max` custom property consumed by `#app`, `.nav`, `.overlay` and `.sheetwrap`; these four shells may never carry independent maximum widths.
- Mobile navigation remains bottom-fixed and respects iPhone safe-area insets.
- Use one consistent 24×24 inline SVG outline family with 2px round strokes.
- Active navigation uses accent color, a soft selected surface and a text label; status never depends on icon color alone.
- Header contains contextual title, month navigation where relevant and theme control without visual competition.
- At laptop widths, preserve a centered single-column application with a sensible maximum width; do not stretch forms or cards to the full viewport.

## 7. Overview composition

Order the monthly dashboard around decisions:

1. Month selector
2. Available within plan hero
3. Cash after commitments
4. Attention needed
5. Planned-payment summary
6. Budget status counters
7. Budget Health preview
8. Spending mix
9. Debt progress
10. Goal progress
11. Recent activity shortcut

### 7.1 Hero 2a

- Light warm surface with a 4px petrol-teal top edge.
- Large Available within plan figure.
- Plain-language formula breakdown.
- Spent-versus-planned progress bar.
- Clear neutral, warning and exceeded states.
- Negative state changes figure and supporting explanation to exceeded semantics.

The approved artifact's straight-line spent-versus-elapsed pace status is deliberately dropped from v10 because a normal fixed payment near the start of the month creates a recurring false “Spending fast” alarm. v10 ships the simpler spent-versus-plan bar. A future commitment-aware pace model requires its own approved formula and tests.

### 7.3 Design-coverage boundary

The design package directly specifies Overview, hero 2a and the Unified Log form. Remaining production surfaces are implementation extrapolations governed by the exact tokens, typography, spacing, icon, card-versus-row and accessibility rules in this specification. Claude QA verifies rule compliance on those surfaces rather than claiming pixel fidelity to nonexistent screen comps.

### 7.2 Summary density

- Overview shows at most three urgent reminders and at most two budget rows before View all.
- Lower-half lists use section headings and dividers rather than repeated cards.
- Budget counters show On track, Close and Over.
- Spending mix uses at most three teal tints plus ochre and always includes labels/values.
- Adjacent spending-mix segments use the required 1–2px page-colored separator.
- Every preview has a direct route to its detail view.

## 8. Unified Log

Support all existing types:

- Expense
- Refund
- Debt payment
- Income
- Goal contribution

Rules:

- Entry-type control is fast to scan and reachable with one hand.
- Amount is the dominant field and is at least 44px tall.
- Date and time default automatically and remain editable before saving.
- Description remains free text.
- Account, category, debt and goal destinations remain managed selectors, never arbitrary account text.
- Fields change by entry type without shifting the primary Save action unpredictably.
- Reminder-derived entries display Draft and explain that saving performs the mutation.
- Validation appears beside the relevant field and preserves entered values.
- Over-budget logging warns but does not block.
- Effect preview explains impact on Available within plan, Cash after commitments, debt balance and/or goal progress without changing formulas.

## 9. Planned payments

- Group occurrences as Overdue, Due soon, Later this month and Next month.
- Each open occurrence exposes Log, Reschedule and Skip.
- Skip always requires confirmation and affects one occurrence.
- Delete of a logged reminder entry reopens the obligation under finance-v9.2 rules.
- Refresh any open View-all list immediately after Skip, Reschedule, Log or Delete; stale overlays are not acceptable.
- Status comes from the shared v9.2 resolver.
- L2 and L3 from Claude QA require explicit product decisions before changing behavior:
  - whether log/delete restores a prior rescheduled date;
  - whether Next payment means next natural occurrence or next rescheduled due date.
  Until decided, v10 must not silently alter v9.2 semantics.

## 10. Budget Health

Show per category:

- Planned
- Actual
- Remaining or exceeded
- Percentage used
- On track, Close or Over status
- Refund-aware negative state labeled Net refund
- Direct drill-through to filtered activity

Use petrol teal for normal progress, warning amber near the limit, muted red above the limit and positive emerald only for genuinely favorable outcomes. Status always includes text or an icon, never color alone.

## 11. Goals, commitments and debts

Goal views show current amount, target, remaining amount, percentage, target date, recent contributions and Log contribution.

Debt views show opening balance, purchases, refunds, payments, adjustments, closing balance, overall payoff progress and projected payoff date where supported by existing data. Card purchases increase card debt, refunds decrease it and debt payments decrease it without counting as new spending.

No credit-limit utilization is introduced.

## 12. CSV import

Restyle but preserve the finance-v9.1 account-safe flow:

- File selected but nothing saved
- Parsed rows with include/exclude control
- Duplicate, invalid, declined and blocked states
- Managed in-app account/category/debt/goal assignment
- Compatible bulk assignment
- Disabled confirmation with a specific reason while included rows remain unresolved
- Atomic confirmation summary
- Undo latest import batch

CSV account text remains an untrusted hint and never becomes an account ID.

## 13. Components and icon inventory

Reusable visual components:

- App header and month switcher
- Bottom navigation
- Hero metric
- Secondary metric
- Status counter
- Progress bar and segmented bar
- Attention panel
- Section heading with action
- Financial row
- Empty state
- Inline validation
- Managed select
- Entry-type selector
- Primary, secondary, tertiary and destructive buttons
- Status pill
- Overlay and bottom sheet
- Confirmation dialog
- Toast/message
- Filter bar
- CSV review row

Required inline SVG concepts:

- Overview/grid
- Log/plus
- Manage/sliders
- Previous and next
- Calendar
- Expense/receipt
- Refund/return arrow
- Debt payment/card
- Income/down-to-wallet
- Goal/target
- Planned payment/clock-calendar
- Budget/chart
- Category/tag
- Debt/wallet or card
- Edit/pencil
- Delete/trash
- Filter/funnel
- Backup/download
- Restore/upload
- CSV/file-table
- Theme/sun-moon
- Warning/triangle
- Success/check
- Close/x

Icons use `currentColor`, 24×24 viewBox, 2px stroke, round caps/joins. Emoji are removed from navigational and structural UI; category emoji may remain user-configurable content.

## 14. Responsive behavior

### Mobile target

- Primary frame: 390×844.
- Single column with no horizontal scrolling.
- 16px minimum page gutter.
- 44px minimum interactive height.
- Bottom sheets for focused mobile actions.
- Content clears bottom navigation and safe-area inset.
- Long descriptions and large SAR values wrap without obscuring actions.

### Laptop usability target

- Verify at 1280×800 and 1920×1080.
- Center the mobile-first layout in a wider readable shell.
- Allow modest widening for tables and import review, but no bespoke two-column information architecture in v10.
- Full keyboard navigation and visible focus.
- No independent fixed 430px limitation: `#app`, `.nav`, `.overlay` and `.sheetwrap` consume the same `--app-max` token.

## 15. Motion and accessibility

- Press feedback: 120ms.
- Expand/collapse: 200ms.
- Progress fill: 260ms.
- Sheet entry: 280ms.
- Ease-out only; suppress nonessential motion under `prefers-reduced-motion`.
- Every interactive control receives a visible focus treatment with a 3px surface gap and 2.5px ring adjusted for sufficient contrast on both neutral and accent surfaces.
- Icon-only buttons have accessible names.
- Decorative SVGs are hidden from assistive technology.
- Status is never conveyed by color alone.
- Verify meaningful text to WCAG AA in both themes.
- Verify 200% zoom, keyboard order and no horizontal overflow.

## 16. Data and error safety

- CSS and markup changes must not trigger migrations.
- No existing entry, category, reminder, occurrence, import, debt, commitment or setting may be dropped or renamed.
- Existing migration-recovery alert and backup/restore behavior remain reachable and legible.
- Failed saves retain form input and display a clear local-storage error.
- Destructive actions retain explicit confirmation.
- Redesign tests use neutral fixtures on an isolated localhost origin, never production browser storage.

## 17. Verification matrix

Automated:

- Existing 47-test finance-v9.2 suite remains green.
- Add source assertions for no remote dependencies, correct cache version and required local assets.
- Add targeted DOM/source tests for three primary destinations, 44px amount field, local SVG icons, reduced motion and token presence where practical.
- Run `git diff --check` and privacy scans.

Manual mobile, both themes:

- Overview, Log, Manage
- Planned-payment Log/Reschedule/Skip/Delete flows
- All five Log types
- Budget normal/close/over/net-refund states
- Debt and goal details
- CSV valid/duplicate/invalid/undo states
- Backup/restore/recovery and empty states
- First-run/onboarding, including Restore from backup
- Bank-SMS paste, clipboard and `#b64=` intake states
- No horizontal overflow or console error at 390×844

Manual laptop:

- 1280×800 and 1920×1080 usability
- Keyboard navigation and focus
- No stretched forms, clipped dialogs or unusably narrow CSV review

Financial regression:

- Compare all `monthMetrics` outputs before and after redesign using the same fixtures.
- Confirm debt movement, goal contribution, refund, card purchase and planned-payment effects are unchanged.
- Confirm finance-v9.2 repair still reaches already-v9 state.

## 18. Delivery and QA gates

1. Owner and Claude approve this design specification.
2. Codex writes the implementation plan; no production redesign code before approval.
3. Codex implements v10 test-first in reviewable units.
4. Codex runs complete automated and manual verification.
5. Codex updates `COLLAB-LOG.md` and leaves the tree uncommitted.
6. Claude reviews the complete working tree against this spec and plan, edits only certain corrections, and does not commit.
7. Codex addresses or documents every Claude finding and reruns verification.
8. Owner sees the complete final diff.
9. Owner authorizes commit.
10. Codex commits locally without pushing.
11. Only an explicit **ship** instruction authorizes pushing to GitHub.

## 19. Explicitly deferred

- Cloud or multi-device sync
- Bespoke desktop/two-column experience: v10.1
- Commitment-aware spending pace if the safe formula is not ready
- Month-over-month trend if not separately approved
- Update future reminders if not separately approved
- Refund attribution to an original prior-month purchase
- Any reminder behavior change for rescheduled log/delete or Next payment until L2/L3 decisions are made

## 20. Acceptance criteria

1. Every existing production surface uses the Direction 1d token and component system.
2. Every production surface consumes the shared tokens; structural emoji are removed; the system font stack is used; and no section presents more than three consecutive carded regions.
3. Light and dark themes meet documented contrast requirements.
4. Overview hierarchy follows §7 and uses hero 2a.
5. Log amount and every primary control meet the 44px floor.
6. Planned-payment overlays refresh immediately after actions.
7. Inline SVG icons replace structural emoji without adding dependencies.
8. Mobile works at 390×844 with no overflow; laptop remains comfortably usable at the target widths.
9. Existing 47 finance tests and all new design/release tests pass.
10. No finance formula, storage key, model version, migration or reminder behavior changes unintentionally.
11. No remote dependency, personal data or production screenshot enters the public repo.
12. Claude QA reports no unresolved blocker or high finding before commit.
13. The owner reviews the full diff before commit and explicitly says **ship** before push.

## 21. Self-review

- No placeholder, TODO or unresolved visual token remains.
- The warning contrast correction is incorporated.
- Mobile and laptop scope are separated clearly.
- The two known reschedule semantics remain explicit decisions rather than accidental visual changes.
- Visual work is isolated from finance logic.
- Testing, privacy and Claude handoff requirements are implementation-verifiable.
