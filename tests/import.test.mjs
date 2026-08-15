import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const match=html.match(/\/\* IMPORT_V9_START \*\/([\s\S]*?)\/\* IMPORT_V9_END \*\//);
assert.ok(match,"production import-v9 block exists");
const context={};vm.createContext(context);vm.runInContext(`${match[1]};globalThis.importV9={parseCsv,normalizeImportRow,entryFingerprint,markImportDuplicates,importRequirements,validateImportDraft,buildImportEntries,importSummary,importChoiceOptions,applyImportAssignment,entriesWithoutImport,applyImportBatch,undoImportBatch,validImportTimestamp};`,context);
const {parseCsv,normalizeImportRow,entryFingerprint,markImportDuplicates,importRequirements,validateImportDraft,buildImportEntries,importSummary,importChoiceOptions,applyImportAssignment,entriesWithoutImport,applyImportBatch,undoImportBatch,validImportTimestamp}=context.importV9;
const importContext={
  categories:[{id:"food",kind:"flexible",archived:false},{id:"houseSavings",kind:"goal",archived:false}],
  debts:[{id:"card1",kind:"card",name:"Visa"},{id:"loan1",kind:"loan",name:"Car loan"}]
};

test("CSV parser supports quoted commas and Arabic text",()=>{
  const rows=parseCsv('occurred_at,type,amount,currency,description,category,paid_with,account_ref,source_ref,notes\n"2026-08-14 09:30",expense,12.50,SAR,"Shop, Riyadh",food,debit,,abc,"ملاحظة"');
  assert.equal(rows.length,1); assert.equal(rows[0].description,"Shop, Riyadh"); assert.equal(rows[0].notes,"ملاحظة");
});

test("normalizer blocks invalid and declined rows",()=>{
  assert.equal(normalizeImportRow({occurred_at:"bad",type:"expense",amount:"1",currency:"SAR",description:"x",source_ref:"a"}).valid,false);
  assert.equal(normalizeImportRow({occurred_at:"2026-08-14 09:30",type:"declined",amount:"1",currency:"SAR",description:"x",source_ref:"b"}).blocked,true);
  assert.equal(normalizeImportRow({occurred_at:"2026-08-14 09:30",type:"expense",amount:"1",currency:"JOD",description:"x"}).valid,false);
  assert.equal(normalizeImportRow({occurred_at:"2026-99-99 25:90",type:"expense",amount:"1",currency:"SAR",description:"x"}).valid,false);
  assert.equal(normalizeImportRow({occurred_at:"2026-02-30 09:30",type:"expense",amount:"1",currency:"SAR",description:"x"}).valid,false);
  assert.equal(normalizeImportRow({occurred_at:"2026-08-14 09:30",type:"expense",amount:"Infinity",currency:"SAR",description:"x"}).valid,false);
});

test("normalizer accepts every canonical entry type",()=>{
  for(const type of ["expense","refund","payment","income","goal"]){
    const row=normalizeImportRow({occurred_at:"2026-08-14 09:30",type,amount:"10.25",currency:"SAR",description:"Test",source_ref:type});
    assert.equal(row.valid,true); assert.equal(row.amount,10.25);
  }
});

test("source reference is optional and account CSV values remain hints",()=>{
  const row=normalizeImportRow({occurred_at:"2026-08-14 09:30",type:"expense",amount:"10",currency:"SAR",description:"Test",category:"food",paid_with:"Visa",account_ref:"0000"});
  assert.equal(row.valid,true);
  assert.equal(row.paidWithHint,"Visa");
  assert.equal(row.accountHint,"0000");
  assert.equal(row.confirmedPaidWith,undefined);
});

test("requirements vary by entry type",()=>{
  assert.deepEqual({...importRequirements({type:"expense"})},{category:true,paidWith:true,debt:false,goal:false});
  assert.deepEqual({...importRequirements({type:"payment"})},{category:false,paidWith:false,debt:true,goal:false});
  assert.deepEqual({...importRequirements({type:"goal"})},{category:true,paidWith:false,debt:false,goal:true});
  assert.deepEqual({...importRequirements({type:"income"})},{category:false,paidWith:false,debt:false,goal:false});
});

test("account hints never satisfy required in-app confirmation",()=>{
  const row={...normalizeImportRow({occurred_at:"2026-08-14 09:30",type:"payment",amount:"10",currency:"SAR",description:"Card payment",account_ref:"Visa"}),include:true};
  assert.equal(validateImportDraft(row,importContext).valid,false);
  assert.match(validateImportDraft(row,importContext).errors.join(" "),/account paid/i);
  assert.equal(validateImportDraft({...row,confirmedDebtId:"card1"},importContext).valid,true);
  assert.equal(validateImportDraft({...row,confirmedDebtId:"unknown"},importContext).valid,false);
});

test("expense and goal choices must reference live compatible records",()=>{
  const expense={...normalizeImportRow({occurred_at:"2026-08-14 09:30",type:"expense",amount:"10",currency:"SAR",description:"Lunch"}),confirmedCategoryId:"food"};
  assert.equal(validateImportDraft(expense,importContext).valid,false);
  assert.equal(validateImportDraft({...expense,confirmedPaidWith:"cash"},importContext).valid,true);
  assert.equal(validateImportDraft({...expense,confirmedPaidWith:"cash",confirmedCategoryId:"houseSavings"},importContext).valid,false);
  assert.equal(validateImportDraft({...expense,confirmedPaidWith:"loan1"},importContext).valid,false);
  const goal={...normalizeImportRow({occurred_at:"2026-08-14 09:30",type:"goal",amount:"10",currency:"SAR",description:"House"}),confirmedCategoryId:"food"};
  assert.equal(validateImportDraft(goal,importContext).valid,false);
  assert.equal(validateImportDraft({...goal,confirmedCategoryId:"houseSavings"},importContext).valid,true);
});

test("built entries persist confirmed IDs and never raw hints",()=>{
  const rows=[
    {...normalizeImportRow({occurred_at:"2026-08-14 09:30",type:"expense",amount:"10",currency:"SAR",description:"Lunch",paid_with:"Visa"}),include:true,confirmedCategoryId:"food",confirmedPaidWith:"card1"},
    {...normalizeImportRow({occurred_at:"2026-08-14 10:30",type:"payment",amount:"20",currency:"SAR",description:"Payment",account_ref:"0000"}),include:true,confirmedDebtId:"card1"}
  ];
  const built=buildImportEntries(rows,importContext,"batch1",()=>"new-id");
  assert.equal(built.valid,true);assert.equal(built.entries.length,2);
  assert.equal(built.entries[0].paidWith,"card1");assert.equal(built.entries[0].accountRef,undefined);
  assert.equal(built.entries[1].debtId,"card1");assert.equal(built.entries[1].paidWith,null);
  assert.ok(built.entries.every(e=>e.importId==="batch1"));
  assert.ok(built.entries.every(e=>e.importFingerprint));
  assert.ok(built.entries.every(e=>!e.importFingerprint.includes("Visa")&&!e.importFingerprint.includes("0000")));
});

test("saved source-less fingerprint remains stable after account confirmation",()=>{
  const row={...normalizeImportRow({occurred_at:"2026-08-14 09:30",type:"expense",amount:"10",currency:"SAR",description:"Lunch",account_ref:"0000"}),include:true,confirmedCategoryId:"food",confirmedPaidWith:"card1"};
  row.fp=entryFingerprint(row);
  const saved=buildImportEntries([row],importContext,"batch1",()=>"id").entries[0];
  assert.equal(entryFingerprint(saved),row.fp);
});

test("import summary reports every review state",()=>{
  const summary=importSummary([
    {include:true,reviewValid:true},{include:false,duplicate:true},{include:false,blocked:true},{include:false,reviewValid:false},{include:false,reviewValid:true}
  ]);
  assert.deepEqual({...summary},{total:5,ready:1,needsReview:1,duplicates:1,blocked:1,excluded:4});
});

test("choice options expose only compatible live records",()=>{
  const expense=importChoiceOptions({type:"expense"},importContext);
  assert.deepEqual([...expense.paidWith.map(x=>x.value)],["cash","debit","otherPay","card1"]);
  assert.deepEqual([...expense.categories.map(x=>x.value)],["food"]);
  const payment=importChoiceOptions({type:"payment"},importContext);
  assert.deepEqual([...payment.debts.map(x=>x.value)],["card1","loan1"]);
  const goal=importChoiceOptions({type:"goal"},importContext);
  assert.deepEqual([...goal.categories.map(x=>x.value)],["houseSavings"]);
});

test("bulk assignment changes only included compatible rows",()=>{
  const rows=[{type:"expense",include:true},{type:"refund",include:false},{type:"payment",include:true},{type:"income",include:true}];
  const assigned=applyImportAssignment(rows,"confirmedPaidWith","debit");
  assert.equal(assigned[0].confirmedPaidWith,"debit");
  assert.equal(assigned[1].confirmedPaidWith,undefined);
  assert.equal(assigned[2].confirmedPaidWith,undefined);
  assert.equal(assigned[3].confirmedPaidWith,undefined);
});

test("undo removes only entries from the selected import batch",()=>{
  const entries=[{id:"a",importId:"batch1"},{id:"b",importId:"batch2"},{id:"c"}];
  assert.deepEqual(entriesWithoutImport(entries,"batch1").map(e=>e.id),["b","c"]);
});

test("batch apply and undo roll back memory when persistence fails",()=>{
  const state={entries:[{id:"old"}],imports:[]},record={id:"batch1",count:1},addition={id:"new",importId:"batch1"};
  assert.equal(applyImportBatch(state,[addition],record,()=>false),false);
  assert.deepEqual(state.entries.map(e=>e.id),["old"]);assert.equal(state.imports.length,0);
  assert.equal(applyImportBatch(state,[addition],record,()=>true),true);
  assert.deepEqual(state.entries.map(e=>e.id),["old","new"]);
  assert.equal(undoImportBatch(state,"batch1",()=>false),false);
  assert.deepEqual(state.entries.map(e=>e.id),["old","new"]);assert.equal(state.imports.length,1);
  assert.equal(undoImportBatch(state,"batch1",()=>true),true);
  assert.deepEqual(state.entries.map(e=>e.id),["old"]);assert.equal(state.imports.length,0);
});

test("fingerprint prefers source_ref and otherwise uses normalized fields",()=>{
  assert.equal(entryFingerprint({sourceRef:"ABC"}),"source:abc");
  const fp=entryFingerprint({type:"expense",occurredAt:"2026-08-14T09:30",amount:10,description:" Test  Shop ",accountRef:"1234"});
  assert.match(fp,/^entry:[0-9a-f]{8}$/);assert.doesNotMatch(fp,/1234|test shop/);
});

test("timestamp validation checks real calendar and time values",()=>{
  assert.equal(validImportTimestamp("2026-08-14T23:59"),true);
  assert.equal(validImportTimestamp("2026-02-29T10:00"),false);
  assert.equal(validImportTimestamp("2028-02-29T10:00"),true);
  assert.equal(validImportTimestamp("2026-08-14T24:00"),false);
});

test("duplicate marking checks existing entries and earlier rows",()=>{
  const rows=[{sourceRef:"new"},{sourceRef:"new"},{sourceRef:"existing"}];
  const marked=markImportDuplicates(rows,new Set(["source:existing"]));
  assert.deepEqual(marked.map(r=>r.duplicate),[false,true,true]);
});

test("prose in notes about an earlier failed attempt does not block a valid row",()=>{
  const row=normalizeImportRow({occurred_at:"2026-08-10 21:37",type:"expense",amount:"192",currency:"SAR",
    description:"Amazon SA",category:"food",paid_with:"debit",source_ref:"a1",
    notes:"Successful purchase after an earlier declined attempt at 21:34"});
  assert.equal(row.blocked,false);
});

test("a declared declined marker in notes still blocks the row",()=>{
  for(const note of ["declined","Rejected","status: declined","مرفوض"]){
    const row=normalizeImportRow({occurred_at:"2026-08-10 21:34",type:"expense",amount:"192",currency:"SAR",
      description:"Amazon SA",paid_with:"debit",source_ref:"a2",notes:note});
    assert.equal(row.blocked,true,`note "${note}" must block`);
  }
});

test("a declined transaction type is still blocked regardless of notes",()=>{
  const row=normalizeImportRow({occurred_at:"2026-08-10 21:34",type:"declined",amount:"192",currency:"SAR",
    description:"Amazon SA",source_ref:"a3",notes:"ordinary note"});
  assert.equal(row.blocked,true);
});
