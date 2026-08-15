import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const sw=fs.readFileSync(new URL("../sw.js",import.meta.url),"utf8");

test("production navigation exposes exactly three primary zones",()=>{
  const nav=html.match(/<nav class="nav"[\s\S]*?<\/nav>/)?.[0]||"";
  assert.deepEqual([...nav.matchAll(/data-tab="([^"]+)"/g)].map(m=>m[1]),["dashboard","log","settings"]);
  assert.match(nav,/>Overview</);assert.match(nav,/>Log</);assert.match(nav,/>Manage</);
});

test("production has no remote runtime dependency",()=>{
  assert.doesNotMatch(html,/(?:src|href)=["']https?:\/\//i);
  assert.doesNotMatch(html,/fonts\.googleapis|material-symbols/i);
});

test("release cache is v10.5 and includes every app asset",()=>{
  assert.match(sw,/CACHE = "finance-v10\.5"/);
  for(const asset of ["index.html","manifest.json","icon-180.png","icon-192.png","icon-512.png","examples/finance-import-template.csv"])assert.match(sw,new RegExp(asset.replace(".","\\.")));
});

test("CSV template uses hints rather than configured account IDs",()=>{
  const csv=fs.readFileSync(new URL("../examples/finance-import-template.csv",import.meta.url),"utf8");
  assert.match(csv,/account_ref/);assert.match(csv,/paid_with/);assert.doesNotMatch(csv,/debtId|confirmedDebtId|confirmedPaidWith/);
  assert.doesNotMatch(csv,/card ending (?!0000)\d{4}/);assert.match(csv,/0000/);
});

test("explicit Skip keeps confirmation and writes no new legacy skip key",()=>{
  assert.match(html,/id="sh-skip"/);
  const skip=html.match(/function skipReminder[\s\S]*?\n\}/)?.[0]||"";
  const confirm=html.match(/function confirmSkip[\s\S]*?function cancelSkip/)?.[0]||"";
  assert.match(skip,/sh-skip/);assert.match(confirm,/state\.occurrences/);
  assert.doesNotMatch(confirm,/state\.skips\.push/);
});

test("recurring materialization is disabled",()=>{
  const body=html.match(/function materializeRecurring\(\)\{([\s\S]*?)\n\}/)?.[1]||"";
  assert.match(body,/return false/);assert.doesNotMatch(body,/state\.entries\.push/);
});

test("migration failure preserves the original serialized value",()=>{
  assert.match(html,/migrationRecovery=raw/);
  assert.match(html,/function save\(\)\{ if\(migrationRecovery\)return/);
  assert.match(html,/original local data was preserved/);
});
