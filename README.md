# 24stills — 2026 Website Rebrand

Awwwards-style brutalist site for 24stills, a Brooklyn-based video production studio.
Built from the client sitemap deck (`Sitemap 24stills 2026.pptx`, Benjamin Mogel) with
2020.land and sequencefive.com as motion/identity references.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Landing: showreel hero → intro statement → trusted-by marquee → manifesto → featured work (4) → services accordion → interstitial band → contact |
| `work.html` | All 7 projects, hover play-loops, "Netflix effect" overlay |
| `about.html` | Who We Are: belief/craft statements, team |
| `weddings.html` | Unlisted (noindex, excluded from robots.txt + nav). Inquiry form per brief |

## Design system

- **Display type:** Anton (condensed heavy, all-caps) — the 2020.land-style headline voice
- **Body:** Archivo · **Labels/meta:** Space Mono (`CONTENT FORMAT // IMAGE FILM`)
- **Palette:** paper `#E8E6E1` · ink `#0B0B0B` · signal `#FF3E1C`
- Motif: 2px rules, `//` index labels, film-grain overlay, paper/ink section sandwich

## Motion (GSAP + ScrollTrigger, CDN)

- **Preloader** (homepage only): a "camera zoom-through" — viewfinder corner brackets + REC indicator + timecode focus-pull into the submark, then a punch-in zoom that reveals the page underneath (~2.5s, once per session).
- **Page transitions**: a reusable "cinema shutter" — two letterbox bars (`.bars`) slide in from top/bottom to meet at center, the submark holds briefly, then the bars swing open on the new page. The hand-off across the hard navigation boundary uses an inline anti-FOUC script in each page's `<head>` (reads a `sessionStorage` flag set just before navigating) plus a `nav-incoming` CSS class, so there's no flash of the destination page before the bars finish opening.
- **Work overlay ("Netflix effect")**: reuses the same letterbox bars — they meet (covering the screen), the clicked project's content swaps in behind them, then they split apart to reveal it. Each video project now opens on its poster with a centered custom play button (`.project-overlay__play`); clicking it hands off to native controls. Pieces without supplied footage (DZ Bank, Horváth, Violife, Passion Cycling) show the still without a play button — no play button that goes nowhere.
- **Per-section reveal language** — deliberately varied, not one animation repeated everywhere:
  - `data-reveal="words"` — word-by-word scrub (the site's signature move; intro + about's belief statement)
  - `data-reveal="lines"` — clause-by-clause mask reveal, split on the copy's own em-dashes (manifesto + about's craft statement)
  - `data-reveal="zoom"` — pinned push-in scale on the interstitial bands, echoing the preloader's punch-in
  - `data-reveal="tracking"` — gentle letter-spacing/opacity settle, reserved for the wedding page's softer tone
  - Sticky, releasing section head on both Work listings (`.section-head--sticky`, desktop only, `ScrollTrigger.matchMedia`); services index digits pulse into focus; team photos tilt in 3D; the trusted-by marquee brightens as it's scrolled to.
- Thumbnail clip-path unmasks (brief: "thumbnail opacity animated")
- `prefers-reduced-motion` honored; `?qa=1` URL param renders all motion resolved (used for design QA screenshots)

## Assets

All from the client ASSETS folder. Videos transcoded with ffmpeg for mobile-first loading:
hero loop 1.8 MB, hover loops ~150 KB, overlay previews ~2 MB (24 s cuts).
Masters stay in `Downloads/00. WEBSITE 2026.../ASSETS`.

## Weddings page

Rebuilt as a proper dedicated offering page (hero, statement, an "Included" checklist, a
5-step process timeline, then the inquiry form). Only one client photo exists for this
project (`Highlight Film Sara + Justin thumbnail10.jpg`) — it's used twice, cropped
differently (full-bleed hero vs. a wide cinematic detail band), rather than inventing
photos that don't exist. The included-package bullets and process steps are placeholder
copy — no wedding-specific brief text was supplied; confirm wording with the client.

## Handoff TODOs

- **No "Texts Work Section" document** — re-checked the full client Drive export
  (`00. WEBSITE 2026-20260714T074732Z-1-004`); that file doesn't exist anywhere in it.
  Work-item order/copy is sourced from the sitemap deck (PPTX) as before. If it's a
  Google Doc that wasn't included in this particular export, send it over directly.
- **Violife** — still no footage/thumbnail supplied; using a typographic logo tile.
- **Bernhard** — still no photo supplied (accent placeholder tile). Klaus/Bernhard roles are assumed — confirm titles.
- **"Undairy the Craving"** — deck says "GRAVING"; assumed typo, confirm.
- **DZ Bank / Horváth / Passion Cycling** — thumbnails only, no footage; overlay shows a still with no play button (rather than a play button that doesn't work).
- **Wedding page copy** — the "Included" checklist and process steps are placeholder; no wedding-specific brief text exists yet.
- Wedding form posts via `mailto:` — wire to a form backend (Formspree/Netlify/etc.).
- LinkedIn footer URL is a placeholder — set the company page.
- Hero loop currently cut from the TAG Heuer after-movie — replace with the real Showreel 2026 when delivered.

## Run locally

Any static server, e.g. `python -m http.server 4173` from this folder.
