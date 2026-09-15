// Step 4 check: compare the rendered Next.js home page against the original WordPress markup.
// Needs the dev server on :3000. Run from the project root: node mowix-export/verify-render.mjs
import fs from "node:fs/promises";
import { parse, serializeOuter } from "parse5";

const original = parse(await fs.readFile("mowix-export/home.original.html", "utf8"));
const res = await fetch("http://localhost:3000/");
const renderedHtml = await res.text();
const rendered = parse(renderedHtml);

const attr = (n, name) => n.attrs?.find((a) => a.name === name)?.value;
const walk = (n, fn) => { fn(n); (n.childNodes || []).forEach((c) => walk(c, fn)); };
const find = (n, pred) => { let hit = null; walk(n, (x) => { if (!hit && pred(x)) hit = x; }); return hit; };

// Structural signature: tag + classes of every element, in document order (skipping dropped tags).
const SKIP = new Set(["script", "noscript", "style", "link", "template", "meta"]);
function signature(root) {
  const out = [];
  const visit = (n) => {
    if (!n.tagName || SKIP.has(n.tagName)) return;
    out.push(`${n.tagName}.${(attr(n, "class") || "").trim().split(/\s+/).sort().join(".")}`);
    (n.childNodes || []).forEach(visit);
  };
  visit(root);
  return out;
}

let failures = 0;
for (const type of ["header", "wp-page", "footer"]) {
  const a = find(original, (n) => attr(n, "data-elementor-type") === type);
  const b = find(rendered, (n) => attr(n, "data-elementor-type") === type);
  const sa = signature(a), sb = signature(b);
  const firstDiff = sa.findIndex((s, i) => s !== sb[i]);
  const same = sa.length === sb.length && firstDiff === -1;
  if (!same) failures++;
  console.log(`${type.padEnd(8)} original ${sa.length} elements, rendered ${sb.length} — ${same ? "identical structure" : `differs at #${firstDiff}: ${sa[firstDiff]} vs ${sb[firstDiff]}`}`);
}

// Hydration safety: HTML the browser re-parses must keep the same tree React produced.
const page = find(rendered, (n) => attr(n, "class") === "elementor-kit-3");
const once = serializeOuter(page);
const twice = serializeOuter(find(parse(`<!doctype html><body>${once}`), (n) => attr(n, "class") === "elementor-kit-3"));
console.log("browser re-parse stable (no invalid nesting):", once === twice);
if (once !== twice) failures++;

// Text content check
const text = (n) => { let t = ""; walk(n, (x) => { if (x.nodeName === "#text" && !SKIP.has(x.parentNode?.tagName)) t += x.value; }); return t.replace(/\s+/g, " ").trim(); };
for (const type of ["header", "wp-page", "footer"]) {
  const ta = text(find(original, (n) => attr(n, "data-elementor-type") === type));
  const tb = text(find(rendered, (n) => attr(n, "data-elementor-type") === type));
  const same = ta.replace(/\s/g, "") === tb.replace(/\s/g, "");
  if (!same) failures++;
  console.log(`${type.padEnd(8)} text ${same ? "identical" : "DIFFERS"} (${ta.length} chars)`);
}

// Every image and CSS asset the page requests must exist
const urls = new Set();
walk(rendered, (n) => {
  const s = attr(n, "src"); if (s && s.startsWith("/mowix/")) urls.add(s);
  const st = attr(n, "style"); if (st) for (const m of st.matchAll(/url\(([^)]+)\)/g)) urls.add(m[1].replace(/['"]/g, ""));
  const du = attr(n, "data-url"); if (du) urls.add(du);
});
let missing = 0;
for (const u of urls) { const r = await fetch("http://localhost:3000" + u, { method: "HEAD" }); if (!r.ok) { missing++; console.log("  missing", r.status, u); } }
console.log(`local assets referenced by markup: ${urls.size}, missing: ${missing}`);
console.log("remote WordPress URLs left in rendered page:", (renderedHtml.match(/pawzia\.foxcreation\.online/g) || []).length);
console.log("Navbar/Footer placeholders on home:", /h-10 bg-gray-500/.test(renderedHtml) ? "PRESENT" : "hidden");
process.exitCode = failures + missing ? 1 : 0;
