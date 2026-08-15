import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const grab = name => {
  const m = html.match(new RegExp("function " + name + "\\([\\s\\S]*?\\n\\}"));
  assert.ok(m, "production " + name + " exists");
  return m[0];
};
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(`
  const today=()=>"2026-08-15";
  function pad2(n){return String(n).padStart(2,"0");}
  function guessCat(){return "other";}
  ${grab("arDigits")}
  ${grab("validDate")}
  ${grab("parseBankSMS")}
  globalThis.parseBankSMS=parseBankSMS;
`, ctx);
const { parseBankSMS } = ctx;

const transferSms = `شراء انترنت بـ SR 7500
عبر:3296;مدى-ابل باي
من4046
لـ AlinmaPay
08:03 4/8/26`;

const purchaseSms = `شراء عبر نقاط البيع
بطاقة:0617 ;فيزا-ابل باي
لدى:Flying Ti
مبلغ:SAR 35
رصيد:SAR 2263.78
16:48 13/8/26`;

const declinedSms = `تم رفض العملية: الرصيد غير كافٍ
العملية: شراء انترنت
البطاقة: 0617
المبلغ: SAR 192
الحساب: Amazon SA
التاريخ: 21:34 10/8/26`;

test("a transfer SMS with no balance line yields amount, merchant and date", () => {
  const p = parseBankSMS(transferSms);
  assert.equal(p.ok, true);
  assert.equal(p.amount, 7500);
  assert.equal(p.desc, "AlinmaPay");
  assert.equal(p.date, "2026-08-04");
  assert.equal(p.isCredit, false);
});

test("a standard point-of-sale SMS still parses", () => {
  const p = parseBankSMS(purchaseSms);
  assert.equal(p.amount, 35);
  assert.equal(p.desc, "Flying Ti");
  assert.equal(p.date, "2026-08-13");
});

test("the transaction time inside the SMS is captured", () => {
  assert.equal(parseBankSMS(transferSms).time, "08:03");
  assert.equal(parseBankSMS(purchaseSms).time, "16:48");
});

test("a balance line is never mistaken for the amount", () => {
  assert.equal(parseBankSMS(purchaseSms).amount, 35);
});

test("a declined message is flagged and not treated as a purchase", () => {
  assert.equal(parseBankSMS(declinedSms).declined, true);
});

test("an unparseable message reports failure rather than guessing", () => {
  assert.equal(parseBankSMS("مرحبا").ok, false);
});

test("the log form receives a full datetime, not a bare date", () => {
  const fn = html.match(/function fillFromParse\([\s\S]*?\n\}/)[0];
  assert.match(fn, /p\.date\+"T"\+/, "eDate is datetime-local and needs a time component");
});

test("pasting a declined message refuses to fill the form", () => {
  const fn = html.match(/function parseSmsBox\([\s\S]*?\n\}/)[0];
  assert.match(fn, /declined/);
});
