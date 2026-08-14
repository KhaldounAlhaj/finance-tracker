import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const match=html.match(/\/\* IMPORT_V9_START \*\/([\s\S]*?)\/\* IMPORT_V9_END \*\//);
assert.ok(match,"production import-v9 block exists");
const context={};vm.createContext(context);vm.runInContext(`${match[1]};globalThis.importV9={parseCsv,normalizeImportRow,entryFingerprint,markImportDuplicates};`,context);
const {parseCsv,normalizeImportRow,entryFingerprint,markImportDuplicates}=context.importV9;

test("CSV parser supports quoted commas and Arabic text",()=>{
  const rows=parseCsv('occurred_at,type,amount,currency,description,category,paid_with,account_ref,source_ref,notes\n"2026-08-14 09:30",expense,12.50,SAR,"Shop, Riyadh",food,debit,,abc,"ملاحظة"');
  assert.equal(rows.length,1); assert.equal(rows[0].description,"Shop, Riyadh"); assert.equal(rows[0].notes,"ملاحظة");
});

test("normalizer blocks invalid and declined rows",()=>{
  assert.equal(normalizeImportRow({occurred_at:"bad",type:"expense",amount:"1",currency:"SAR",description:"x",source_ref:"a"}).valid,false);
  assert.equal(normalizeImportRow({occurred_at:"2026-08-14 09:30",type:"declined",amount:"1",currency:"SAR",description:"x",source_ref:"b"}).blocked,true);
});

test("normalizer accepts every canonical entry type",()=>{
  for(const type of ["expense","refund","payment","income"]){
    const row=normalizeImportRow({occurred_at:"2026-08-14 09:30",type,amount:"10.25",currency:"SAR",description:"Test",source_ref:type});
    assert.equal(row.valid,true); assert.equal(row.amount,10.25);
  }
});

test("fingerprint prefers source_ref and otherwise uses normalized fields",()=>{
  assert.equal(entryFingerprint({sourceRef:"ABC"}),"source:abc");
  assert.equal(entryFingerprint({type:"expense",occurredAt:"2026-08-14T09:30",amount:10,description:" Test  Shop ",accountRef:"1234"}),
    "entry:expense|2026-08-14t09:30|10.00|test shop|1234");
});

test("duplicate marking checks existing entries and earlier rows",()=>{
  const rows=[{sourceRef:"new"},{sourceRef:"new"},{sourceRef:"existing"}];
  const marked=markImportDuplicates(rows,new Set(["source:existing"]));
  assert.deepEqual(marked.map(r=>r.duplicate),[false,true,true]);
});
