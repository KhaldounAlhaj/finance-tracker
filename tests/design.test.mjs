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
  assert.match(first,/Restore from backup/i);
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

test("laptop usability widens one shared shell without introducing desktop navigation",()=>{
  assert.match(css,/@media\s*\(min-width:\s*760px\)[\s\S]*--app-max:\s*760px/);
  assert.match(css,/@media\s*\(min-width:\s*760px\)[\s\S]*main\s*\{[^}]*padding-left:\s*24px[^}]*padding-right:\s*24px/s);
  assert.doesNotMatch(css,/grid-template-columns:\s*(?:repeat\()?2fr\s+1fr|sidebar/i);
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
