import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=html.match(/<style>([\s\S]*?)<\/style>/)?.[1]||"";

function declarationsFor(selector){
  const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  return rules.filter(([,selectors])=>selectors.split(",").some(s=>s.trim()===selector))
    .map(([, ,body])=>body).join("\n");
}

test("v10 exposes the approved warm-modern tokens",()=>{
  for(const token of ["--app-max","--surface-warm","--text-2","--text-3","--text-disabled","--accent-soft","--on-accent","--warn-soft","--bad-soft"])
    assert.match(css,new RegExp(token.replace("--","\\-\\-")),`${token} is defined`);
  assert.match(css,/#9c5d0b/i,"warning ink uses the AA-corrected value");
  assert.match(css,/#5f9199/i,"third chart tint meets the graphics contrast floor");
});

test("all fixed shells consume one responsive app width",()=>{
  for(const selector of ["#app",".nav",".overlay",".sheetwrap"])
    assert.match(declarationsFor(selector),/max-width:\s*var\(--app-max\)/,`${selector} uses --app-max`);
});

test("focus, reduced motion, local fonts and minimum amount target are explicit",()=>{
  assert.match(css,/:focus-visible/);
  assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css,/-apple-system/);
  assert.doesNotMatch(html,/(?:src|href)=["']https?:\/\//i);
  assert.doesNotMatch(html,/fonts\.googleapis|material-symbols|@import\s+url/i);
  assert.match(declarationsFor(".amtwrap input"),/(?:min-)?height:\s*(?:4[4-9]|[5-9]\d)px/,"amount input is at least 44px tall");
});

test("all production intake and management surfaces remain present",()=>{
  for(const id of ["firstRun","p-dashboard","p-log","p-budget","p-goals","p-settings","csvFile","eAmt","eSms","ov-csv","ov-recurring","sh-skip"])
    assert.match(html,new RegExp(`id=["']${id}["']`),`${id} exists`);
  for(const label of ["Expense","Refund","Card · loan","Income","Goal","Paste a bank SMS","Import CSV"])
    assert.match(html,new RegExp(label,"i"),`${label} remains available`);
});

test("primary navigation remains Overview Log Manage only",()=>{
  const nav=html.match(/<nav class="nav"[\s\S]*?<\/nav>/)?.[0]||"";
  assert.deepEqual([...nav.matchAll(/data-tab="([^"]+)"/g)].map(m=>m[1]),["dashboard","log","settings"]);
  for(const label of ["Overview","Log","Manage"])assert.match(nav,new RegExp(`>${label}<`));
});

test("structural navigation uses local inline SVG rather than emoji or icon fonts",()=>{
  const nav=html.match(/<nav class="nav"[\s\S]*?<\/nav>/)?.[0]||"";
  assert.equal((nav.match(/<svg\b/g)||[]).length,3);
  assert.doesNotMatch(nav,/[🌀-🫿]/u);
  assert.doesNotMatch(html,/material-symbols|font-awesome|ionicons/i);
});

test("one safe local icon helper owns the structural icon family",()=>{
  assert.match(html,/const ICON_PATHS=Object\.freeze\(\{/);
  assert.match(html,/function icon\(name,size=24\)/);
  for(const name of ["overview","log","manage","calendar","expense","refund","payment","income","goal","planned","budget","category","debt","edit","delete","filter","backup","restore","csv","theme","warning","success","close"])
    assert.match(html,new RegExp(`${name}:`),`${name} icon exists`);
});

test("first run follows reminder-only copy and has no structural emoji",()=>{
  const first=html.match(/<div id="firstRun"[\s\S]*?<div id="shell"/)?.[0]||"";
  assert.doesNotMatch(first,/post themselves|posts automatically/i);
  assert.doesNotMatch(first,/[🌀-🫿]/u);
  // wording may change; what must hold is that a restore path exists on first run
  assert.match(first,/Restore (?:from|your) backup/i);
});

test("Overview follows the approved decision-first composition",()=>{
  const view=html.match(/<div class="page active" id="p-dashboard">([\s\S]*?)<!-- LOG -->/)?.[1]||"";
  const anchors=["overview-month","overview-hero","overview-cash","overview-attention","overview-budget","overview-spending","overview-debt-goals","overview-activity"];
  let last=-1;
  for(const id of anchors){const at=view.indexOf(`id="${id}"`);assert.ok(at>last,`${id} appears in approved order`);last=at;}
  assert.equal((view.match(/class="[^"]*overview-hero\b/g)||[]).length,1,"Overview has one hero");
});

test("Overview hero 2a carries explanation and spent-versus-plan progress",()=>{
  const hero=html.match(/<[^>]+id="overview-hero"[\s\S]*?<\/div>\s*<\/div>/)?.[0]||"";
  assert.match(hero,/Available within plan/);
  assert.match(hero,/id="dSafe"/);
  assert.match(hero,/id="dSafeSub"/);
  assert.match(hero,/id="dPlanW"/);
  assert.doesNotMatch(hero,/Spending fast|spent-versus-elapsed/i);
  const rule=declarationsFor(".overview-hero");
  assert.match(rule,/border-top:\s*4px solid var\(--accent\)/);
  assert.match(rule,/background:\s*var\(--surface-warm\)/);
});

test("Overview separates current liquidity, forecast liquidity, spending sources, debt and goals",()=>{
  for(const id of ["dCashNow","dCashAfter","dSpendTotal","dSpendSources","dDebtPayments","dGoalMoves"]){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/>Cash left now</);
  assert.match(html,/>After upcoming commitments</);
  assert.doesNotMatch(html,/>Cash after commitments</);
});

test("Overview money rows drill into a clearable selected-month activity filter",()=>{
  assert.match(html,/function openActivityDrill\(type,source\)/);
  assert.match(html,/function clearActivityDrill\(\)/);
  assert.match(html,/id="logDrillFilter"/);
  assert.match(html,/monthOf\(e\.date\)!==drill\.month/);
});

test("money drill-through shares classification and explains filtered empty results",()=>{
  assert.match(html,/classifyMoneyEntry\(state,e\)/);
  assert.match(html,/No matching transactions/);
  assert.match(html,/logTypeFilter/);
  assert.match(html,/amount<0\?'− '/);
});

test("closed months expose liquidity, source spending, debt and goal totals",()=>{
  for(const id of ["pastCashNow","pastCashAfter","pastSpendTotal","pastSpendSources","pastDebtPayments","pastGoalMoves"]){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/activityDrill\.month=next/);
});

test("Unified Log preserves every managed entry path and one save action",()=>{
  const view=html.match(/<!-- LOG -->([\s\S]*?)<!-- BUDGET -->/)?.[1]||"";
  assert.deepEqual([...view.matchAll(/data-lt="([^"]+)"/g)].map(m=>m[1]),["expense","refund","payment","income","goal"]);
  for(const id of ["eCat","ePayWith","ePay","eIncSrc","eFreq"])assert.match(view,new RegExp(`<select[^>]+id="${id}"`),`${id} remains a managed select`);
  assert.match(view,/<input[^>]+type="datetime-local"[^>]+id="eDate"/);
  assert.equal((view.match(/onclick="submitEntry\(\)"/g)||[]).length,1,"one Save action submits the entry");
  assert.match(view,/id="log-effect"/);
});

test("Log retains offline SMS and CSV catch-up intake",()=>{
  const view=html.match(/<!-- LOG -->([\s\S]*?)<!-- BUDGET -->/)?.[1]||"";
  for(const id of ["logSms","eSms","smsMsg","csvFile","undoImportBtn"])assert.match(view,new RegExp(`id="${id}"`));
  assert.match(view,/parseSmsBox\(\)/);
  assert.match(view,/pasteClip\(\)/);
  assert.doesNotMatch(view,/https?:\/\//i);
});

test("planned-payment mutations share one open-view refresh path",()=>{
  assert.match(html,/function refreshPlannedViews\(m\)/);
  assert.match(html,/function renderAllPlanned\(m\)/);
  assert.match(html,/classList\.contains\("open"\)[\s\S]{0,180}renderAllPlanned\(m\)/);
  for(const fn of ["rescheduleReminder","confirmSkip","delEntry"]){
    const body=html.match(new RegExp(`function ${fn}\\([^)]*\\)\\{([\\s\\S]*?)\\n\\}`))?.[1]||"";
    assert.match(body,/render\(\)|refreshPlannedViews\(/,`${fn} triggers a refresh`);
  }
});

test("planned-payment actions are explicit touch targets",()=>{
  assert.match(css,/\.planned-actions[^{}]*\{[^}]*min-height:\s*44px/s);
  assert.match(html,/Log<\/button>[\s\S]*Reschedule<\/button>[\s\S]*Skip/);
});

test("Budget Health exposes all four understandable states",()=>{
  for(const label of ["On track","Close","Over","Net refund"])assert.match(html,new RegExp(label,"i"));
  assert.match(html,/budget-status/);
});

test("Budget status modifiers never collide with progress-track styling",()=>{
  assert.doesNotMatch(html,/label:"On track",cls:"track"/);
  assert.match(html,/label:"On track",cls:"on-track"/);
  assert.match(css,/\.budget-status\.on-track/);
});

test("Goals and debt retain actionable progress and complete ledger arithmetic",()=>{
  const goals=html.match(/<!-- GOALS -->([\s\S]*?)<!-- SETTINGS -->/)?.[1]||"";
  for(const id of ["gHouseSaved","gHouseTarget","gHouseW","gHouseReq","gCommits","gDebts"])assert.match(goals,new RegExp(`id="${id}"`));
  assert.match(html,/Save goal contribution/);
  for(const label of ["Opening","Purchases","Refunds","Payments","Reconciliation","Closing"])assert.match(html,new RegExp(`>${label}<`));
  assert.match(css,/\.finance-ledger/);
});

test("Manage remains a seven-route plan hub with separate data safety",()=>{
  const fn=html.match(/function renderSettingsList\(\)\{([\s\S]*?)\/\/ backup nudge/)?.[1]||"";
  for(const label of ["Planned payments","Budget health","Goals & commitments","Income plan & house goal","Budgets","Categories","Cards & loans"])assert.match(fn,new RegExp(label));
  assert.match(fn,/manage-row/);
  const page=html.match(/<!-- SETTINGS -->([\s\S]*?)<\/main>/)?.[1]||"";
  for(const label of ["Download a backup","Restore from a backup file","Reset all data"])assert.match(page,new RegExp(label));
});

test("CSV preview communicates every review state without trusting account hints",()=>{
  for(const state of ["ready","needs review","duplicate","declined · blocked"])assert.match(html,new RegExp(state,"i"));
  assert.match(html,/csv-review-row/);
  assert.match(html,/csv-blocking-reason/);
  assert.match(html,/id="csvConfirm"/);
  assert.match(html,/csvConfirm[^\n]*\.disabled=/);
});

test("laptop widens one shared shell, then composes two columns above 1100px",()=>{
  assert.match(css,/@media\s*\(min-width:\s*760px\)[\s\S]*--app-max:\s*760px/);
  assert.match(css,/@media\s*\(min-width:\s*760px\)[\s\S]*main\s*\{[^}]*padding-left:\s*24px[^}]*padding-right:\s*24px/s);
  // The desktop composition was approved after v10; below 1100px the phone shape must survive intact.
  assert.match(css,/@media\s*\(min-width:\s*1100px\)[\s\S]*--app-max:\s*1180px/);
  assert.match(css,/@media\s*\(min-width:\s*1100px\)[\s\S]*#dashCurrent\{[^}]*grid-template-columns/s);
  assert.match(css,/@media\s*\(min-width:\s*1100px\)[\s\S]*\.overview-hero \.big\{font-size:52px\}/s);
  assert.doesNotMatch(css.split("@media (min-width:1100px)")[0],/#dashCurrent\{[^}]*grid-template-columns/,
    "no two-column layout leaks below the desktop breakpoint");
  // the grid only wins if JS stops setting display inline
  assert.doesNotMatch(html,/dashCurrent"\)\.style\.display/,"visibility is toggled by attribute, not inline display");
});

test("the four shells still share one width token at every breakpoint",()=>{
  for(const sel of ["#app",".nav",".overlay",".sheetwrap"])
    assert.match(css,new RegExp(sel.replace(/[.#]/g,"\\$&")+"[^}]*max-width:\\s*var\\(--app-max\\)","s"));
});

test("the plan bar gains a Free reading on laptop only",()=>{
  assert.match(css,/\.plan-legend\{display:none/,"hidden at phone width for space");
  assert.match(css,/@media\s*\(min-width:\s*1100px\)[\s\S]*\.plan-legend\{display:flex\}/s);
  assert.match(html,/Free <b>/);
});

test("resetting to the current month keeps an active activity drill in sync",()=>{
  const fn=html.match(/function resetToNow\([\s\S]*?\n\}/)?.[0]||html.match(/function resetToNow\([^\n]*\n?[^\n]*/)?.[0]||"";
  assert.match(fn,/activityDrill/,"resetToNow must update the active drill month");
});

test("the roadmap phase editor collapses to one column at phone width",()=>{
  assert.match(html,/class="phase-grid"/,"phase fields use a named responsive grid class");
  assert.doesNotMatch(html,/grid-template-columns:1fr 1fr;gap:10px">\s*<div class="fg"><label class="fl">Name/,"no fixed inline two-column grid in the phase editor");
  assert.match(css,/\.phase-grid\{[^}]*minmax\(0,\s*1fr\)/,"tracks must be allowed to shrink below intrinsic input width");
  assert.match(css,/@media\s*\(max-width:\s*4[0-9]{2}px\)[\s\S]*\.phase-grid\{[^}]*grid-template-columns:\s*1fr/);
});

test("logging a reminder keeps any rescheduled date on the occurrence record",()=>{
  assert.match(html,/status:"logged"[^}]*to:/,"the logged record must carry the reschedule forward");
});

test("next payment prefers a rescheduled date over the next natural occurrence",()=>{
  const fn=html.match(/function nextOccurrence\([\s\S]*?\n\s*return[^\n]*\n?\}/)?.[0]||"";
  assert.match(fn,/rescheduled/,"nextOccurrence must consider rescheduled occurrences");
  assert.match(html,/nxt\.rescheduled|nxt&&nxt\.date/,"the reminder row must render the rescheduled date");
});

test("logging from a reminder offers an explicit update-future opt-in", () => {
  assert.match(html, /id="updFutureRow"/, "the opt-in control exists");
  assert.match(html, /function toggleUpdFuture/);
  const draft = html.match(/function startReminderDraft\([\s\S]*?\n\}/)[0];
  assert.match(draft, /updFutureRow[^\n]*display=""/, "shown only while drafting from a reminder");
  assert.match(draft, /updFutureOn=false/, "defaults to off, so one occurrence stays one occurrence");
  const submit = html.match(/function submitEntry\([\s\S]*?\n\}/s)[0];
  assert.match(submit, /if\(updFutureOn\)/, "the template changes only on explicit opt-in");
});

test("the overview carries a month-over-month spending trend", () => {
  assert.match(html, /id="overview-trend"/);
  assert.match(html, /function renderSpendTrend/);
  const fn = html.match(/function renderSpendTrend\([\s\S]*?\n\}/)[0];
  assert.match(fn, /monthlyMoneySummary/, "the trend reuses the shared summary, never its own arithmetic");
  assert.match(fn, /aria-label=/, "each bar is labelled for assistive technology");
  assert.match(fn, /aria-current=/, "the selected month is marked without relying on colour");
  assert.match(css, /\.trend button\{[^}]*min-height:\s*44px/, "bars meet the touch-target floor");
});

test("the device-scope warning and explicit transfer wording are present", () => {
  assert.match(html, /id="deviceScopeNote"/);
  assert.match(html, /does not sync/i);
  assert.match(html, /Already using it on another device/i);
});

test("the entry-type picker explains what each type does to your money", () => {
  assert.match(html, /What are you logging\?/, "the picker is labelled as a form control");
  assert.match(html, /id="logTypeHint"/);
  const fn = html.match(/function setLogType\([\s\S]*?\n\}/)[0];
  for (const t of ["expense","refund","payment","income","goal"])
    assert.match(fn, new RegExp(t + ":\""), "every type states its effect: " + t);
  assert.match(fn, /setText\("logTypeHint"/);
  assert.match(html, /does not change the form above/, "the activity filters are distinguished from the picker");
});

test("a net-refund month is not drawn as a month of spending", () => {
  const fn = html.match(/function renderSpendTrend\([\s\S]*?\n\}/)[0];
  assert.match(fn, /refunded/, "negative months are marked");
  assert.match(fn, /returned to you/, "and say so in the accessible label");
  assert.match(css, /\.trend button\.refunded \.bar\{[^}]*var\(--positive-weak\)/);
});

test("the activity drill variable is declared before anything reads it", () => {
  const decl = html.indexOf("let activityDrill");
  for (const fn of ["function goToMonth", "function chMonth", "function resetToNow"])
    assert.ok(decl < html.indexOf(fn), fn + " must not read activityDrill before it is initialised");
});

// ---- Closed accounts (2026-08-28-closed-accounts-design.md) ----

test("an account can be closed and reopened without deleting its history", () => {
  const editor = html.match(/function renderDebtEditor\([\s\S]*?\n\}/)[0];
  assert.match(editor, /closeDebt\('/, "an open account offers Close");
  assert.match(editor, /reopenDebt\('/, "a closed account offers Reopen");
  assert.match(editor, /<details/, "closed accounts sit in a collapsed group");
  assert.match(editor, /Closed accounts/, "the group is named");
  assert.match(html, /function closeDebt\(/);
  assert.match(html, /function reopenDebt\(/);
});

test("closing refuses to hide money that is still owed", () => {
  const fn = html.match(/function closeDebt\([\s\S]*?\n\}/)[0];
  assert.match(fn, /canCloseDebt\(/, "the core rule gates the action, not a second copy of it");
  assert.match(fn, /alert\(/, "a refused close explains why");
  assert.match(fn, /r\.active=false/, "closing pauses any linked planned payment");
});

test("deleting an account states what it costs", () => {
  const fn = html.match(/function delDebt\([\s\S]*?\n\}/)[0];
  assert.match(fn, /lose|loses/, "the confirm says past purchases lose the account name");
});

test("forward-looking figures read the active accounts, not every account", () => {
  for (const name of ["totalDebt", "totalOriginal", "recPaymentFor"]) {
    const fn = html.match(new RegExp("function " + name + "\\([\\s\\S]*?\\n\\}"))[0];
    assert.match(fn, /activeDebts\(/, name + " excludes closed accounts");
  }
  const pickers = html.match(/function fillLogSelects\([\s\S]*?\n\}/)[0];
  assert.match(pickers, /activeDebts\(/, "the Log pickers exclude closed accounts");
  assert.doesNotMatch(
    html.match(/function paymentSourceLabel\([\s\S]*?\n\}/)[0], /activeDebts\(/,
    "history must still name a closed card");
  // debtName is a one-liner, so scope the match to its own line rather than the next \n}.
  assert.doesNotMatch(
    html.match(/function debtName\([^\n]*/)[0], /activeDebts\(/,
    "activity rows must still name a closed account");
});

test("the closed-account controls meet the touch floor", () => {
  const editor = html.match(/function renderDebtEditor\([\s\S]*?\n\}/)[0];
  const summaries = [...editor.matchAll(/<summary[^>]*style="([^"]*)"/g)].map(m => m[1]);
  assert.ok(summaries.length, "the closed group has a summary");
  for (const style of summaries)
    assert.match(style, /min-height:44px/, "every summary meets 44px");
  // Close/Reopen ride the linkbtn floor rather than a bespoke height.
  for (const action of ["closeDebt", "reopenDebt"])
    assert.match(editor, new RegExp('class="linkbtn"[^>]*onclick="' + action),
      action + " uses the 44px linkbtn control");
  assert.match(declarationsFor(".linkbtn"), /min-height:\s*44px/, ".linkbtn holds the touch floor");
});
