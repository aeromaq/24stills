---
description: Convert this static site into a Webflow site (GSAP + CMS) via the Webflow MCP, one phase at a time.
---

# Webflow conversion — phase runner

Convert the 24stills static site in this repo into a Webflow site: custom code for
GSAP, a CMS Collection for Work projects, and page structure with the exact class
names the stylesheet and animation engine require.

**Requested phase:** `$ARGUMENTS` (if empty, run Phase 0, then stop and report.)

## Ground rules — follow these strictly

1. **Run ONLY the requested phase.** Stop at its end, summarise what changed, and
   state the exact command for the next phase. Never chain phases unprompted.
2. **Never publish to a production/custom domain.** Publishing to the
   `*.webflow.io` staging domain is fine when a phase says so. Ask before anything else.
3. **Never delete or overwrite existing Webflow collections, pages, or custom code.**
   If a name already exists, report it and ask.
4. If a Webflow MCP tool is missing or errors, say so plainly and stop — do not
   invent a workaround or fake success.
5. Read `WEBFLOW-BUILD.md` in this repo before Phase 1+ — it is the source of truth
   for the class/attribute contract. Read `js/main.js` for the project data.

---

## Phase 0 — discover and confirm

1. List my Webflow sites via the Webflow MCP.
2. Show: site name, ID, and whether a `*.webflow.io` staging domain exists.
3. For the site that looks like 24stills, list existing pages, CMS collections, and
   whether any custom code is already set.
4. **STOP.** Ask me to confirm the target site ID before any phase writes anything.

## Phase 1 — foundation: fonts + GSAP custom code

This is the GSAP integration. Against the confirmed site:

1. Add Google Fonts: **Anton**, **Archivo** (400/500/700), **Space Mono** (400/700).
   If the MCP cannot manage fonts, tell me and I'll add them in Site Settings.
2. Set **site-wide head custom code**:
   ```html
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/aeromaq/24stills@main/css/style.css" />
   ```
3. Set **site-wide footer custom code** (order matters — GSAP, then ScrollTrigger, then main.js):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
   <script src="https://cdn.jsdelivr.net/gh/aeromaq/24stills@main/js/main.js"></script>
   ```
4. Report what you set, then **STOP**.

Notes: the repo is public, so jsDelivr serves these directly. If the work is still on
the `main-6wpwcq` branch and not merged, swap `@main` for `@main-6wpwcq`. jsDelivr
caches branch refs for up to 12h — for production, pin a git tag instead.

## Phase 2 — CMS: Work Projects collection

1. Create a Collection named **Work Projects** with fields:
   | Field | Type |
   |---|---|
   | Brand | Plain text |
   | Format | Plain text |
   | Description | Plain text (long) |
   | Media type | Option — choices `video`, `image` |
   | Overlay media | Link (URL) |
   | Poster | Image |
   | Hover loop | Link (URL) |
   | Order | Number |
2. Read the `PROJECTS` object in `js/main.js` and create **one item per project**
   (7 total), copying brand / title / format / description **verbatim** — do not
   paraphrase or re-write the copy. Set Media type from `media.type`. Set Order 1–7.
3. For media URLs, use jsDelivr paths to this repo, e.g.
   `https://cdn.jsdelivr.net/gh/aeromaq/24stills@main/assets/video/preview-tagheuer.mp4`
   and `.../assets/img/thumb-tagheuer.jpg`. (Fine for staging; move to Webflow Assets
   or a video host for production.)
4. List the created items so I can verify, then **STOP**.

## Phase 3 — page structure

Build **one page per invocation** — pass the page name, e.g. `/webflow-build phase 3 work`.
Follow `WEBFLOW-BUILD.md` §3 (global elements), §4 (class contract), §6 (Work grid).

Rules:
- Element class names, IDs, and data-attributes must match the spec **exactly** —
  `style.css` and `main.js` target them. A typo silently kills styling or animation.
- Put the global `#bars` / `.preloader` / `.menu-*` structure in a reusable
  component so every page shares it.
- On the Work page: a Collection List bound to Work Projects, each item styled
  `.work-card`, plus **one** `.project-overlay` container outside the list.

**Wiring the card data — two options. Try A, fall back to B:**

- **A. Custom attributes** on `.work-card`: `data-project` (slug), `data-brand`,
  `data-format`, `data-title`, `data-desc`, `data-media-type`, `data-media-src`,
  `data-poster` — each bound to its CMS field.
- **B. Hidden child elements** (use this if attribute values can't be bound to CMS
  fields): inside `.work-card`, add a `display:none` wrapper containing
  `<span data-field="brand">`, `data-field="format"`, `data-field="title"`,
  `data-field="desc"`, `data-field="mediaType"`, an `<a data-field="media">` whose
  href is the Overlay media field, and an `<img data-field="poster">`.
  Text/image/link binding always works in a Collection List.

`main.js` reads A first, then B, then falls back to its built-in map — so either wins.
Report which option you used, then **STOP**.

## Phase 4 — verify

1. Publish to the **`*.webflow.io` staging domain only**.
2. Fetch the published page and confirm: the stylesheet and all three scripts are
   present in the correct order, `#bars` / `.preloader` exist, and each `.work-card`
   carries its data (attributes or hidden fields).
3. Report anything missing as a checklist of fixes.

**Reminder for me:** custom code never runs in the Designer canvas or Preview — the
animations only work on the published staging site. A dead-looking canvas is expected.
