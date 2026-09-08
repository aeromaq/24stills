#!/usr/bin/env node
/* ============================================================
   24STILLS — static site generator for CMS-driven Work content.

   Single source of truth: data/projects.json (mirrors the Webflow
   CMS collection "Work Projects" field-for-field).

   Emits:
     work/<slug>/index.html   one reusable detail-page template per project
     work.html                the mosaic listing (between build markers)
     index.html               the featured work list (between build markers)
     sitemap.xml              every crawlable URL

   Zero dependencies. Run: node tools/build.js
   ============================================================ */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data/projects.json"), "utf8"));
const { site } = DATA;
const projects = [...DATA.projects].sort((a, b) => a.order - b.order);

/* ---------- helpers ---------- */

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Absolute site URL for a repo-relative path. */
const abs = (p) => site.origin.replace(/\/$/, "") + "/" + String(p).replace(/^\//, "");

/** Prefix a repo-root-relative asset path for a page nested `depth` levels deep. */
const rel = (p, depth) => (depth ? "../".repeat(depth) : "") + p;

const projectUrl = (p, depth) => rel(`work/${p.slug}/`, depth);

/** Alt text that describes the frame, never just the file name. */
const posterAlt = (p) => `${p.client} — ${p.name}, ${p.format.toLowerCase()} by 24stills`;

/** Write only when the bytes actually change, so mtimes stay meaningful. */
function write(file, contents) {
  const full = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const prev = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
  if (prev === contents) return false;
  fs.writeFileSync(full, contents);
  return true;
}

/** Replace the region between `<!-- build:name -->` and `<!-- /build:name -->`. */
function inject(html, name, block) {
  const open = `<!-- build:${name} -->`;
  const close = `<!-- /build:${name} -->`;
  const i = html.indexOf(open);
  const j = html.indexOf(close);
  if (i === -1 || j === -1) throw new Error(`build markers for "${name}" not found`);
  return html.slice(0, i + open.length) + "\n" + block + "\n      " + html.slice(j);
}

/* ---------- shared page chrome ---------- */

/* Anti-FOUC hand-off for the cinema-bar page transition. Must run before
   first paint, so it stays inline in <head> on every page. */
const NAV_SCRIPT = `  <script>
    (function () {
      try {
        if (sessionStorage.getItem("24s-nav") === "1") {
          document.documentElement.classList.add("nav-incoming");
          sessionStorage.removeItem("24s-nav");
        }
      } catch (e) {}
    })();
  </script>`;

function head({ title, description, canonical, ogImage, ogType = "website", depth = 0, jsonLd = [], extra = "" }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
${NAV_SCRIPT}
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${esc(canonical)}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="24stills" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(ogImage)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(ogImage)}" />
  <link rel="icon" type="image/png" href="${rel("assets/logos/24stills-submark.png", depth)}" />
  <link rel="apple-touch-icon" href="${rel("assets/logos/24stills-submark.png", depth)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${rel("css/style.css", depth)}" />
${jsonLd.map((o) => `  <script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n  </script>`).join("\n")}${extra}
</head>`;
}

function chrome(depth) {
  const r = (p) => rel(p, depth);
  return `
  <div class="grain" aria-hidden="true"></div>

  <div class="bars" aria-hidden="true">
    <div class="bars__top"></div>
    <div class="bars__bottom"></div>
    <img class="bars__mark" src="${r("assets/logos/24stills-submark.png")}" alt="" />
  </div>

  <a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header">
    <a class="brand" href="${r("index.html")}" aria-label="24stills — home">
      <img src="${r("assets/logos/24stills-logo.png")}" alt="24stills" />
    </a>
    <nav class="site-nav" aria-label="Primary">
      <a href="${r("work.html")}">Work</a>
      <a href="${r("about.html")}">Who We Are</a>
      <a href="${r("index.html")}#services">Services</a>
      <a href="${r("index.html")}#contact">Contact</a>
    </nav>
    <button class="menu-btn" type="button" aria-label="Open menu">
      <span class="menu-btn__label">Menu</span>
      <span class="menu-btn__icon" aria-hidden="true"><span></span><span></span><span></span></span>
    </button>
  </header>

  <div class="menu-overlay" aria-hidden="true">
    <a class="menu-link" href="${r("work.html")}"><span class="idx">01</span>Work</a>
    <a class="menu-link" href="${r("about.html")}"><span class="idx">02</span>Who We Are</a>
    <a class="menu-link" href="${r("index.html")}#services"><span class="idx">03</span>Services</a>
    <a class="menu-link" href="${r("index.html")}#contact"><span class="idx">04</span>Contact</a>
    <div class="menu-foot">
      <span>Brooklyn, NY</span>
      <span>hello@24stills.net</span>
    </div>
  </div>`;
}

function contactAndFooter(depth) {
  const r = (p) => rel(p, depth);
  return `
    <section class="contact" id="contact">
      <img class="contact__bg" src="${r("assets/img/bg-contact.jpg")}" alt="" aria-hidden="true" loading="lazy" />
      <span class="eyebrow">Say Hello!</span>
      <a class="contact__email" href="mailto:${site.email}">${site.email}</a>
      <p class="place">Brooklyn — NY</p>
    </section>

  </main>

  <footer class="site-footer">
    <div class="col-left">
      <p>24stills LLC.<br />Brooklyn, NY</p>
      <a href="mailto:${site.email}">${site.email}</a>
      <div class="social">
        <a href="${site.instagram}" target="_blank" rel="noopener">Instagram</a>
        <a href="${site.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
      </div>
    </div>
    <div class="col-right">
      <img class="brandmark" src="${r("assets/logos/24stills-logo.png")}" alt="24stills" />
      <a href="${r("work.html")}">Work</a>
      <a href="${r("about.html")}">About Us</a>
      <a href="${r("index.html")}#services">Services</a>
    </div>
    <div class="legal">
      <span>© <span data-year>2026</span> 24stills, LLC</span>
      <span>Story-Driven Content</span>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  <script src="${r("js/main.js")}"></script>
</body>
</html>`;
}

/* ---------- work cards ---------- */

/** Mosaic tile used on work.html and the weddings raster — image, label, no body copy. */
function mosaicTile(p, depth) {
  const loop = p.hoverLoop
    ? `\n            <video muted loop playsinline preload="none" src="${rel(p.hoverLoop, depth)}" aria-hidden="true" tabindex="-1"></video>`
    : "";
  const playable = p.mediaType === "video" || p.youtube;
  return `        <a class="mosaic__item${playable ? " has-film" : ""}" href="${projectUrl(p, depth)}">
          <div class="mosaic__media">
            <img src="${rel(p.poster, depth)}" alt="${esc(posterAlt(p))}" loading="lazy" decoding="async" />${loop}
          </div>
          <div class="mosaic__label">
            <span class="mosaic__client mono">${esc(p.brand)}</span>
            <span class="mosaic__title">${esc(p.name)}</span>
          </div>
        </a>`;
}

/** Editorial card used for the homepage's featured selection. */
function featuredCard(p, depth) {
  const loop = p.hoverLoop
    ? `\n            <video muted loop playsinline preload="none" src="${rel(p.hoverLoop, depth)}" aria-hidden="true" tabindex="-1"></video>`
    : "";
  return `        <a class="work-card" href="${projectUrl(p, depth)}">
          <div class="work-card__media reveal-media">
            <img src="${rel(p.poster, depth)}" alt="${esc(posterAlt(p))}" loading="lazy" decoding="async" />${loop}
            <span class="work-card__hint" aria-hidden="true">View Project ↗</span>
          </div>
          <div class="work-card__meta">
            <span class="mono">Content Format // ${esc(p.format)}</span>
            <span class="mono">Client // ${esc(p.client)}</span>
          </div>
          <h3 class="work-card__title display">${esc(p.name)}</h3>
        </a>`;
}

/* ---------- detail page ---------- */

/** The film block: a native <video> player, a YouTube facade, or nothing. */
function filmBlock(p, depth) {
  /* A click-to-load facade rather than a bare iframe: YouTube's embed pulls
     ~1MB and sets cookies on page load, which is a poor trade on a page whose
     film is below the fold. The poster is ours, so the tile matches the rest of
     the site; the iframe is only created once the visitor asks for it. */
  if (p.youtube) {
    return `      <section class="section detail-film">
        <div class="detail-film__frame detail-film__frame--yt" data-youtube="${esc(p.youtube)}" data-title="${esc(p.name)}">
          <img class="detail-film__poster" src="${rel(p.poster, depth)}" alt="${esc(posterAlt(p))}" loading="lazy" decoding="async" />
          <button class="detail-film__play" type="button" aria-label="Play ${esc(p.name)} on YouTube">
            <span class="ring" aria-hidden="true"></span>
            <span class="rec">Play Film</span>
          </button>
          <noscript>
            <a href="https://www.youtube.com/watch?v=${esc(p.youtube)}" target="_blank" rel="noopener">Watch ${esc(p.name)} on YouTube</a>
          </noscript>
        </div>
      </section>`;
  }
  if (p.mediaType === "video") {
    return `      <section class="section detail-film">
        <div class="detail-film__frame">
          <video class="detail-film__video" src="${rel(p.media, depth)}" poster="${rel(p.poster, depth)}"
                 preload="none" playsinline controls
                 aria-label="${esc(p.name)} — film by 24stills"></video>
          <button class="detail-film__play" type="button" aria-label="Play ${esc(p.name)}">
            <span class="ring" aria-hidden="true"></span>
            <span class="rec">Play Film</span>
          </button>
        </div>
      </section>`;
  }
  return "";
}

function detailPage(p, i) {
  const depth = 2; // work/<slug>/index.html
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  const related = projects.filter((x) => x.slug !== p.slug && x.client !== p.client).slice(0, 3);
  const canonical = abs(`work/${p.slug}/`);
  const ogImage = abs(p.poster);
  const hasFilm = p.mediaType === "video" || !!p.youtube;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: abs("") },
      { "@type": "ListItem", position: 2, name: "Work", item: abs("work.html") },
      { "@type": "ListItem", position: 3, name: p.name, item: canonical },
    ],
  };

  /* VideoObject only where an actual film exists — otherwise CreativeWork.
     No invented durations or upload dates: only fields the data supports. */
  const work = hasFilm
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: p.name,
        description: p.shortDescription,
        thumbnailUrl: ogImage,
        contentUrl: p.youtube ? `https://www.youtube.com/watch?v=${p.youtube}` : abs(p.media),
        url: canonical,
        genre: p.format,
        productionCompany: { "@type": "Organization", name: site.legalName, url: site.origin },
        about: { "@type": "Organization", name: p.client },
      }
    : {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: p.name,
        description: p.shortDescription,
        image: ogImage,
        url: canonical,
        genre: p.format,
        creator: { "@type": "Organization", name: site.legalName, url: site.origin },
        about: { "@type": "Organization", name: p.client },
      };

  const meta = [
    ["Client", p.client],
    ["Format", p.format],
    ["Year", p.year],
    ["Location", p.location],
  ]
    .filter(([, v]) => v)
    .map(
      ([k, v]) => `          <div class="detail-meta__row">
            <dt class="mono">${esc(k)}</dt>
            <dd>${esc(v)}</dd>
          </div>`
    )
    .join("\n");

  const services = p.services && p.services.length
    ? `          <div class="detail-meta__row">
            <dt class="mono">Services</dt>
            <dd>${p.services.map(esc).join(" · ")}</dd>
          </div>`
    : "";

  const gallery = p.gallery && p.gallery.length
    ? `
      <section class="section detail-gallery">
        <span class="eyebrow">04 // Stills</span>
        <div class="detail-gallery__grid">
${p.gallery
  .map(
    (g) => `          <figure class="reveal-media">
            <img src="${rel(g, depth)}" alt="${esc(`${p.client} — production still from ${p.name}`)}" loading="lazy" decoding="async" />
          </figure>`
  )
  .join("\n")}
        </div>
      </section>`
    : "";

  const relatedBlock = related.length
    ? `
      <section class="section detail-related">
        <div class="section-head">
          <h2 class="display">Related Work</h2>
          <span class="mono">More Films</span>
        </div>
        <div class="mosaic mosaic--related">
${related.map((r) => mosaicTile(r, depth)).join("\n")}
        </div>
      </section>`
    : "";

  return (
    head({
      title: p.seoTitle,
      description: p.seoDescription,
      canonical,
      ogImage,
      ogType: "article",
      depth,
      jsonLd: [work, breadcrumb],
    }) +
    `
<body class="page-detail">
${chrome(depth)}

  <main id="main">

    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${rel("index.html", depth)}">Home</a>
      <span aria-hidden="true">/</span>
      <a href="${rel("work.html", depth)}">Work</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">${esc(p.name)}</span>
    </nav>

    <!-- 01 · PROJECT HERO -->
    <section class="detail-hero">
      <img class="detail-hero__bg" src="${rel(p.poster, depth)}" alt="${esc(posterAlt(p))}" fetchpriority="high" decoding="async" />
      <div class="detail-hero__inner">
        <span class="eyebrow">${esc(p.brand)} // ${esc(p.format)}</span>
        <h1 class="detail-hero__title display">${esc(p.name)}</h1>
        <p class="detail-hero__lede">${esc(p.shortDescription)}</p>
      </div>
    </section>

${filmBlock(p, depth)}

    <!-- 02 · DESCRIPTION + METADATA -->
    <section class="section detail-body">
      <div class="detail-body__grid">
        <div>
          <span class="eyebrow">02 // The Project</span>
          <p class="detail-body__copy">${esc(p.description)}</p>
        </div>
        <dl class="detail-meta">
          <span class="eyebrow">03 // Credits</span>
${meta}
${services}
        </dl>
      </div>
    </section>
${gallery}
${relatedBlock}

    <!-- PREV / NEXT -->
    <nav class="detail-nav" aria-label="Project navigation">
      <a class="detail-nav__link detail-nav__link--prev" href="${projectUrl(prev, depth)}">
        <span class="mono">← Previous</span>
        <span class="display">${esc(prev.name)}</span>
      </a>
      <a class="detail-nav__link detail-nav__link--next" href="${projectUrl(next, depth)}">
        <span class="mono">Next →</span>
        <span class="display">${esc(next.name)}</span>
      </a>
    </nav>
` +
    contactAndFooter(depth)
  );
}

/* ---------- sitemap ---------- */

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: abs(""), priority: "1.0" },
    { loc: abs("work.html"), priority: "0.9" },
    { loc: abs("about.html"), priority: "0.8" },
    ...projects.map((p) => ({ loc: abs(`work/${p.slug}/`), priority: "0.7" })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`)
  .join("\n")}
</urlset>
`;
}

/* ---------- run ---------- */

let changed = 0;
const written = [];

projects.forEach((p, i) => {
  const file = `work/${p.slug}/index.html`;
  if (write(file, detailPage(p, i))) changed++;
  written.push(file);
});

// work.html — full mosaic
{
  const file = path.join(ROOT, "work.html");
  let html = fs.readFileSync(file, "utf8");
  html = inject(html, "work-mosaic", projects.map((p) => mosaicTile(p, 0)).join("\n"));
  html = inject(html, "work-count", `        <span class="mono">All Projects — ${String(projects.length).padStart(2, "0")}</span>`);
  if (write("work.html", html)) changed++;
}

// index.html — featured selection
{
  const file = path.join(ROOT, "index.html");
  let html = fs.readFileSync(file, "utf8");
  const featured = projects.filter((p) => p.featured);
  html = inject(html, "featured-work", featured.map((p) => featuredCard(p, 0)).join("\n"));
  html = inject(
    html,
    "featured-count",
    `        <span class="mono">Selected — ${featured.length} / ${projects.length}</span>`
  );
  if (write("index.html", html)) changed++;
}

if (write("sitemap.xml", sitemap())) changed++;

console.log(
  `build: ${projects.length} projects → ${written.length} detail pages, work.html, index.html, sitemap.xml (${changed} file(s) changed)`
);
