# 24stills — 2026 Website Rebrand

Awwwards-style brutalist site for 24stills, a Brooklyn-based video production studio.
Built from the client sitemap deck (`Sitemap 24stills 2026.pptx`, Benjamin Mogel) with
2020.land and sequencefive.com as motion/identity references.

Static HTML/CSS/JS — no framework, no bundler. The only build step is a zero-dependency
Node generator that renders the CMS-driven Work pages (see **Work content** below).

## Pages

| Route | Source | Purpose |
|---|---|---|
| `/` | `index.html` | Landing: showreel hero → intro statement → trusted-by marquee → manifesto → featured work (4) → services accordion → interstitial band → contact |
| `/work.html` | `work.html` | Mosaic index of every project, hover play-loops, links to detail pages |
| `/work/<slug>/` | **generated** | One project detail page per Work item |
| `/about.html` | `about.html` | Who We Are: belief/craft statements, team |
| `/weddings.html` | `weddings.html` | Unlisted (noindex, excluded from robots.txt + nav). Films raster, collections, add-ons, inquiry form, questions |

## Work content — one source of truth

`data/projects.json` holds every Work project and **mirrors the Webflow CMS collection
"Work Projects" field-for-field**. Nothing about a project is hard-coded in a page.

```bash
node tools/build.js     # or: npm run build
```

That regenerates:

- `work/<slug>/index.html` — the detail page for each project, from one template
- the mosaic on `work.html` and the featured list on `index.html` (between
  `<!-- build:name -->` / `<!-- /build:name -->` markers — everything outside the
  markers is hand-authored and left alone)
- `sitemap.xml`

**To add or change a project:** edit `data/projects.json`, drop its assets in
`assets/`, run the build. To keep Webflow in step, mirror the same values into the
CMS collection (see `WEBFLOW-BUILD.md` §5).

### Project schema

`slug` `order` `featured` `name` `brand` `client` `format` `year` `location`
`services[]` `mediaType` (`video`|`image`) `media` `poster` `hoverLoop` `youtube`
`shortDescription` `description` `gallery[]` `seoTitle` `seoDescription`

`youtube` takes a bare video id; when set, the detail page embeds YouTube instead of
the self-hosted file (the client asked whether YouTube pieces could live in the mosaic —
they can, via this field).

## SEO

- Every project has a real crawlable URL (`/work/<slug>/`), a unique `<title>`,
  a unique meta description, `<link rel="canonical">`, Open Graph and Twitter cards.
- Detail pages emit `VideoObject` (pieces with an actual film) or `CreativeWork`
  (stills-only pieces), plus `BreadcrumbList`. The home page emits `Organization`.
  No invented fields — durations and upload dates are omitted because the data
  doesn't have them.
- Alt text describes the frame, not the filename.
- `sitemap.xml` is generated; `weddings.html` stays `noindex` and disallowed.

## Design system

- **Display type:** Anton (condensed heavy, all-caps) — the 2020.land-style headline voice
- **Body:** Archivo · **Labels/meta:** Space Mono (`CONTENT FORMAT // IMAGE FILM`)
- **Palette:** paper `#E8E6E1` · ink `#0B0B0B` · signal `#FF3E1C`
- Motif: 2px rules, `//` index labels, film-grain overlay, paper/ink section sandwich

## Motion (GSAP + ScrollTrigger, CDN)

- **Preloader** (homepage only): a "camera zoom-through" — viewfinder corner brackets +
  REC indicator + timecode focus-pull into the submark, then a punch-in zoom that reveals
  the page underneath (~2.5s, once per session).
- **Page transitions**: a reusable "cinema shutter" — two letterbox bars (`.bars`) slide in
  from top/bottom to meet at center, the submark holds briefly, then the bars swing open on
  the new page. The hand-off across the hard navigation boundary uses an inline anti-FOUC
  script in each page's `<head>` (reads a `sessionStorage` flag set just before navigating)
  plus a `nav-incoming` CSS class. This is also what carries you from a Work card into its
  detail page.
- **Per-section reveal language** — deliberately varied, not one animation repeated:
  - `data-reveal="words"` — word-by-word scrub (the site's signature move)
  - `data-reveal="lines"` — clause-by-clause mask reveal, split on the copy's own em-dashes
  - `data-reveal="zoom"` — pinned push-in scale on the interstitial bands
  - `data-reveal="tracking"` — gentle letter-spacing/opacity settle (weddings)
  - Mosaic tiles stagger up per row; services index digits pulse into focus; team photos
    tilt in 3D; the trusted-by marquee brightens as it's scrolled to.
- `prefers-reduced-motion` honored; `?qa=1` renders all motion resolved (design QA capture).

### Scroll-position rules worth knowing before you touch `main.js`

- **Anchor scrolling is owned by JS**, not by `scroll-behavior: smooth`. Native anchor
  jumps resolve a target's position *before* ScrollTrigger inserts its pin-spacers, so the
  landing offset points at a layout that no longer exists — that's what left a cold load of
  `index.html#contact` sitting at scroll 0. `initAnchors()` / `honorInitialHash()` measure
  after the spacers exist, and re-apply the landing on each settling milestone (webfont
  reflow, window load) until the visitor takes over the scroll.
- **The pinned interstitial band is scoped to ≥900px** via `ScrollTrigger.matchMedia`.
  Pinning a full-height section on a short viewport eats a whole screen of scroll and reads
  as "the page is stuck".
- **The pinned band is measured in `vh`, not `svh`** — while pinned, a mobile URL bar is
  retracted, so `svh` would leave a strip of the next section showing behind it.
- **`ScrollTrigger.refresh()` runs on font load, window load and a debounced
  `ResizeObserver`** — every trigger position is a measurement, and the page keeps moving
  after `DOMContentLoaded`.

## Assets

Client masters live outside the repo. Web encodes here:

- `assets/video/hero-loop.mp4` — Showreel 2026 v12, 1600×900, ~4 MB (client-supplied master
  is 106 MB; transcoded with ffmpeg, audio stripped since the hero plays muted)
- hover loops ~150 KB · detail-page films ~2 MB (24 s cuts)
- Stills resized to ≤1920px, quality 82–84

## Run locally

```bash
python3 -m http.server 4173     # then open http://localhost:4173/
```

Detail pages are directories (`work/<slug>/index.html`), so they resolve on any static
host without rewrite rules.

## Handoff TODOs

Assets the client referenced in Revision 1 that were **not** in the supplied folder — each
is a one-line addition to `data/projects.json` once the file arrives:

- **DZ Bank: A Summit for 50 Years** — the `DZ Bank Event video` folder is empty; only the
  thumbnail was supplied. The project exists and uses the thumbnail; add `media` +
  `mediaType: "video"` when the film lands.
- **GACC, GISNY, EUROSPINE 2025, ONE HXM, PACE OF NY, MORE TIME FOR PEOPLE** — requested for
  the Work order, no film or thumbnail supplied. Tracked in `pendingProjects`.
- **Process Harmonization** — client asked for `Successstory Hübner.jpg`; not in the folder,
  so the existing thumbnail stands.
- **TAG Heuer film** — the client chose `After movie Tag Heuer_V1`; that file has not been
  pulled from Drive yet, so `preview-tagheuer.mp4` is still the original supplied cut.
- **Van Zee Signs** — copy is written from what the supplied thumbnail shows (Brooklyn shop,
  hand-lettered work, the 24stills ORIGINAL badge). `year` is unknown and left empty; Ben
  should confirm both.
- **Missing client logos** — Hodinkee, University of Vienna, Vienna Tourism, EMPLEOX and
  All For One are rendered as wordmarks (matching the existing Tag Heuer / DZ Bank / Horváth
  treatment) because no logo files were supplied.
- **Klaus / Bernhard roles** are assumed — confirm titles.
- **"Undairy the Craving"** — deck says "GRAVING"; assumed typo, confirm.
- Wedding form posts via `mailto:` — wire to a form backend (Formspree/Netlify/etc.).
- **Asya + Zack** is the one wedding tile with stills but no film; it renders as a static
  figure rather than a player until a film is delivered.
