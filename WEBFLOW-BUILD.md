# 24stills → Webflow Build Spec

How to rebuild this site in Webflow so a **client can self-edit content** (via the
CMS) while keeping the custom GSAP motion. Written for whoever builds it in the
Webflow Designer — you, or a Webflow developer.

---

## 0. Strategy (read this first)

Webflow has no "import HTML project" button. The pragmatic, low-effort path that
still gives the client content editing is a **hybrid**:

| Layer | Approach | Why |
|---|---|---|
| **CSS** (`css/style.css`) | Host as-is, link via custom code. **Do not** rebuild as Webflow classes. | Client edits content, not design. Saves days of work. |
| **JS + GSAP** (`js/main.js`) | Host as-is, link via custom code. | The preloader, cinema-bar page transitions, and Netflix-effect overlay can't be done in native Webflow Interactions. |
| **DOM structure** | Rebuild in the Designer with **exactly matching class names / IDs / data-attributes** (see §3–4). | `style.css` and `main.js` target specific selectors. Match them and everything "just works." |
| **Work projects** | **Webflow CMS Collection** (see §5–6). | This is the one thing the client needs to edit. |

The overlay was refactored (see `js/main.js` → `getProjectData()`) to read project
data from **card `data-*` attributes first**, falling back to the built-in
`PROJECTS` map. That refactor is what makes CMS-driven projects possible.

⚠️ **Gotchas that bite everyone:**
- Custom code runs **only on the published site**, never in the Designer canvas or
  Preview — the animations will look dead while you edit. Publish to the
  `.webflow.io` staging domain to test.
- Site-wide custom-code fields are ~10 KB each, so **link** `style.css`/`main.js`
  as external files; don't paste them.
- You're on a **premium Site plan**, so custom code + CMS are both available. Good.

---

## 1. Fonts (native — easy win)

Site **Settings → Fonts → Google Fonts**, add:
- **Anton** (display) · **Archivo** weights 400/500/700 (body) · **Space Mono** 400/700 (labels)

Then the `--font-display / --font-body / --font-mono` variables in `style.css` resolve
with no extra work. (Alternatively skip this and let `style.css`'s own `@import`/`<link>`
load them — but native is cleaner and faster.)

---

## 2. Host & link the CSS + JS

This repo is **public**, so **jsDelivr** can serve the CSS, JS *and* media straight
from GitHub — no uploads needed to get running.

**Project Settings → Custom Code → Head Code:**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/aeromaq/24stills@main/css/style.css" />
```

**Project Settings → Custom Code → Footer Code:**
```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/aeromaq/24stills@main/js/main.js"></script>
```
Load order matters: GSAP → ScrollTrigger → main.js.

- While this work is unmerged, swap `@main` for `@main-6wpwcq`.
- jsDelivr caches branch refs up to ~12h — **pin a git tag** (e.g. `@v1.0.0`) for
  production so you control cache-busting.
- Alternative: upload `style.css` / `main.js` to Webflow **Assets** and use those URLs.

---

## 3. Required GLOBAL markup (put on every page / in a symbol)

`main.js` expects these elements to exist on each page. Recreate them in the Designer
with these **exact** class names (Webflow: select element → add these as the class, or
add extra classes / a custom ID under Element Settings).

**Letterbox bars** (drives preloader hand-off + page transitions). ID = `bars`:
```
#bars.bars
  .bars__top
  .bars__bottom
  .bars__mark        ← holds the submark logo image
```

**Preloader** (home, or wherever it should show):
```
.preloader
  .preloader__stage
  .preloader__mark
  .preloader__count
  .preloader__rec
  .preloader__frame  (contains multiple <span> children)
```

**Nav / mobile menu:**
```
.menu-btn  →  child .menu-btn__label
.menu-overlay  →  contains .menu-link items (each a link)
```

**Footer year:** any element with attribute `data-year` (auto-filled by JS).

Make these a **Webflow Symbol/Component** so they're identical across pages.

---

## 4. Per-page structural class contract

Give elements these classes so CSS styles them and JS animates them. Custom
attributes are set in Webflow via **Element Settings → Custom attributes**.

| Element / role | Class or attribute |
|---|---|
| Hero video or poster | `.hero video` / `.hero .hero-poster`; meta block `.hero__meta` |
| Hero animated title | `.hero__title` → `.line` → `> span` (each word in its own span) |
| Scroll-reveal text block | `.statement` + attr `data-reveal="words"` (optional `data-accent="VIDEO|STORY"`) |
| Masked line reveal | `.line-mask` → `> span` |
| Fade/slide-up on scroll | `.reveal-up` |
| Media reveal (image/video wipe) | `.reveal-media` |
| Drifting element | attr `data-drift="left"` or `"right"` |
| Individual words to scrub | `.word` |
| Pinned zoom band | `.band--zoom` |
| Services accordion | rows `.svc__row`, `.svc__head`, `.svc__body`, `.svc__idx` (open state adds `.open`) |
| Team card (3D tilt) | `.team-card` |
| Logo marquee | `.logo-marquee` |

`data-reveal`, `data-accent`, `data-drift`, `data-year` are the only content-side
data-attributes the animation engine reads.

---

## 5. Work Projects — CMS Collection  *(already created)*

The collection **"Work Projects"** exists on the live site
(`6a708cfa7a6e232d15509573`) with all 8 projects in it. Its fields mirror
`data/projects.json` in this repo one-to-one — that file is the source of truth
for the static build, the CMS is the source of truth for the client's editing.
Keep them in step.

| CMS field (slug) | Type | JSON key | Used by |
|---|---|---|---|
| `name` | Plain text | `name` | card + detail `<h1>` |
| `slug` | Plain text | `slug` | the URL: `/work/<slug>/` |
| `brand` | Plain text | `brand` | mosaic label, detail eyebrow |
| `client` | Plain text | `client` | detail credits |
| `format` | Plain text | `format` | detail eyebrow + credits |
| `year` | Plain text | `year` | detail credits |
| `location` | Plain text | `location` | detail credits |
| `services` | Plain text (`·`-separated) | `services[]` | detail credits |
| `short-description` | Plain text | `shortDescription` | detail hero lede, structured data |
| `description` | Plain text (long) | `description` | detail body copy |
| `media-type` | Option `video` / `image` | `mediaType` | whether a player renders |
| `overlay-media` | Link | `media` | the film file |
| `youtube-id` | Plain text | `youtube` | embeds YouTube instead of a file |
| `poster` | Image | `poster` | mosaic thumbnail, detail hero, OG image |
| `hover-loop` | Link | `hoverLoop` | muted loop on card hover |
| `gallery` | Multi-image | `gallery[]` | stills below the description |
| `order` | Number | `order` | sort order across the site |
| `featured` | Switch | `featured` | shows in the home page's selected work |
| `seo-title` | Plain text | `seoTitle` | detail `<title>` |
| `seo-description` | Plain text | `seoDescription` | detail meta description |

---

## 6. Work mosaic — Collection List wiring

Work cards are **links to detail pages**, not buttons that open an overlay. That
change is what gives every project a crawlable, SEO-addressable URL; the cinematic
hand-off is still there, carried by the letterbox-bar page transition.

On the Work page, build a **Collection List** bound to "Work Projects", sorted by
`order`. Each item:

```
a.mosaic__item              ← link block, Settings → Page → Work Project (collection page)
                               add class "has-film" via a conditional on Media type = video
  .mosaic__media
     <img>   src bound to {{ Poster }},   alt bound to {{ Name }}
     <video> src bound to {{ Hover loop }} (muted loop playsinline preload=none)
  .mosaic__label
     span.mosaic__client.mono  → text bound to {{ Brand }}
     span.mosaic__title        → text bound to {{ Name }}
```

Wrap it in `.mosaic` (a plain div — the grid is CSS, not a Webflow layout) inside
`section.section--mosaic`.

The home page uses the same collection filtered to `Featured = on`, limit 4, with the
editorial card markup instead:

```
a.work-card                 ← link block → Work Project collection page
  .work-card__media.reveal-media
     <img> {{ Poster }} · <video> {{ Hover loop }}
     span.work-card__hint  → "View Project ↗"
  .work-card__meta
     span.mono → "Content Format // " + {{ Format }}
     span.mono → "Client // " + {{ Client }}
  h3.work-card__title.display  → {{ Name }}
```

`main.js` needs no per-project data on the card any more — it only attaches the hover
loop. There is no `data-*` contract left to get wrong.

---

## 6b. Work Project template page (the collection page)

Webflow generates one page per item at `/work-projects/<slug>`. Change the collection's
URL prefix to `work` under **Collection Settings → Slug** so it matches this repo's
`/work/<slug>/`.

Rebuild the template with these classes (the static equivalent is generated by
`tools/build.js` — open any `work/<slug>/index.html` and copy the structure):

```
nav.breadcrumb                Home / Work / {{ Name }}
section.detail-hero
   img.detail-hero__bg        {{ Poster }}
   .detail-hero__inner
      span.eyebrow            {{ Brand }} // {{ Format }}
      h1.detail-hero__title.display   {{ Name }}
      p.detail-hero__lede     {{ Short description }}
section.section.detail-film   (conditional: Media type = video)
   .detail-film__frame
      video.detail-film__video   {{ Overlay media }}, poster {{ Poster }}, controls, preload=none
      button.detail-film__play → span.ring + span.rec "Play Film"
section.section.detail-body
   .detail-body__grid
      div  → span.eyebrow + p.detail-body__copy  {{ Description }}
      dl.detail-meta → .detail-meta__row (dt.mono + dd) per credit
section.section.detail-gallery   (conditional: Gallery is set)
section.section.detail-related   Collection List, 3 items, mosaic markup
nav.detail-nav                   .detail-nav__link--prev / --next
```

**SEO settings on the template** (Page Settings → SEO, all bound to CMS fields):
title `{{ SEO title }}`, description `{{ SEO description }}`, OG image `{{ Poster }}`.
Add the `VideoObject` / `BreadcrumbList` JSON-LD in the page's custom code head, binding
the same fields — copy the shape from a generated page.

---

## 6c. Keeping the two in sync

The repo and the CMS hold the same content twice, by design: the repo so the static
build has something to render, the CMS so the client can edit without a developer.

- Content change from the client → they edit the CMS → mirror it into
  `data/projects.json` and re-run `node tools/build.js`.
- Structural change (new field, new section) → add it to `data/projects.json` and
  `tools/build.js` first, then add the matching CMS field and bind it.

## 7. Assets

- **Videos** (`assets/video/*.mp4`): upload to Webflow Assets (premium allows larger
  files) or keep on a CDN; point the CMS "Overlay media" / "Hover loop" fields at those URLs.
- **Images** (`assets/img/*`, `assets/logos/*`): upload to Assets, bind to CMS Poster field.
- Keep the optimized encodes already in this repo (hero loop ~1.8 MB, hovers ~150 KB).

---

## 8. Webflow MCP + Claude (optional automation)

Webflow's **official MCP server** lets Claude read and write your Webflow site
directly (CMS collections, items, pages, custom code, and — with the Designer bridge —
canvas elements). This can scaffold §5 (create the Collection + fields) and §6/§7
(create items, set custom code) for you instead of clicking through the Designer.

**Connect it in Claude Code:**
```bash
claude mcp add --transport http webflow https://mcp.webflow.com/mcp
claude              # launch
/mcp                # select "webflow" → a browser opens for OAuth
```
- Authorize the specific site(s) you want Claude to touch; installs the **MCP Bridge App**.
- No API keys are stored locally — auth is OAuth, handled per session.
- For a per-project (repo-scoped) install: add `-s project` to the command above.

**What MCP can do for this build:** create the "Work Projects" Collection and its
fields, bulk-create the 7 project items from the `PROJECTS` data, and set the
head/footer custom code. **What it can't do well:** hand-drawing the exact nested DOM
structure with the precise class names in §3–4 — that's still fastest by hand in the
Designer (or via the Designer API bridge, which is fiddlier). So: **build the structure
manually, let MCP handle the CMS data + custom code.**

Docs: https://developers.webflow.com/mcp/installing/claude-code

---

## 9. Final checklist

- [ ] Fonts added (Anton / Archivo / Space Mono)
- [ ] `style.css` linked in Head; GSAP + ScrollTrigger + `main.js` linked in Footer (in order)
- [ ] Global `#bars`, `.preloader`, `.menu-*` symbol on every page
- [ ] Page structure uses the exact classes/attrs in §3–4
- [ ] "Work Projects" collection URL prefix changed to `work`
- [ ] Collection List on Work uses the `.mosaic__item` markup and links to the collection page
- [ ] Home page Collection List filtered to `Featured = on`, limit 4
- [ ] Work Project template page built per §6b, SEO fields bound to CMS
- [ ] Assets uploaded, CMS media fields pointed at them
- [ ] Published to `.webflow.io` and tested (custom code does NOT run in Designer)
- [ ] Add a project in the CMS as a smoke test → confirm its detail page renders
