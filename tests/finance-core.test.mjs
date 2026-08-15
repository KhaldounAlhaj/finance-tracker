import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const match = html.match(/\/\* CORE_V9_START \*\/([\s\S]*?)\/\* CORE_V9_END \*\//);
assert.ok(match, "production core-v9 block exists");
const context = { console, structuredClone: globalThis.structuredClone };
vm.createContext(context);
vm.runInContext(`${match[1]};globalThis.coreV9={entryDeltas,classifyMoneyEntry,monthMetrics,monthlyMoneySummary,migrateV9,debtMovement,occurrenceKey,entryFulfillsOccurrence,resolveOccurrence,repairOccurrenceState,reopenOccurrenceForDeletedEntry};`, context);
const { entryDeltas, classifyMoneyEntry, monthMetrics, monthlyMoneySummary, migrateV9, debtMovement, occurrenceKey, entryFulfillsOccurrence, resolveOccurrence, repairOccurrenceState, reopenOccurrenceForDeletedEntry } = context.coreV9;

test("statement reconciliation changes debt only, never spending or liquidity",()=>{
  assert.deepEqual({...entryDeltas({type:"balance_adjustment",amount:250,debtId:"card"},"card")},{spending:0,cash:0,card:0,loan:0,income:0,goal:0});
  assert.deepEqual({...entryDeltas({type:"balance_adjustment",amount:250,debtId:"loan"},null)},{spending:0,cash:0,card:0,loan:0,income:0,goal:0});
});

test("card-funded legacy goal movement does not reduce current liquidity",()=>{
  const state={categories:[{id:"house",kind:"goal"}],debts:[{id:"card",kind:"card"}],entries:[
    {type:"income",amount:1000,date:"2026-08-01"},
    {type:"expense",amount:300,date:"2026-08-02",category:"house",paidWith:"card"}
  ]};
  const classified=classifyMoneyEntry(state,state.entries[1]);
  assert.equal(classified.kind,"goal");assert.equal(classified.cardFunded,true);
  const result=monthlyMoneySummary(state,"2026-08");
  assert.equal(result.spent,0);assert.equal(result.movedToGoals,300);assert.equal(result.cashLeftNow,1000);
  assert.deepEqual({...result.bySource},{});
});

test("monthly money summary separates spending sources from debt and goal movements",()=>{
  const state={debts:[{id:"card-a",kind:"card"},{id:"card-b",kind:"card"},{id:"loan-a",kind:"loan"}],entries:[
    {type:"income",amount:5000,date:"2026-08-01"},
    {type:"expense",amount:400,date:"2026-08-02",paidWith:null},
    {type:"expense",amount:300,date:"2026-08-03",paidWith:"debit"},
    {type:"expense",amount:250,date:"2026-08-04",paidWith:"card-a"},
    {type:"expense",amount:100,date:"2026-08-05",paidWith:"card-b"},
    {type:"expense",amount:80,date:"2026-08-06",paidWith:"cashJOD"},
    {type:"expense",amount:70,date:"2026-08-07",paidWith:"unknown-source"},
    {type:"refund",amount:50,date:"2026-08-08",paidWith:"debit"},
    {type:"refund",amount:300,date:"2026-08-09",paidWith:"card-a"},
    {type:"payment",amount:600,date:"2026-08-10",debtId:"card-a"},
    {type:"payment",amount:500,date:"2026-08-11",debtId:"loan-a"},
    {type:"goal",amount:350,date:"2026-08-12",category:"house"},
    {type:"expense",amount:999,date:"2026-07-31",paidWith:"cash"}
  ]};
  const result=monthlyMoneySummary(state,"2026-08");
  assert.equal(result.spent,850);
  assert.deepEqual({...result.bySource},{cash:400,debit:250,"card-a":-50,"card-b":100,cashJOD:80,otherPay:70});
  assert.equal(result.debtPayments,1100);
  assert.equal(result.movedToGoals,350);
  assert.equal(result.cashLeftNow,2750);
});

test("entry deltas never double-count card purchases and payments", () => {
  assert.deepEqual({ ...entryDeltas({ type:"expense", amount:200, paidWith:"card-1" }, "card-1") },
    { spending:200, cash:0, card:200, loan:0, income:0, goal:0 });
  assert.deepEqual({ ...entryDeltas({ type:"payment", amount:200, debtId:"card-1" }, "card-1") },
    { spending:0, cash:200, card:-200, loan:0, income:0, goal:0 });
});

test("refunds reverse both spending and the correct balance", () => {
  assert.deepEqual({ ...entryDeltas({ type:"refund", amount:75, paidWith:"card-1" }, "card-1") },
    { spending:-75, cash:0, card:-75, loan:0, income:0, goal:0 });
  assert.deepEqual({ ...entryDeltas({ type:"refund", amount:75, paidWith:null }, "card-1") },
    { spending:-75, cash:-75, card:0, loan:0, income:0, goal:0 });
});

test("debit-card activity moves cash like the everyday account",()=>{
  assert.equal(entryDeltas({type:"expense",amount:40,paidWith:"debit"},null).cash,40);
  assert.equal(entryDeltas({type:"refund",amount:40,paidWith:"debit"},null).cash,-40);
});

test("cash refunds restore cash after commitments",()=>{
  const state={categories:[{id:"food",kind:"flexible"}],budgets:{food:500},debts:[],recurring:[],skips:[],entries:[
    {type:"income",amount:1000,date:"2026-08-01"},{type:"expense",amount:200,date:"2026-08-02",category:"food"},{type:"refund",amount:50,date:"2026-08-03",category:"food"}
  ]};
  const m=monthMetrics(state,"2026-08");assert.equal(m.cashPaidSoFar,150);assert.equal(m.cashAfterCommitments,850);
});

test("a rescheduled occurrence does not fulfill the next normal occurrence",()=>{
  const augustKey=occurrenceKey("rent","2026-08");
  const septemberKey=occurrenceKey("rent","2026-09");
  const logged={recurringId:"rent",recurringOccurrenceKey:augustKey,date:"2026-09-03"};
  assert.equal(entryFulfillsOccurrence(logged,"rent",augustKey,"2026-08"),true);
  assert.equal(entryFulfillsOccurrence(logged,"rent",septemberKey,"2026-09"),false);
});

test("model v8 migrates without mutating input and remains idempotent", () => {
  const old={modelVersion:8,entries:[{id:"e1",type:"expense",amount:10,date:"2026-08-01",category:"food"}],recurring:[],skips:[],debts:[]};
  const original=JSON.stringify(old);
  const once=migrateV9(old);
  const twice=migrateV9(once);
  assert.equal(JSON.stringify(old),original);
  assert.equal(once.modelVersion,9);
  assert.deepEqual(once,twice);
  assert.equal(once.entries[0].amount,10);
});

test("monthly metrics separate expense budget, cash commitments, and goals", () => {
  const state={
    categories:[
      {id:"food",kind:"flexible"},{id:"rent",kind:"committed"},{id:"house",kind:"goal"},{id:"car",kind:"debt"}
    ], budgets:{food:1000,rent:500,house:300,car:200}, debts:[{id:"cc",kind:"card"}],
    entries:[
      {type:"income",amount:2000,date:"2026-08-01"},
      {type:"expense",amount:200,date:"2026-08-02",category:"food",paidWith:"cc"},
      {type:"payment",amount:100,date:"2026-08-03",debtId:"cc",category:"car"}
    ],
    recurring:[
      {id:"r1",type:"expense",amount:100,categoryId:"food",dayOfMonth:20,startMonth:"2026-08",everyMonths:1,active:true},
      {id:"r2",type:"expense",amount:500,categoryId:"rent",dayOfMonth:20,startMonth:"2026-08",everyMonths:1,active:true},
      {id:"r3",type:"payment",amount:200,debtId:"loan",categoryId:"car",dayOfMonth:20,startMonth:"2026-08",everyMonths:1,active:true},
      {id:"r4",type:"goal",amount:300,categoryId:"house",dayOfMonth:20,startMonth:"2026-08",everyMonths:1,active:true}
    ], skips:[]
  };
  const m=monthMetrics(state,"2026-08");
  assert.equal(m.spendingPlan,1500);
  assert.equal(m.actualSpending,200);
  assert.equal(m.plannedSpendingRemaining,600);
  assert.equal(m.availableWithinPlan,700);
  assert.equal(m.cashPaidSoFar,100);
  assert.equal(m.cashObligationsLeft,800);
  assert.equal(m.reservedForGoals,300);
  assert.equal(m.cashAfterCommitments,800);
});

test("logging an equal planned expense releases the reservation", () => {
  const state={categories:[{id:"food",kind:"flexible"}],budgets:{food:500},debts:[],skips:[],
    recurring:[{id:"r",type:"expense",amount:100,categoryId:"food",dayOfMonth:10,startMonth:"2026-08",everyMonths:1,active:true}],
    entries:[{id:"e",type:"expense",amount:100,date:"2026-08-10",category:"food",recurringId:"r"}]};
  const m=monthMetrics(state,"2026-08");
  assert.equal(m.plannedSpendingRemaining,0);
  assert.equal(m.availableWithinPlan,400);
});

test("legacy expense entries in goal categories release goals without becoming spending",()=>{
  const state={categories:[{id:"house",kind:"goal"}],budgets:{house:300},debts:[],recurring:[],skips:[],entries:[{type:"expense",amount:300,date:"2026-08-10",category:"house"}]};
  const m=monthMetrics(state,"2026-08");
  assert.equal(m.actualSpending,0);assert.equal(m.cashPaidSoFar,300);assert.equal(m.reservedForGoals,0);
});

test("debt movement includes dated reconciliation adjustments", () => {
  const state={debts:[{id:"cc",kind:"card",startingBalance:1000}],entries:[
    {type:"expense",amount:200,date:"2026-08-02",paidWith:"cc"},
    {type:"refund",amount:50,date:"2026-08-03",paidWith:"cc"},
    {type:"payment",amount:300,date:"2026-08-04",debtId:"cc"},
    {type:"balance_adjustment",amount:-25,date:"2026-08-05",debtId:"cc"}
  ]};
  assert.deepEqual({ ...debtMovement(state,"cc","2026-08") },{opening:1000,purchases:200,refunds:50,payments:300,adjustments:-25,closing:825,net:-175});
});

test("occurrence keys are stable per reminder and month",()=>{
  assert.equal(occurrenceKey("rent","2026-08"),"rent:2026-08");
});

test("a fulfilling migrated entry resolves logged without an occurrence record",()=>{
  const state={categories:[{id:"rent",kind:"committed"}],budgets:{rent:500},debts:[],skips:[],occurrences:{},
    recurring:[{id:"rent-rem",type:"expense",amount:500,categoryId:"rent",dayOfMonth:1,startMonth:"2026-08",everyMonths:1,active:true}],
    entries:[{id:"old-rent",type:"expense",amount:500,date:"2026-08-01",category:"rent",recurringId:"rent-rem"}]};
  assert.equal(resolveOccurrence(state,"rent-rem","2026-08").status,"logged");
  const metrics=monthMetrics(state,"2026-08");
  assert.equal(metrics.actualSpending,500);
  assert.equal(metrics.plannedSpendingRemaining,0);
});

test("repair reopens a dangling logged occurrence",()=>{
  const state={modelVersion:9,entries:[],recurring:[],skips:[],occurrences:{"rent:2026-08":{status:"logged",entryId:"missing"}},debts:[]};
  const repaired=repairOccurrenceState(state);
  assert.equal(repaired.occurrences["rent:2026-08"],undefined);
});

test("repair converts a dangling logged occurrence explained by a legacy skip",()=>{
  const state={modelVersion:9,entries:[],recurring:[],skips:["rent:2026-08"],occurrences:{"rent:2026-08":{status:"logged",entryId:"missing"}},debts:[]};
  const repaired=repairOccurrenceState(state);
  assert.equal(repaired.occurrences["rent:2026-08"].status,"skipped");
});

test("repair backfills a stale entry id from a fulfilling entry and is idempotent",()=>{
  const state={modelVersion:9,entries:[{id:"actual",date:"2026-08-01",recurringId:"rent"}],recurring:[],skips:[],occurrences:{"rent:2026-08":{status:"logged",entryId:"stale"}},debts:[]};
  const once=repairOccurrenceState(state),twice=repairOccurrenceState(once);
  assert.equal(once.occurrences["rent:2026-08"].entryId,"actual");
  assert.deepEqual(twice,once);
});

test("deleting a reminder-linked entry reopens its planned obligation",()=>{
  const state={categories:[{id:"rent",kind:"committed"}],budgets:{rent:500},debts:[],skips:["rent-rem:2026-08"],
    recurring:[{id:"rent-rem",type:"expense",amount:500,categoryId:"rent",dayOfMonth:1,startMonth:"2026-08",everyMonths:1,active:true}],
    occurrences:{"rent-rem:2026-08":{status:"logged",entryId:"rent-entry"}},
    entries:[{id:"rent-entry",type:"expense",amount:500,date:"2026-08-01",category:"rent",recurringId:"rent-rem",recurringOccurrenceKey:"rent-rem:2026-08"}]};
  const reopened=reopenOccurrenceForDeletedEntry(state,state.entries[0]);
  assert.equal(reopened.entries.length,0);
  assert.equal(reopened.occurrences["rent-rem:2026-08"],undefined);
  assert.equal(reopened.skips.length,0);
  const metrics=monthMetrics(reopened,"2026-08");
  assert.equal(metrics.plannedSpendingRemaining,500);
  assert.equal(metrics.cashObligationsLeft,500);
});

test("explicit occurrence skip resolves skipped without a legacy skip key",()=>{
  const state={entries:[],skips:[],occurrences:{"rent:2026-08":{status:"skipped"}}};
  assert.equal(resolveOccurrence(state,"rent","2026-08").status,"skipped");
  assert.deepEqual(state.skips,[]);
});

for(const name of ["v3","v6","v8","v8.4"]){
  test(`${name} fixture reaches the v9 envelope without data loss`,()=>{
    const fixture=JSON.parse(fs.readFileSync(new URL(`fixtures/${name}.json`,import.meta.url),"utf8"));
    const migrated=migrateV9(fixture);
    assert.equal(migrated.modelVersion,9);
    for(const key of Object.keys(fixture))if(key!=="modelVersion"&&key!=="entries")assert.deepEqual(JSON.parse(JSON.stringify(migrated[key])),fixture[key]);
    for(const [i,entry] of (fixture.entries||[]).entries())for(const [key,value] of Object.entries(entry))assert.deepEqual(migrated.entries[i][key],value);
    assert.deepEqual(JSON.parse(JSON.stringify(migrateV9(migrated))),JSON.parse(JSON.stringify(migrated)));
  });
}

test("v9 dangling fixture repairs through migration without mutating input",()=>{
  const fixture=JSON.parse(fs.readFileSync(new URL("fixtures/v9-dangling.json",import.meta.url),"utf8"));
  const original=JSON.stringify(fixture),migrated=migrateV9(fixture);
  assert.equal(JSON.stringify(fixture),original);
  assert.equal(migrated.occurrences["rent-rem:2026-08"],undefined);
  assert.equal(migrated.entries[0].description,"Unrelated entry");
});

test("production migration path upgrades the v8.4 fixture and preserves its entry",()=>{
  const fixture=fs.readFileSync(new URL("fixtures/v8.4.json",import.meta.url),"utf8");
  const scripts=[...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)];
  const source=scripts[1][1],prefix=source.slice(0,source.indexOf("function getCat"));
  let stored=null;const production={localStorage:{getItem:()=>fixture,setItem:(_k,v)=>{stored=v;}},console};vm.createContext(production);
  vm.runInContext(`${prefix};globalThis.migratedState=state;globalThis.persist=save;`,production);
  assert.equal(production.migratedState.modelVersion,9);assert.equal(production.migratedState.entries[0].id,"legacy-entry");assert.equal(production.migratedState.entries[0].amount,1);
  production.persist();assert.equal(JSON.parse(stored).modelVersion,9);
});

test("reopening a deleted entry restores the reschedule it was logged against",()=>{
  const state={categories:[{id:"rent",kind:"committed"}],budgets:{rent:500},debts:[],skips:[],
    recurring:[{id:"r1",type:"expense",amount:500,categoryId:"rent",dayOfMonth:1,startMonth:"2026-08",everyMonths:1,active:true}],
    occurrences:{"r1:2026-08":{status:"logged",entryId:"e1",to:"2026-08-05"}},
    entries:[{id:"e1",type:"expense",amount:500,date:"2026-08-05",category:"rent",recurringId:"r1",recurringOccurrenceKey:"r1:2026-08"}]};
  const out=reopenOccurrenceForDeletedEntry(state,state.entries[0]);
  assert.equal(out.occurrences["r1:2026-08"].status,"rescheduled");
  assert.equal(out.occurrences["r1:2026-08"].to,"2026-08-05");
  assert.equal(out.entries.length,0);
});

test("reopening an entry with no prior reschedule still clears the record",()=>{
  const state={categories:[],budgets:{},debts:[],skips:[],recurring:[],
    occurrences:{"r1:2026-08":{status:"logged",entryId:"e1"}},
    entries:[{id:"e1",type:"expense",amount:500,date:"2026-08-01",recurringId:"r1",recurringOccurrenceKey:"r1:2026-08"}]};
  const out=reopenOccurrenceForDeletedEntry(state,state.entries[0]);
  assert.equal(out.occurrences["r1:2026-08"],undefined);
});

test("repair restores a reschedule when a logged record's entry is gone",()=>{
  const state={modelVersion:9,entries:[],recurring:[],skips:[],debts:[],
    occurrences:{"r1:2026-08":{status:"logged",entryId:"missing",to:"2026-08-05"}}};
  const repaired=repairOccurrenceState(state);
  assert.equal(repaired.occurrences["r1:2026-08"].status,"rescheduled");
  assert.equal(repaired.occurrences["r1:2026-08"].to,"2026-08-05");
});
