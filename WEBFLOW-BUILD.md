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

## 5. Work Projects — CMS Collection

Create a Collection named **"Work Projects"** with these fields (they map 1:1 to what
the overlay renders):

| CMS field | Type | Maps to overlay field |
|---|---|---|
| **Name** | Plain text | project title (`data-title`) |
| **Slug** | (auto) | used for `data-project` |
| **Brand** | Plain text | `data-brand` (e.g. "TAG HEUER") |
| **Format** | Plain text (or Option) | `data-format` (e.g. "Brand Documentary") |
| **Description** | Plain text (long) | `data-desc` |
| **Media type** | Option: `video` / `image` | `data-media-type` |
| **Overlay media** | Video link **or** File/Asset URL | `data-media-src` (the film that plays in the overlay) |
| **Poster / thumbnail** | Image | `data-poster` + the card's grid thumbnail |
| **Hover loop** *(optional)* | Video link | the muted loop that plays on card hover |
| **Order** | Number | manual sort |

Then add the 7 existing projects as items (data is in `js/main.js` → `PROJECTS`, and in
`WEBFLOW-BUILD.md` §5 reference below).

---

## 6. Work grid — Collection List wiring (the critical part)

On the Work page, build a **Collection List** bound to "Work Projects." Each item is a
card that must reproduce this structure **and** carry CMS-bound custom attributes:

```
button.work-card                     ← Element Settings → Custom attributes:
                                          data-project = {{ Slug }}
                                          data-brand   = {{ Brand }}
                                          data-format  = {{ Format }}
                                          data-title   = {{ Name }}
                                          data-desc    = {{ Description }}
                                          data-media-type = {{ Media type }}
                                          data-media-src  = {{ Overlay media }}
                                          data-poster     = {{ Poster }}
  .work-card__media.reveal-media
     <img>   src bound to {{ Poster }}
     <video> src bound to {{ Hover loop }} (muted loop playsinline preload=none)
     .work-card__hint  → text "Watch ↗"
  .work-card__meta
     .mono  → text bound to {{ Format }}
  h2.work-card__title.display  → text bound to {{ Name }}
```

Add the single overlay container **once** on the page (not inside the list):
```
.project-overlay  [role=dialog aria-modal=true]
  .project-overlay__media
     button.project-overlay__close  → text "Close ✕"
  .project-overlay__bar
     div
       span.project-overlay__brand.mono
       h3.project-overlay__title.display
     p.project-overlay__desc
```

### 6b. Fallback wiring — hidden bound elements (use if attribute binding fails)

Binding a CMS field *into a custom attribute value* isn't always possible. Binding
**text, image and link elements** always is. So `main.js` also accepts the data as
hidden child elements. Inside `.work-card`, add a wrapper set to `display: none`:

```
.work-card__data            (display:none)
  span[data-field="brand"]      → text bound to {{ Brand }}
  span[data-field="format"]     → text bound to {{ Format }}
  span[data-field="title"]      → text bound to {{ Name }}
  span[data-field="desc"]       → text bound to {{ Description }}
  span[data-field="mediaType"]  → text bound to {{ Media type }}
  a[data-field="media"]         → href bound to {{ Overlay media }}
  img[data-field="poster"]      → src  bound to {{ Poster }}
```

`<img>` yields its `src`, `<a>` its `href`, anything else its text.

**Resolution order in `getProjectData()`:** `data-*` attributes → `[data-field]`
children → built-in `PROJECTS` map. Use whichever of §6 / §6b Webflow lets you bind;
both are tested and produce an identical overlay.

**Result:** client adds a project in the CMS → a new `.work-card` renders with its
data → clicking it runs `openProject(slug, card)` → `getProjectData()` resolves it →
the Netflix overlay fills itself. **No code changes ever needed.**

---

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
- [ ] "Work Projects" Collection created with §5 fields
- [ ] Collection List cards carry the §6 `data-*` custom attributes
- [ ] Single `.project-overlay` container present on the Work page
- [ ] Assets uploaded, CMS media fields pointed at them
- [ ] Published to `.webflow.io` and tested (custom code does NOT run in Designer)
- [ ] Add a project in the CMS as a smoke test → confirm its overlay opens correctly
