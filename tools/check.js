#!/usr/bin/env node
/* Validation pass for a project with no framework to lean on:
   confirms every generated page exists, that its metadata is unique, and
   that no page references an asset that isn't in the repo. */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data/projects.json"), "utf8"));

const errors = [];
const seen = { title: new Map(), desc: new Map(), canonical: new Map() };

/** Every .html file in the repo, ignoring node_modules and dotfiles. */
function htmlFiles(dir = ROOT, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const pages = htmlFiles();

for (const file of pages) {
  const relFile = path.relative(ROOT, file);
  const html = fs.readFileSync(file, "utf8");
  const pick = (re) => (html.match(re) || [])[1];

  const title = pick(/<title>([^<]*)<\/title>/);
  const desc = pick(/<meta name="description" content="([^"]*)"/);
  const canonical = pick(/<link rel="canonical" href="([^"]*)"/);
  const noindex = /name="robots" content="noindex/.test(html);

  if (!title) errors.push(`${relFile}: no <title>`);
  if (!desc) errors.push(`${relFile}: no meta description`);
  if (!canonical && !noindex) errors.push(`${relFile}: no canonical URL`);

  for (const [key, value] of [["title", title], ["desc", desc], ["canonical", canonical]]) {
    if (!value) continue;
    const prev = seen[key].get(value);
    if (prev) errors.push(`${relFile}: duplicate ${key} — also in ${prev}`);
    else seen[key].set(value, relFile);
  }

  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length !== 1) errors.push(`${relFile}: expected exactly one <h1>, found ${h1s.length}`);

  // local asset references must resolve on disk
  const dir = path.dirname(file);
  const refs = [...html.matchAll(/(?:src|href)="([^"#?]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(ref)) continue;
    const target = path.resolve(dir, ref);
    const candidate = ref.endsWith("/") ? path.join(target, "index.html") : target;
    if (!fs.existsSync(candidate)) errors.push(`${relFile}: broken reference -> ${ref}`);
  }
}

// every project in the data must have produced a page
for (const p of DATA.projects) {
  const page = path.join(ROOT, "work", p.slug, "index.html");
  if (!fs.existsSync(page)) errors.push(`data: project "${p.slug}" has no generated page`);
  for (const asset of [p.poster, p.media, p.hoverLoop, ...(p.gallery || [])].filter(Boolean)) {
    if (!fs.existsSync(path.join(ROOT, asset))) errors.push(`data: ${p.slug} -> missing asset ${asset}`);
  }
}

// sitemap must list exactly the crawlable pages
const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
for (const p of DATA.projects) {
  if (!sitemap.includes(`/work/${p.slug}/`)) errors.push(`sitemap: missing /work/${p.slug}/`);
}

if (errors.length) {
  console.error(`check: ${errors.length} problem(s)\n` + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log(`check: ${pages.length} pages OK — unique metadata, one h1 each, all references resolve`);
