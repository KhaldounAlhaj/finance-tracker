# Finance v10 Warm Modern Finance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved Direction 1d Warm Modern Finance system to every Finance Tracker surface without changing finance-v9.2 calculations, data, migrations or reminder semantics.

**Architecture:** Keep the dependency-free single-file production architecture. Establish shared CSS tokens, reusable component classes and one inline-SVG icon helper before restyling screens in vertical slices. Protect behavior with the existing finance suite, new source-level design contracts and live responsive checks against neutral localhost fixtures.

**Tech Stack:** Self-contained HTML/CSS/JavaScript PWA, browser `localStorage`, inline SVG, service worker, Node built-in test runner.

## Global Constraints

- Committed design baseline: `docs/superpowers/specs/2026-08-14-warm-modern-finance-v10-design.md`. Private local fidelity aids are under `C:\Users\USER\Downloads\finance-tracker-design-reference\` and must never be added to Git.
- Preserve `localStorage["khaldoun_finance_v3"]`, `modelVersion:9`, every migration and finance-v9.2 occurrence rule.
- No financial formula or entry delta may change.
- No CDN, remote font, package, framework, analytics, telemetry, backend or third-party request.
- Keep Overview, Log and Manage as the only primary navigation areas.
- Use the system font stack and inline SVG only.
- Mobile target: 390×844; laptop usability targets: 1280×800 and 1920×1080.
- One `--app-max` token controls `#app`, `.nav`, `.overlay` and `.sheetwrap`.
- Meaningful text is at least 13.5px; controls are at least 44px high.
- Baseline screenshots with real data remain outside the public repository.
- Work on a local `v10-wip` branch and create one checkpoint commit after each completed task. Push none of these commits. After Task 10, preserve the branch tip, reset the release candidate to the finance-v9.2 baseline as one uncommitted diff, and let Claude review that complete diff. Create the final release commit only after owner approval; push only after **ship**.

## Files and responsibilities

- Modify `index.html`: all production tokens, components, inline icons, markup and responsive rules; finance logic remains intact.
- Modify `sw.js`: release cache changes from `finance-v9.2` to `finance-v10` only after all UI work passes.
- Modify `DOCUMENTATION.md`: v10 changelog and generated source manifest.
- Modify `AGENTS.md`: refresh the source map and test count after the final file settles.
- Modify `COLLAB-LOG.md`: implementation checkpoints and Claude QA handoff.
- Create `tests/design.test.mjs`: source-level design, accessibility, shell and dependency contracts.
- Preserve `tests/finance-core.test.mjs`, `tests/import.test.mjs`, `tests/release.test.mjs`: behavior regression suite; change release version expectation only in the final release task.

---

### Task 1: Lock the design contracts with failing tests

**Files:**
- Create: `tests/design.test.mjs`
- Read: `index.html:1-674`
- Read: `docs/superpowers/specs/2026-08-14-warm-modern-finance-v10-design.md`

**Interfaces:**
- Consumes: production HTML string and approved token names.
- Produces: source-level contracts used by every later task.

- [ ] **Step 1: Create the local checkpoint branch**

From clean finance-v9.2 `main`, create `v10-wip`. Confirm `main` remains at the two local v9.2 commits and do not push either branch.

- [ ] **Step 2: Create the design-test harness**

Read `index.html` and expose helpers that extract the main style block, navigation block and markup by id. Use only `node:fs`, `node:test` and `node:assert/strict`.

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=html.match(/<style>([\s\S]*?)<\/style>/)?.[1]||"";
```

- [ ] **Step 3: Add token and shell tests that fail on v9.2**

Assert the required light/dark tokens, `--on-accent`, `--text-disabled`, `--app-max`, corrected `#9c5d0b`, corrected `#5f9199`, and a common `max-width:var(--app-max)` contract for `#app`, `.nav`, `.overlay` and `.sheetwrap`.

```js
test("v10 tokens and shared responsive shell exist",()=>{
  for(const token of ["--app-max","--surface-warm","--text-2","--text-3","--text-disabled","--accent-soft","--on-accent","--warn-soft","--bad-soft"])
    assert.match(css,new RegExp(token.replace("--","\\-\\-")));
  assert.match(css,/#9c5d0b/i);
  assert.match(css,/#5f9199/i);
  for(const selector of ["#app",".nav",".overlay",".sheetwrap"])
    assert.match(css,new RegExp(selector.replace(/[.#]/g,"\\$&")+"[^}]*max-width:\\s*var\\(--app-max\\)","s"));
});
```

- [ ] **Step 4: Add accessibility and dependency contracts**

Assert `prefers-reduced-motion`, visible `:focus-visible`, local system fonts, no remote runtime URL, no icon font and no structural navigation emoji. Assert `#eAmt` has a CSS minimum height of 44px.

- [ ] **Step 5: Add surface-coverage contracts**

Assert markup exists for first-run, bank-SMS intake, CSV review, all five entry types, planned payments, Budget, Goals, debts and Manage. Assert the primary nav still exposes exactly Overview, Log and Manage.

- [ ] **Step 6: Run the new tests and verify RED**

Run:

```powershell
node --test tests\design.test.mjs
```

Expected: failures for missing v10 tokens, shared shell sizing and icon/component contracts while existing production behavior remains untouched.

- [ ] **Step 7: Create the Task 1 checkpoint commit on `v10-wip`**

Commit only the new test contract and current design documentation. Do not push. Record the hash in `COLLAB-LOG.md`.

### Task 2: Implement the token system, shell and component primitives

**Files:**
- Modify: `index.html:19-216`
- Test: `tests/design.test.mjs`

**Interfaces:**
- Produces CSS contracts: `--app-max`, all §4 tokens, `.wm-card`, `.wm-section`, `.wm-row`, `.wm-status`, `.wm-progress`, `.wm-btn-*`, `.wm-field`, `.wm-sheet`.
- Consumers: every later screen task.

- [ ] **Step 1: Replace legacy visual tokens with the approved light palette**

Define every §4.1 token exactly, including `--warn:#9c5d0b`, `--accent-3:#5f9199`, `--on-accent:#fff`, `--text-disabled:#817a70`, spacing and radii.

- [ ] **Step 2: Replace the old dark palette with §4.2**

Use `--on-accent:#0d2226` for all filled semantic controls. Do not use white or `--text` on the light dark-theme fills.

- [ ] **Step 3: Implement shared shell sizing**

Set a mobile-first `--app-max` and apply `max-width:var(--app-max)` consistently to `#app`, `.nav`, `.overlay` and `.sheetwrap`. Add a laptop media query that widens the shared token enough for readable review without introducing two-column information architecture.

- [ ] **Step 4: Implement primitive component classes**

Add the component classes listed in Interfaces. Soft status regions receive matching 1px borders. Progress segments use 1–2px page-colored separators. Buttons and fields have at least 44px height.

- [ ] **Step 5: Implement focus, disabled and reduced-motion behavior**

Use `:focus-visible` with a 3px surface gap and contrasting 2.5px ring. Disabled controls use `--text-disabled`, native disabled semantics and a visible border/surface treatment. Under reduced motion, transitions and animations collapse to near-zero duration and progress bars do not animate.

- [ ] **Step 6: Run tests**

```powershell
node --test tests\design.test.mjs tests\release.test.mjs
```

Expected: token/shell tests pass; tests for not-yet-restyled surfaces may remain failing and are recorded by name.

- [ ] **Step 7: Create the Task 2 checkpoint commit**

Commit the tested token, shell and primitive work locally on `v10-wip`. Do not push.

### Task 3: Build the inline icon system and restyle onboarding/navigation

**Files:**
- Modify: `index.html:220-240, 477-524, 900-969, 1208-1239, 2185-2223`
- Test: `tests/design.test.mjs`

**Interfaces:**
- Produces: `icon(name,size=24)` returning trusted inline SVG from a fixed local path map.
- Consumers: renderers and static shell markup.

- [ ] **Step 1: Add an icon-path map and helper**

Implement the §13 inventory with one 24×24, `fill="none"`, `stroke="currentColor"`, 2px round-stroke family. The helper accepts only known names and returns an empty string for unknown input; no user string enters SVG markup.

- [ ] **Step 2: Add tests for icon safety and completeness**

Extract the helper with the existing production-script test pattern. Assert every required icon returns SVG, unknown names return empty output, and no remote/icon-font dependency exists.

- [ ] **Step 3: Restyle first-run/onboarding**

Apply the warm canvas, local icon, clear primary action and visible Restore path. Use neutral sample copy only; do not introduce defaults or personal amounts.

- [ ] **Step 4: Restyle header and three-item navigation**

Replace structural emoji with the icon helper or static inline SVG, preserve accessible names and active text labels, and respect safe-area insets.

- [ ] **Step 5: Verify mobile and keyboard behavior**

At 390×844, verify no overlap between content and bottom navigation. Tab through all first-run and navigation actions and confirm visible focus.

- [ ] **Step 6: Run design and release tests**

```powershell
node --test tests\design.test.mjs tests\release.test.mjs
```

Expected: onboarding, shell and icon contracts pass.

- [ ] **Step 7: Create the Task 3 checkpoint commit**

Commit the tested onboarding/navigation/icon slice locally. Do not push.

### Task 4: Recompose Overview with hero 2a

**Files:**
- Modify: `index.html:241-329, 1240-1375`
- Test: `tests/design.test.mjs`
- Regression: `tests/finance-core.test.mjs`

**Interfaces:**
- Consumes unchanged `monthMetrics(state,month)` output.
- Produces visual helpers for headline decimals, status counters, progress and spending mix; no new stored state.

- [ ] **Step 1: Add Overview structure tests**

Assert order: month selector → `Available within plan` → `Cash after commitments` → attention/reminders → budget counters/preview → spending mix → debt/goals/activity. Assert one hero and no more than three consecutive card regions.

- [ ] **Step 2: Implement hero 2a**

Use `--surface-warm`, required border, 4px accent top edge, 42px tabular figure, reduced decimals only in headline markup, formula explanation and spent-versus-plan bar.

- [ ] **Step 3: Keep pacing safe**

Do not implement the straight-line time pace warning. Ship the simpler spent-versus-plan bar unless a separately tested commitment-aware formula is approved. Do not change `monthMetrics`.

- [ ] **Step 4: Implement secondary and attention regions**

Use one secondary metric region for Cash after commitments and a bordered attention region for overdue/over/close items. Status includes text and icon.

- [ ] **Step 5: Convert scan-heavy lower content to sections/rows**

Use bare section headings and hairline rows for budget preview, spending mix, debt, goals and activity. Spending segments use separators and labels.

- [ ] **Step 6: Run finance and design tests**

```powershell
node --test tests\finance-core.test.mjs tests\design.test.mjs
```

Expected: every existing finance assertion remains unchanged and Overview structure passes.

- [ ] **Step 7: Create the Task 4 checkpoint commit**

Commit the tested Overview slice locally. Do not push.

### Task 5: Restyle Unified Log, activity and SMS intake

**Files:**
- Modify: `index.html:330-416, 1495-1670, 2101-2184`
- Test: `tests/design.test.mjs`, `tests/finance-core.test.mjs`

**Interfaces:**
- Consumes existing `setLogType`, `fillLogSelects`, `submitEntry`, SMS parser and entry-delta effects.
- Produces no new entry fields or persistence behavior.

- [ ] **Step 1: Add failing Log contracts**

Assert all five types remain, `#eAmt` is at least 44px, managed selects remain selects, date/time remain editable, Save is the only submit action and the SMS area remains present.

- [ ] **Step 2: Restyle type selector and amount-first form**

Use inline icons and text, clear active state, one-column mobile fields and stable Save placement. Preserve every id and event handler.

- [ ] **Step 3: Restyle validation and effect preview**

Place errors next to fields, retain values on failure and use bordered semantic surfaces. Effect copy continues to derive from existing finance behavior.

- [ ] **Step 4: Restyle activity and filters**

Use scan-friendly rows with aligned amounts, type/source metadata and accessible filter controls. Do not alter filter semantics.

- [ ] **Step 5: Restyle bank-SMS intake**

Preserve Paste, clipboard and `#b64=` behavior. Make parse errors, duplicates and extracted values clear without adding a network action.

- [ ] **Step 6: Test all five entry types and SMS states live**

Use neutral synthetic data on localhost. Verify form fields, effect panels and save behavior in both themes at 390×844.

- [ ] **Step 7: Run the full behavior subset**

```powershell
node --test tests\finance-core.test.mjs tests\design.test.mjs tests\release.test.mjs
```

Expected: no finance regression and all Log/SMS contracts pass.

- [ ] **Step 8: Create the Task 5 checkpoint commit**

Commit the tested Log/activity/SMS slice locally. Do not push.

### Task 6: Restyle planned payments and make open views refresh

**Files:**
- Modify: `index.html:525-674, 1330-1375, 1640-1760`
- Test: `tests/design.test.mjs`, `tests/finance-core.test.mjs`

**Interfaces:**
- Consumes finance-v9.2 `resolveOccurrence`, `skipReminder`, `rescheduleReminder`, `delEntry` and `reopenOccurrenceForDeletedEntry` unchanged.
- Produces `refreshPlannedViews(month)` for rendering both dashboard preview and an already-open View-all overlay.

- [ ] **Step 1: Write a failing refresh contract**

Assert Skip, Reschedule, Log and Delete paths call one refresh function when the planned overlay is open. Assert the Skip sheet remains confirmed and occurrence-only.

- [ ] **Step 2: Restyle occurrence groups and actions**

Use Overdue, Due soon, Later this month and Next month sections. Provide icon+text Log, Reschedule and Skip actions with 44px targets.

- [ ] **Step 3: Implement view refresh without semantic change**

After state mutation, rerender dashboard preview and `#allPlanned` when its overlay is open. Do not change resolver logic, L2 reschedule restoration or L3 Next-payment semantics.

- [ ] **Step 4: Restyle sheets and confirmations**

Use shared sheet primitives, safe-area padding, explicit consequence copy and visible focus. Preserve z-index above overlays.

- [ ] **Step 5: Run reminder regression and live flows**

```powershell
node --test tests\finance-core.test.mjs tests\design.test.mjs
```

Live: Log, Skip, Reschedule and Delete from both dashboard and View-all; confirm the open list updates immediately.

- [ ] **Step 6: Create the Task 6 checkpoint commit**

Commit the tested planned-payment slice locally. Do not push.

### Task 7: Restyle Budget, Goals, commitments and debt details

**Files:**
- Modify: `index.html:417-476, 1376-1494, 1671-1792, 1793-2016`
- Test: `tests/design.test.mjs`, `tests/finance-core.test.mjs`

**Interfaces:**
- Consumes existing category actuals, budget calculations, `houseStatus`, `debtMovement`, `projectDebt` and commitment status.
- Produces display-only status helpers/classes.

- [ ] **Step 1: Add state-coverage tests**

Assert Budget markup/classes support On track, Close, Over and Net refund labels. Assert debt detail contains opening, purchases, refunds, payments, adjustments and closing labels. Assert goals retain contribution action and target/progress values.

- [ ] **Step 2: Restyle Budget Health**

Use section rows, semantic progress, explicit values and activity drill-through. Negative actual displays Net refund with an empty bar and returned amount.

- [ ] **Step 3: Restyle Goals and commitments**

Use one headline goal region plus scan-friendly contribution/commitment rows. Preserve house derivation and all editable targets/dates.

- [ ] **Step 4: Restyle cards, loans and ledger**

Use the existing balance equation and payoff projection. Do not add credit-limit utilization or new debt fields.

- [ ] **Step 5: Restyle editors without changing schemas**

Apply shared fields/buttons to income, house, categories, budgets, debts, roadmap and commitments. Keep every existing id and save path.

- [ ] **Step 6: Run behavior and visual-state tests**

```powershell
node --test tests\finance-core.test.mjs tests\design.test.mjs
```

Expected: all finance calculations remain byte-for-byte equivalent at their public interfaces.

- [ ] **Step 7: Create the Task 7 checkpoint commit**

Commit the tested Budget/Goals/debt slice locally. Do not push.

### Task 8: Restyle Manage, CSV review and data safety surfaces

**Files:**
- Modify: `index.html:477-616, 1793-2100`
- Test: `tests/design.test.mjs`, `tests/import.test.mjs`

**Interfaces:**
- Consumes existing import normalization, choices, validation, atomic apply and undo.
- Produces presentation-only CSV row/status components.

- [ ] **Step 1: Restyle Manage index**

Use seven direct rows with local icons and grouped Plan/Data sections. Preserve routes and backup nudge.

- [ ] **Step 2: Restyle CSV selection and preview**

Make include/exclude, duplicate, blocked, invalid and declined states visible with bordered semantic regions and text labels. Keep account CSV text as hint only.

- [ ] **Step 3: Restyle managed assignment and atomic confirmation**

Keep compatible bulk assignment, unresolved-row reason and disabled confirmation behavior. The actionable blocking reason uses normal secondary or semantic warning/error ink at AA contrast; only the disabled button label may use `--text-disabled`. Preserve native disabled semantics.

- [ ] **Step 4: Restyle backup, restore, reset and recovery**

Keep destructive hierarchy and confirmations. Ensure Restore remains available from onboarding and Manage.

- [ ] **Step 5: Run import and design tests**

```powershell
node --test tests\import.test.mjs tests\design.test.mjs tests\release.test.mjs
```

Expected: all atomicity, duplicate and account-safety tests remain green.

- [ ] **Step 6: Create the Task 8 checkpoint commit**

Commit the tested Manage/CSV/data-safety slice locally. Do not push.

### Task 9: Responsive, theme and accessibility hardening

**Files:**
- Modify: `index.html:19-216`
- Test: `tests/design.test.mjs`

**Interfaces:**
- Consumes every completed v10 surface.
- Produces final mobile/laptop/theme behavior.

- [ ] **Step 1: Run a 390×844 surface inventory in light mode**

Check every screen, overlay and sheet for overflow, clipped amounts, hidden actions, safe-area clearance and 44px targets.

- [ ] **Step 2: Repeat the full inventory in dark mode**

Verify filled controls use `--on-accent`, soft regions have borders, disabled states are visible and no legacy green palette remains.

- [ ] **Step 3: Verify laptop usability**

At 1280×800 and 1920×1080, verify the four shells share width, forms remain readable, CSV review can widen modestly and no bespoke desktop architecture was accidentally introduced.

- [ ] **Step 4: Verify keyboard and 200% zoom**

Tab through all interactive surfaces. Confirm focus visibility, logical order, dialog trapping/closing behavior and no horizontal page overflow at 200% zoom.

- [ ] **Step 5: Verify reduced motion and contrast**

Emulate `prefers-reduced-motion:reduce`; transitions become effectively instant. Recalculate actual production token pairings against §4.3 and record any deviations in `COLLAB-LOG.md`.

- [ ] **Step 6: Run all tests**

```powershell
node --test tests\finance-core.test.mjs tests\import.test.mjs tests\release.test.mjs tests\design.test.mjs
```

Expected: zero failures.

- [ ] **Step 7: Create the Task 9 checkpoint commit**

Commit responsive/accessibility hardening locally. Do not push.

### Task 10: Release bookkeeping and final pre-QA verification

**Files:**
- Modify: `sw.js`
- Modify: `DOCUMENTATION.md`
- Modify: `AGENTS.md`
- Modify: `COLLAB-LOG.md`
- Modify: `tests/release.test.mjs`

**Interfaces:**
- Produces a complete uncommitted finance-v10 release candidate for Claude QA.

- [ ] **Step 1: Update the release contract first**

Change the release test expectation from `finance-v9.2` to `finance-v10`; run it and verify RED while `sw.js` still contains v9.2.

- [ ] **Step 2: Bump the service-worker cache**

Set `const CACHE = "finance-v10"` and confirm every existing local asset remains cached. No remote asset is added.

- [ ] **Step 3: Update documentation**

Add a v10 changelog row describing Direction 1d, both themes, inline icons, complete surface coverage and responsive/accessibility work. Run `node docs\generate-docs.mjs`. Refresh the `AGENTS.md` source map and test count.

- [ ] **Step 4: Run complete automated verification**

```powershell
node --test tests\finance-core.test.mjs tests\import.test.mjs tests\release.test.mjs tests\design.test.mjs
git diff --check
rg -n "https?://|fonts\.googleapis|material-symbols|XMLHttpRequest|WebSocket|sendBeacon" index.html sw.js
```

Expected: all tests pass; diff check clean; dependency scan has no runtime hit.

- [ ] **Step 5: Run privacy and behavior comparison**

Scan all new files for personal names, banks, account digits and real amounts. Compare all `monthMetrics` and debt fixture outputs with the finance-v9.2 baseline.

- [ ] **Step 6: Complete the manual verification matrix**

Use neutral fixtures on localhost. Record mobile/laptop/theme/accessibility/flow results in `COLLAB-LOG.md`, including console and overflow checks.

- [ ] **Step 7: Create the Task 10 checkpoint commit**

Commit release bookkeeping and verification evidence locally on `v10-wip`. Do not push.

- [ ] **Step 8: Convert checkpoints into one uncommitted QA diff**

Record the `v10-wip` tip hash in `COLLAB-LOG.md`, create a safety tag or branch pointer to that tip, then reset the candidate branch to the finance-v9.2 baseline with all v10 changes restored in the working tree. Verify `git diff` contains the complete release and `git status` lists no unrelated file.

- [ ] **Step 9: Leave the full tree uncommitted for Claude**

Append the implementation handoff to `COLLAB-LOG.md`, include exact test counts and known low findings, and provide the owner the Claude QA prompt below. Do not stage, commit or push.

### Task 11: Claude QA, Codex disposition and owner-controlled release

**Files:**
- Review all changed files
- Modify only files required by accepted QA findings
- Modify `COLLAB-LOG.md`

**Interfaces:**
- Consumes Claude's working-tree QA report.
- Produces the owner-reviewed final diff and local release commit.

- [ ] **Step 1: Ask Claude to execute the final QA prompt**

Claude must read `COLLAB-LOG.md`, `AGENTS.md`, the v10 spec, plan and `docs/design-reference/`, then test the uncommitted tree. Claude never commits or pushes.

- [ ] **Step 2: Disposition every finding**

For each finding, mark Confirmed/fixed, Disputed with evidence, or Deferred with owner approval. Blocker/high findings cannot remain unresolved.

- [ ] **Step 3: Rerun complete verification after corrections**

```powershell
node --test tests\finance-core.test.mjs tests\import.test.mjs tests\release.test.mjs tests\design.test.mjs
git diff --check
```

- [ ] **Step 4: Show the owner the complete diff**

Include inherited spec/reference files, plan, runtime, tests, docs, cache and collaboration log. Do not commit until the owner approves.

- [ ] **Step 5: Commit locally after approval**

Create the finance-v10 release commit, then a second collaboration-log commit containing the release hash. Do not push.

- [ ] **Step 6: Push only after the owner says `ship`**

Run a dry-run push, confirm remote fast-forward status, then push `main`. Verify GitHub Pages serves `finance-v10` before telling the owner to refresh the installed PWA.

## Final Claude QA prompt

```text
Read COLLAB-LOG.md first, then AGENTS.md.

Codex has completed the finance-v10 Direction 1d “Warm Modern Finance” redesign. The working tree is intentionally uncommitted. Do not commit or push.

Use these as the authoritative baseline:
- docs/superpowers/specs/2026-08-14-warm-modern-finance-v10-design.md
- docs/superpowers/plans/2026-08-14-warm-modern-finance-v10-implementation.md
- C:\Users\USER\Downloads\finance-tracker-design-reference\HANDOFF.md
- C:\Users\USER\Downloads\finance-tracker-design-reference\DECISIONS.md
- C:\Users\USER\Downloads\finance-tracker-design-reference\Direction 1d.dc.html

Review the complete working-tree diff and run the application using neutral synthetic data on an isolated localhost origin. Never use or capture the owner’s production localStorage.

Required checks:
1. Run every Node test and report the exact pass/fail count.
2. Confirm no finance-v9.2 formula, entry delta, migration, storage key or reminder behavior changed unintentionally.
3. Confirm Direction 1d fidelity, hero 2a, warm card/row rhythm, typography, radii, spacing and petrol-teal identity against the imported design references.
4. Independently verify actual production contrast in light and dark themes, especially --on-accent, disabled text, soft-status borders, focus rings and chart separators.
5. Test every production surface at 390×844 in both themes: onboarding, Overview, all five Log types, activity/filters, SMS intake, planned payments, Budget, Goals, debts, Manage, CSV, backup/restore and every overlay/sheet/dialog.
6. Test planned-payment Log, Reschedule, Skip and Delete; verify open View-all content refreshes immediately and finance-v9.2 occurrence repair still works.
7. Verify Budget states On track, Close, Over and Net refund.
8. Verify cards, loans, goals and CSV atomic import/duplicate/undo behavior.
9. Verify the four shells consume one --app-max and remain usable at 1280×800 and 1920×1080 without introducing unapproved desktop architecture.
10. Verify 44px targets, keyboard order, visible focus, 200% zoom, reduced motion, accessible icon names and no status conveyed by color alone.
11. Confirm no horizontal overflow, clipped financial figures or console errors.
12. Confirm structural emoji are gone, category emoji remain user content, and every structural icon is from one local inline-SVG family.
13. Confirm no CDN, remote font, package, network call, analytics or telemetry was introduced.
14. Scan all changed/new files for personal names, real banks, account digits, real financial figures and production screenshots.
15. Confirm sw.js is finance-v10 and caches every required local asset.
16. Run git diff --check and review the complete uncommitted diff.

For every finding provide severity, exact file/line, reproduction, expected behavior, actual behavior and recommended correction. Write the QA outcome to COLLAB-LOG.md. You may edit only corrections you are certain about; list every edited file. Leave the tree uncommitted and stop for Codex review.
```

## Plan self-review

- Every v10 specification section maps to a task.
- First-run and bank-SMS intake are explicitly included.
- H1/M1–M6/L1–L3 are represented by concrete token, shell, accessibility and test steps.
- Finance behavior remains protected by the unchanged existing suite in every vertical slice.
- L2/L3 reminder semantics are not changed without a separate owner decision.
- Desktop scope remains usability-only; v10.1 owns bespoke desktop composition.
- No implementation placeholder or external dependency is required.
- Claude QA occurs before staging, committing or pushing.
