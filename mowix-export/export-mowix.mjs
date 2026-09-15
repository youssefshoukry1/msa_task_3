// Steps 1–2: download the Mowix home page, its stylesheets (in load order) and the
// assets it actually uses. Run from the project root: node mowix-export/export-mowix.mjs
import fs from "node:fs/promises";
import path from "node:path";

const PAGE_URL = "https://pawzia.foxcreation.online/mowix/";
const HOST = "pawzia.foxcreation.online";
const UPLOADS = "/mowix/wp-content/uploads/sites/9/";
const WP_CONTENT = "/mowix/wp-content/";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const ROOT = process.cwd();
const EXPORT_DIR = path.join(ROOT, "mowix-export");
const CSS_DIR = path.join(EXPORT_DIR, "css");
const PUBLIC_DIR = path.join(ROOT, "public");

const decode = (s) => s.replace(/&#0?38;|&amp;/g, "&");

async function fetchWithRetry(url, asText) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return asText ? await res.text() : Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt >= 3) throw new Error(`${url}: ${err.message}`);
    }
  }
}

// Map a remote wp-content URL to its public path, or null if it isn't ours to host.
function localPathFor(absUrl) {
  const u = new URL(absUrl);
  if (u.hostname !== HOST) return null;
  if (u.pathname.startsWith(UPLOADS)) return "/mowix/images/" + u.pathname.slice(UPLOADS.length);
  if (u.pathname.startsWith(WP_CONTENT)) return "/mowix/assets/" + u.pathname.slice(WP_CONTENT.length);
  return null;
}

const assets = new Map(); // remote URL (no query/hash) -> { local, usedBy:Set }
function addAsset(absUrl, usedBy) {
  const u = new URL(absUrl);
  u.search = "";
  u.hash = "";
  const local = localPathFor(u.href);
  if (!local) return null;
  if (!assets.has(u.href)) assets.set(u.href, { local, usedBy: new Set() });
  assets.get(u.href).usedBy.add(usedBy);
  return local;
}

async function main() {
  await fs.mkdir(CSS_DIR, { recursive: true });

  // ---- Step 1a: page HTML
  const html = await fetchWithRetry(PAGE_URL, true);
  await fs.writeFile(path.join(EXPORT_DIR, "home.original.html"), html);
  console.log(`HTML: ${html.length} chars`);

  // ---- Step 1b: stylesheets + inline <style> blocks, in document order
  const styleRe = /<link\b[^>]*rel=['"]stylesheet['"][^>]*>|<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
  const cssEntries = [];
  const skipped = [];
  let m;
  while ((m = styleRe.exec(html))) {
    if (m[0].startsWith("<link")) {
      const href = decode(m[0].match(/href=['"]([^'"]+)['"]/i)[1]);
      if (new URL(href).hostname !== HOST) {
        skipped.push({ href, reason: "external (Google Fonts → next/font in step 3)" });
        continue;
      }
      const id = (m[0].match(/id=['"]([^'"]+)['"]/i) || [])[1] || path.basename(new URL(href).pathname);
      cssEntries.push({ kind: "file", id, source: href });
    } else {
      const id = (m[1].match(/id=['"]([^'"]+)['"]/i) || [])[1] || "inline";
      cssEntries.push({ kind: "inline", id, css: m[2] });
    }
  }

  let n = 0;
  for (const entry of cssEntries) {
    n++;
    const base = entry.kind === "file" ? entry.source : PAGE_URL;
    let css = entry.kind === "file" ? await fetchWithRetry(entry.source, true) : entry.css;
    const originalSize = css.length;

    // Rewrite url(...) to local paths, registering each asset for download.
    css = css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (full, q, raw) => {
      raw = raw.trim();
      if (raw.startsWith("data:") || raw.startsWith("#")) return full;
      let abs;
      try { abs = new URL(raw, base); } catch { return full; }
      const local = addAsset(abs.href, entry.id);
      return local ? `url(${q}${local}${abs.hash}${q})` : full;
    });

    const file = `${String(n).padStart(2, "0")}-${entry.id.replace(/[^\w.-]+/g, "_").replace(/\.css$/, "")}.css`;
    await fs.writeFile(path.join(CSS_DIR, file), css);
    entry.file = `css/${file}`;
    entry.bytes = originalSize;
    delete entry.css;
    console.log(`CSS ${file} (${originalSize} bytes)`);
  }

  // ---- Step 2a: images actually rendered by the page (src + favicons; srcset size variants skipped)
  const norm = html.split("\\/").join("/");
  const srcUrls = [...html.matchAll(/\ssrc=["']([^"']+)["']/g)].map((x) => decode(x[1]));
  const iconUrls = [...html.matchAll(/<link\b[^>]*rel=['"](?:icon|apple-touch-icon)['"][^>]*>/gi)]
    .map((x) => (x[0].match(/href=['"]([^'"]+)['"]/i) || [])[1]).filter(Boolean);
  const settingsUrls = norm.match(/https?:\/\/pawzia\.foxcreation\.online\/mowix\/wp-content\/uploads\/[^"'\s),;&]+?\.(?:jpe?g|png|webp|svg|gif|avif|mp4|webm)/gi) || [];
  const srcsetUrls = new Set([...html.matchAll(/srcset=["']([^"']+)["']/g)]
    .flatMap((x) => x[1].split(",").map((p) => p.trim().split(/\s+/)[0])));

  for (const u of srcUrls) if (u.includes("/wp-content/uploads/")) addAsset(u, "html:src");
  for (const u of iconUrls) addAsset(decode(u), "html:icon");
  // URLs that appear only outside src/srcset (e.g. JSON widget settings)
  const srcSet = new Set(srcUrls);
  for (const u of settingsUrls) if (!srcSet.has(u) && !srcsetUrls.has(u)) addAsset(u, "html:other");

  // ---- Step 2b: download assets into public/
  const failures = [];
  const queue = [...assets.entries()];
  let totalBytes = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const [remote, info] = queue.shift();
      const dest = path.join(PUBLIC_DIR, ...info.local.split("/").filter(Boolean));
      try {
        const buf = await fetchWithRetry(remote, false);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, buf);
        info.bytes = buf.length;
        totalBytes += buf.length;
      } catch (err) {
        failures.push({ remote, error: err.message });
      }
    }
  }));

  const skippedVariants = [...srcsetUrls].filter((u) => {
    try { const x = new URL(u); x.search = ""; return !assets.has(x.href); } catch { return false; }
  });

  const manifest = {
    page: PAGE_URL,
    exportedAt: new Date().toISOString(),
    stylesheets: cssEntries,
    skippedStylesheets: skipped,
    assets: Object.fromEntries([...assets].map(([remote, i]) => [remote, { local: i.local, bytes: i.bytes ?? null, usedBy: [...i.usedBy] }])),
    skippedSrcsetVariants: skippedVariants,
    failures,
  };
  await fs.writeFile(path.join(EXPORT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`\nStylesheets: ${cssEntries.length} saved, ${skipped.length} external skipped`);
  console.log(`Assets: ${assets.size - failures.length}/${assets.size} downloaded (${(totalBytes / 1048576).toFixed(1)} MB)`);
  console.log(`srcset size variants skipped: ${skippedVariants.length}`);
  if (failures.length) { console.log("FAILURES:"); failures.forEach((f) => console.log("  " + f.remote + " — " + f.error)); process.exitCode = 1; }
}

main().catch((err) => { console.error(err); process.exit(1); });
