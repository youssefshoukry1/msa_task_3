// Step 4: convert the exported Mowix home page HTML into JSX section components.
// Run from the project root: node mowix-export/convert-html.mjs
// Output: src/app/components/mowix/*.jsx (overwrites them — re-run only before hand edits).
import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "parse5";

const ROOT = process.cwd();
const EXPORT_DIR = path.join(ROOT, "mowix-export");
const OUT_DIR = path.join(ROOT, "src", "app", "components", "mowix");
const PUBLIC_DIR = path.join(ROOT, "public");
const SITE = "https://pawzia.foxcreation.online/mowix/";
const HOST = "pawzia.foxcreation.online";
const SVG_NS = "http://www.w3.org/2000/svg";

// Top-level Elementor containers of the home page (post 971), in page order.
const SECTIONS = [
  ["7fb7d3ba", "Hero"],
  ["1fdee9fc", "Stats"],
  ["177374ed", "Services"],
  ["2c8fd3ca", "About"],
  ["4952e34f", "ParallaxBand"],
  ["433b8abf", "Process"],
  ["7fbc4fc7", "Projects"],
  ["3a024c01", "Testimonials"],
  ["5d8eebdc", "Cta"],
  ["78696582", "Blog"],
];

// Widgets whose whole settings object drives front-end behaviour (step 5).
const BEHAVIOUR_WIDGETS = ["nested-carousel", "nested-tabs", "nested-accordion", "nav-menu", "text-path", "loop-grid"];
// Settings kept on any element: entrance animations, motion effects, sticky, video backgrounds.
const BEHAVIOUR_KEY = /^(_?animation|motion_fx_|background_motion_fx_|sticky|background_video_|background_slideshow_)/;

const DROP_TAGS = new Set(["script", "noscript", "style", "link", "template", "meta"]);
const DROP_ATTRS = new Set(["srcset", "sizes", "data-element_type", "data-e-type", "data-elementor-post-type"]);
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const BOOLEAN = new Set(["open", "hidden", "disabled", "checked", "selected", "required", "multiple", "autoplay", "muted", "loop", "controls", "playsinline", "allowfullscreen", "novalidate", "readonly", "defer", "async", "itemscope", "inert", "reversed", "default"]);
const RENAME = {
  class: "className", for: "htmlFor", tabindex: "tabIndex", readonly: "readOnly", maxlength: "maxLength",
  colspan: "colSpan", rowspan: "rowSpan", crossorigin: "crossOrigin", autocomplete: "autoComplete",
  fetchpriority: "fetchPriority", frameborder: "frameBorder", allowfullscreen: "allowFullScreen",
  datetime: "dateTime", enctype: "encType", novalidate: "noValidate", playsinline: "playsInline",
  autoplay: "autoPlay", contenteditable: "contentEditable", spellcheck: "spellCheck", accesskey: "accessKey",
  referrerpolicy: "referrerPolicy", itemprop: "itemProp", itemscope: "itemScope", itemtype: "itemType",
  inputmode: "inputMode", charset: "charSet", "http-equiv": "httpEquiv", "accept-charset": "acceptCharset",
  usemap: "useMap", hreflang: "hrefLang", srcdoc: "srcDoc",
};
const INLINE = new Set(["a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn", "em", "i", "img", "kbd", "label", "mark", "q", "s", "samp", "small", "span", "strong", "sub", "sup", "time", "u", "var", "svg", "button", "input", "select", "textarea", "del", "ins"]);
const NO_WHITESPACE = new Set(["table", "thead", "tbody", "tfoot", "tr", "colgroup", "select", "ul", "ol", "dl", "details", "picture", "video", "audio"]);

const manifest = JSON.parse(await fs.readFile(path.join(EXPORT_DIR, "manifest.json"), "utf8"));
const report = { links: {}, extraAssets: [], droppedTags: {}, warnings: [] };

// ---------- helpers
const attr = (node, name) => node.attrs?.find((a) => a.name === name && !a.prefix)?.value;
const classes = (node) => (attr(node, "class") || "").split(/\s+/).filter(Boolean);
function find(node, pred) {
  if (pred(node)) return node;
  for (const child of node.childNodes || []) {
    const hit = find(child, pred);
    if (hit) return hit;
  }
  return null;
}

function localPathFor(abs) {
  const u = new URL(abs);
  if (u.hostname !== HOST) return null;
  const uploads = "/mowix/wp-content/uploads/sites/9/";
  if (u.pathname.startsWith(uploads)) return "/mowix/images/" + u.pathname.slice(uploads.length);
  if (u.pathname.startsWith("/mowix/wp-content/")) return "/mowix/assets/" + u.pathname.slice("/mowix/wp-content/".length);
  return null;
}

// Image/asset URL -> local public path (downloading anything the export didn't already fetch).
function mapAsset(url) {
  let u;
  try { u = new URL(url, SITE); } catch { return url; }
  if (u.hostname !== HOST) return url;
  u.search = ""; u.hash = "";
  const known = manifest.assets[u.href];
  if (known) return known.local;
  const local = localPathFor(u.href);
  if (!local) return url;
  if (!report.extraAssets.some((a) => a.remote === u.href)) report.extraAssets.push({ remote: u.href, local });
  return local;
}

// Links to other WordPress pages don't exist in this app yet: home -> "/", everything else -> "#".
function mapHref(href) {
  if (!href || href.startsWith("#") || /^(mailto|tel):/i.test(href)) return href;
  let u;
  try { u = new URL(href, SITE); } catch { return href; }
  if (u.hostname !== HOST) return href;
  const local = u.pathname === "/mowix/" || u.pathname === "/mowix" ? "/" : "#";
  report.links[u.href] = local;
  return local;
}

function filterSettings(node, raw) {
  let settings;
  try { settings = JSON.parse(raw); } catch { report.warnings.push(`bad data-settings on ${attr(node, "data-id")}`); return null; }
  const widget = (attr(node, "data-widget_type") || "").split(".")[0];
  const keepAll = BEHAVIOUR_WIDGETS.includes(widget);
  const out = {};
  for (const [k, v] of Object.entries(settings)) {
    if (k.startsWith("_transform")) continue;
    if (keepAll || BEHAVIOUR_KEY.test(k) || (k === "background_background" && ["video", "slideshow"].includes(v))) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

function splitDeclarations(style) {
  const out = [];
  let depth = 0, quote = null, cur = "";
  for (const ch of style) {
    if (quote) { if (ch === quote) quote = null; }
    else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === ";" && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function styleObject(style) {
  const entries = [];
  for (const decl of splitDeclarations(style)) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim().replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (_, q, u) => `url(${q}${mapAsset(u.trim())}${q})`);
    if (!prop || !value) continue;
    const key = prop.startsWith("--") ? prop : prop.replace(/^-ms-/, "ms-").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    entries.push(`${/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)}: ${JSON.stringify(value)}`);
  }
  return entries.length ? `{{ ${entries.join(", ")} }}` : null;
}

const jsxString = (v) => (/["&{}<>\\\n]/.test(v) ? `{${JSON.stringify(v)}}` : `"${v}"`);

function attributes(node) {
  const isSvg = node.namespaceURI === SVG_NS;
  const out = [];
  for (const a of node.attrs) {
    let name = a.prefix ? `${a.prefix}:${a.name}` : a.name;
    let value = a.value;
    if (DROP_ATTRS.has(name) || /^on[a-z]+$/i.test(name)) continue;

    if (name === "data-settings") {
      const settings = filterSettings(node, value);
      if (!settings) continue;
      const json = JSON.stringify(settings);
      // Single-quoted JSX strings take braces and double quotes verbatim; only ' and & need the escaped form.
      out.push(/['&]/.test(json) ? `data-settings={${JSON.stringify(json)}}` : `data-settings='${json}'`);
      continue;
    }
    if (name === "style") {
      const obj = styleObject(value);
      if (obj) out.push(`style=${obj}`);
      continue;
    }
    if (name === "href" && node.tagName === "a") value = mapHref(value);
    if (name === "src" || name === "poster") value = mapAsset(value);
    if (name === "data-url" || name === "data-src") value = mapAsset(value);

    if (RENAME[name]) name = RENAME[name];
    else if (name === "xlink:href") name = "xlinkHref";
    else if (name === "xml:space") name = "xmlSpace";
    else if (name === "xmlns:xlink") name = "xmlnsXlink";
    else if (isSvg && /[-:]/.test(name) && !/^(data|aria)-/.test(name)) name = name.replace(/[-:]([a-z])/g, (_, c) => c.toUpperCase());

    if (BOOLEAN.has(a.name) && (value === "" || value === a.name)) out.push(name);
    else out.push(`${name}=${jsxString(value)}`);
  }
  return out.length ? " " + out.join(" ") : "";
}

function escapeText(t) {
  return t
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\{/g, "&#123;").replace(/\}/g, "&#125;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
    .replace(/ /g, "&nbsp;");
}

// ---------- shared icons
const icons = new Map(); // name -> { viewBox, d }
function iconName(node) {
  if (node.tagName !== "svg" || node.namespaceURI !== SVG_NS) return null;
  const m = (attr(node, "class") || "").match(/^e-font-icon-svg e-([a-z0-9-]+)$/);
  if (!m) return null;
  const allowed = new Set(["aria-hidden", "class", "viewBox", "xmlns"]);
  if (!node.attrs.every((a) => allowed.has(a.name) && !a.prefix) || attr(node, "aria-hidden") !== "true") return null;
  const kids = node.childNodes.filter((c) => c.nodeName !== "#text" || c.value.trim());
  if (kids.length !== 1 || kids[0].tagName !== "path" || kids[0].attrs.length !== 1 || !attr(kids[0], "d")) return null;
  const icon = { viewBox: attr(node, "viewBox"), d: attr(kids[0], "d") };
  const existing = icons.get(m[1]);
  if (existing && (existing.viewBox !== icon.viewBox || existing.d !== icon.d)) return null;
  icons.set(m[1], icon);
  return m[1];
}

// ---------- JSX rendering
function render(node, indent, ctx) {
  const pad = "  ".repeat(indent);
  const icon = iconName(node);
  if (icon) { ctx.usesIcon = true; return [`${pad}<Icon name="${icon}" />`]; }

  const tag = node.tagName;
  const open = `<${tag}${attributes(node)}`;
  if (VOID.has(tag)) return [`${pad}${open} />`];

  const children = childTokens(node);
  if (!children.length) return [`${pad}${open} />`];
  if (children.length === 1 && children[0].type === "text") {
    return [`${pad}${open}>${escapeText(children[0].value)}</${tag}>`];
  }
  const lines = [`${pad}${open}>`];
  for (const tok of children) {
    if (tok.type === "el") lines.push(...render(tok.node, indent + 1, ctx));
    else {
      const t = tok.value;
      if (!t.trim()) { lines.push(`${pad}  {" "}`); continue; }
      const lead = t.startsWith(" ") ? `{" "}` : "";
      const trail = t.endsWith(" ") ? `{" "}` : "";
      lines.push(`${pad}  ${lead}${escapeText(t.trim())}${trail}`);
    }
  }
  lines.push(`${pad}</${tag}>`);
  return lines;
}

function childTokens(node) {
  const tag = node.tagName;
  const inSvgText = node.namespaceURI === SVG_NS && !["text", "textPath", "tspan", "title", "desc"].includes(tag);
  const tokens = [];
  for (const child of node.childNodes || []) {
    if (child.nodeName === "#comment") continue;
    if (child.nodeName === "#text") {
      tokens.push({ type: "text", value: child.value.replace(/[ \t\n\r\f]+/g, " ") });
    } else if (DROP_TAGS.has(child.tagName)) {
      report.droppedTags[child.tagName] = (report.droppedTags[child.tagName] || 0) + 1;
    } else {
      tokens.push({ type: "el", node: child });
    }
  }
  // merge adjacent text
  const merged = [];
  for (const t of tokens) {
    const last = merged[merged.length - 1];
    if (t.type === "text" && last?.type === "text") last.value = (last.value + t.value).replace(/ +/g, " ");
    else merged.push(t);
  }
  const isInline = (t) => t && (t.type === "text" || INLINE.has(t.node.tagName));
  const out = [];
  merged.forEach((t, i) => {
    if (t.type === "el") return out.push(t);
    let v = t.value;
    if (i === 0) v = v.replace(/^ /, "");
    if (i === merged.length - 1) v = v.replace(/ $/, "");
    if (!v) return;
    if (!v.trim()) {
      if (NO_WHITESPACE.has(tag) || inSvgText) return;
      if (!(isInline(merged[i - 1]) && isInline(merged[i + 1]))) return;
    }
    out.push({ type: "text", value: v });
  });
  return out;
}

function component(name, source, bodyLines, ctx) {
  const header = [
    ctx.usesImg ? "/* eslint-disable @next/next/no-img-element */" : null,
    `// Generated from the Mowix WordPress home page (${source}) by mowix-export/convert-html.mjs.`,
    ctx.usesIcon ? `import Icon from "./Icon";` : null,
  ].filter(Boolean);
  return `${header.join("\n")}\n\nexport default function ${name}() {\n  return (\n${bodyLines.join("\n")}\n  );\n}\n`;
}

async function writeComponent(name, source, node) {
  const ctx = { usesIcon: false };
  const lines = render(node, 2, ctx);
  ctx.usesImg = lines.some((l) => /<img\b/.test(l));
  const code = component(name, source, lines, ctx);
  await fs.writeFile(path.join(OUT_DIR, `${name}.jsx`), code);
  console.log(`${(name + ".jsx").padEnd(22)} ${(code.length / 1024).toFixed(1).padStart(6)} KB`);
}

// ---------- main
const html = await fs.readFile(path.join(EXPORT_DIR, "home.original.html"), "utf8");
const doc = parse(html);
await fs.mkdir(OUT_DIR, { recursive: true });

const header = find(doc, (n) => attr(n, "data-elementor-type") === "header");
const footer = find(doc, (n) => attr(n, "data-elementor-type") === "footer");
const pageRoot = find(doc, (n) => attr(n, "data-elementor-type") === "wp-page");
if (!header || !footer || !pageRoot) throw new Error("header/footer/page root not found");

await writeComponent("MowixHeader", "Elementor header template 335", header);
for (const [id, name] of SECTIONS) {
  const node = pageRoot.childNodes.find((c) => c.tagName && classes(c).includes(`elementor-element-${id}`));
  if (!node) throw new Error(`section ${id} not found`);
  await writeComponent(name, `Elementor page 971, container ${id}`, node);
}
await writeComponent("MowixFooter", "Elementor footer template 1002", footer);

const expected = SECTIONS.length;
const actual = pageRoot.childNodes.filter((c) => c.tagName).length;
if (actual !== expected) report.warnings.push(`page root has ${actual} element children, ${expected} converted`);

// Shared icon component
const iconEntries = [...icons].sort(([a], [b]) => a.localeCompare(b))
  .map(([n, i]) => `  ${JSON.stringify(n)}: {\n    viewBox: ${JSON.stringify(i.viewBox)},\n    d: ${JSON.stringify(i.d)},\n  },`);
await fs.writeFile(path.join(OUT_DIR, "Icon.jsx"), `// Elementor inline SVG icons used on the Mowix home page (Font Awesome / eicons).
// Generated by mowix-export/convert-html.mjs.
const ICONS = {
${iconEntries.join("\n")}
};

export default function Icon({ name }) {
  const icon = ICONS[name];
  return (
    <svg aria-hidden="true" className={\`e-font-icon-svg e-\${name}\`} viewBox={icon.viewBox} xmlns="http://www.w3.org/2000/svg">
      <path d={icon.d} />
    </svg>
  );
}
`);
console.log(`Icon.jsx               ${icons.size} icons`);

// Page wrapper attributes, for page.jsx
report.pageRootAttributes = attributes(pageRoot).trim();
report.metaDescription = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || null;

// Download assets referenced only by the markup (e.g. text-path SVG) that the export didn't fetch.
for (const a of report.extraAssets) {
  const dest = path.join(PUBLIC_DIR, ...a.local.split("/").filter(Boolean));
  const res = await fetch(a.remote);
  if (!res.ok) { report.warnings.push(`download failed ${a.remote}: ${res.status}`); continue; }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

await fs.writeFile(path.join(EXPORT_DIR, "convert-report.json"), JSON.stringify(report, null, 2));
console.log("\nextra assets:", report.extraAssets.map((a) => a.local));
console.log("dropped tags:", report.droppedTags);
console.log("page root attrs:", report.pageRootAttributes);
console.log("warnings:", report.warnings);
