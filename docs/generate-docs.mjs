#!/usr/bin/env node
/**
 * Regenerates the AUTO:GENERATED block of DOCUMENTATION.md from the app source.
 *
 *   Manual run:  node docs/generate-docs.mjs
 *   Automatic:   invoked by .githooks/pre-commit on every commit.
 *
 * No external dependencies. Node 16+ (ESM). Reads index.html / sw.js / manifest.json,
 * pulls out the seed data + structure, and rewrites the generated section + version
 * stamp + a SHA-256 file manifest so the doc always matches the committed app.
 */
import { readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const abs = (f) => join(ROOT, f);
const read = (f) => readFileSync(abs(f), "utf8");

const START = "<!-- AUTO:GENERATED:START";
const END = "<!-- AUTO:GENERATED:END -->";

const nf = (n) => (Number.isFinite(+n) ? (+n).toLocaleString("en-US") : "—");
const today = new Date().toISOString().slice(0, 10);

// Return the substring of `src` from the first `open` at/after fromIndex through its
// matching `close`, ignoring delimiters inside strings and // and /* */ comments.
function extractBalanced(src, fromIndex, open, close) {
  let i = src.indexOf(open, fromIndex);
  if (i < 0) return null;
  const start = i;
  let depth = 0, str = null, line = false, block = false;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (str) { if (c === "\\") { i++; } else if (c === str) { str = null; } continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { str = c; continue; }
    if (c === open) depth++;
    else if (c === close && --depth === 0) return src.slice(start, i + 1);
  }
  return null;
}
function evalLiteral(src, re, open, close) {
  const m = src.match(re);
  if (!m) return null;
  const lit = extractBalanced(src, m.index + m[0].length - 1, open, close);
  if (!lit) return null;
  try { return vm.runInNewContext("(" + lit + ")", Object.create(null), { timeout: 1000 }); }
  catch { return null; }
}
function sha256(f) { return createHash("sha256").update(readFileSync(abs(f))).digest("hex"); }

// ---- read source ----
const html = read("index.html");
const sw = read("sw.js");
let manifest = {};
try { manifest = JSON.parse(read("manifest.json")); } catch { /* keep {} */ }

const cache = (sw.match(/CACHE\s*=\s*["']([^"']+)["']/) || [])[1] || "unknown";
const key = (html.match(/const\s+KEY\s*=\s*["']([^"']+)["']/) || [])[1] || "unknown";
const DEFAULTS = evalLiteral(html, /const\s+DEFAULTS\s*=\s*\{/, "{", "}") || {};
const PHASES = evalLiteral(html, /const\s+PHASES\s*=\s*\[/, "[", "]") || [];
const tabs = [...html.matchAll(/data-tab="([^"]+)"/g)].map((m) => m[1]);

const settings = DEFAULTS.settings || {};
const budgets = (DEFAULTS.budgets && typeof DEFAULTS.budgets === "object" && !Array.isArray(DEFAULTS.budgets)) ? DEFAULTS.budgets : {};
const categories = Array.isArray(DEFAULTS.categories) ? DEFAULTS.categories : [];
const recurring = Array.isArray(DEFAULTS.recurring) ? DEFAULTS.recurring : [];
const commitments = Array.isArray(DEFAULTS.commitments) ? DEFAULTS.commitments : [];
const debts = Array.isArray(DEFAULTS.debts) ? DEFAULTS.debts : [];
const entries = Array.isArray(DEFAULTS.entries) ? DEFAULTS.entries : [];
const plannedTotal = Object.keys(budgets).reduce((a, k) => a + (+budgets[k] || 0), 0);
const debtTotal = debts.reduce((a, d) => a + (+d.startingBalance || 0), 0);

const FILES = ["index.html", "sw.js", "manifest.json", "README.md",
  "icon-180.png", "icon-192.png", "icon-512.png",
  "docs/generate-docs.mjs", ".githooks/pre-commit", ".gitattributes"];
const fileRows = FILES.filter((f) => existsSync(abs(f))).map(
  (f) => `| \`${f}\` | ${nf(statSync(abs(f)).size)} | \`${sha256(f).slice(0, 16)}\` |`
);

// ---- build the generated block ----
const auto =
`${START} — produced by docs/generate-docs.mjs · DO NOT EDIT BY HAND -->
_Synced **${today}** · app version **${cache}** · storage key \`${key}\`_

### Identity
- **${manifest.name || "Finance Tracker"}** — ${manifest.description || ""}
- **Display:** ${manifest.display || "?"} · **Theme:** ${manifest.theme_color || "?"}
- **Tabs:** ${tabs.join(" · ") || "—"}
- **Categories:** ${categories.length} seed, fully editable in-app (rename / icon / group / kind / rollover / archive / add)

### Income & goal (seed defaults)
| Field | Value |
|---|---|
| Salary steps | ${Object.entries(settings.salarySteps || {}).map(([m, a]) => `${nf(a)} SAR from ${m}`).join(" · ") || "none seeded — set in-app; each change takes effect from the month you pick and carries forward"} |
| Payday (day of month) | ${nf(settings.payday)} |
| House target | ${nf(settings.houseTarget)} SAR by ${settings.houseTargetMonth || "?"} |
| House saved before tracking | ${nf(settings.houseSavedStart)} SAR (entries to House savings add on top) |

### Cards & loans (seed) — total starting balance **${nf(debtTotal)} SAR**
| Name | Bank | Starting | Original | Rate | Kind | Linked |
|---|---|---|---|---|---|---|
${debts.map((d) => `| ${d.name} | ${d.bank || ""} | ${nf(d.startingBalance)} | ${nf(d.original)} | ${(+d.ratePerMonth) > 0 ? d.ratePerMonth + "%/mo" : "0%"} | ${d.kind || ""} | ${d.category || ""} |`).join("\n") || "| _(none in seed defaults)_ |  |  |  |  |  |  |"}

### Categories & budgets (seed) — planned **${nf(plannedTotal)} SAR** · ${categories.length} categories
| Category | Planned | Group | Kind |
|---|---|---|---|
${categories.map((c) => `| ${c.icon || ""} ${c.name || c.id} | ${nf(budgets[c.id])} | ${c.group || ""} | ${c.kind || "flexible"}${c.rollover ? " ↻" : ""} |`).join("\n") || "| — | | | |"}

### Recurring, commitments & entries (seed)
_${recurring.length} seed recurring ${recurring.length === 1 ? "item" : "items"} (salary auto-creates on first run) · ${commitments.length} seed ${commitments.length === 1 ? "commitment" : "commitments"} · ${entries.length} seed ${entries.length === 1 ? "entry" : "entries"} — your income, expenses & payments live here._

### Seed roadmap (copied into your data on first run — edit it in Goals)
| # | Phase | Window | Goal |
|---|---|---|---|
${PHASES.map((p, i) => `| ${i + 1} | ${p.name} — ${p.title} | ${p.start} → ${p.end} | ${p.goal} |`).join("\n") || "| — | | | |"}

### Source file manifest (SHA-256, first 16 hex)
| File | Bytes | Hash |
|---|---|---|
${fileRows.join("\n")}
${END}`;

// ---- splice into DOCUMENTATION.md ----
const DOC = "DOCUMENTATION.md";
let doc = existsSync(abs(DOC)) ? read(DOC) : `# Finance Tracker — App Documentation\n\n${START} -->\n${END}\n`;
const s = doc.indexOf(START), e = doc.indexOf(END);
doc = (s >= 0 && e > s)
  ? doc.slice(0, s) + auto + doc.slice(e + END.length)
  : doc + "\n\n" + auto + "\n";
doc = doc.replace(/<!-- VERSION -->[\s\S]*?<!-- \/VERSION -->/,
  `<!-- VERSION --> app **${cache}** · docs synced **${today}** <!-- /VERSION -->`);
writeFileSync(abs(DOC), doc);
console.log(`[docs] DOCUMENTATION.md synced — version ${cache}, ${today}, ${fileRows.length} files indexed`);
