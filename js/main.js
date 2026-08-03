/* ============================================================
   24STILLS — interactions & GSAP motion
   Requires: gsap.min.js + ScrollTrigger.min.js (loaded before this file)
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

/* ?qa=1 renders the page with all motion resolved — used for design QA capture */
const QA = new URLSearchParams(window.location.search).has("qa");
const reducedMotion = QA || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (QA) {
  const s = document.createElement("style");
  s.textContent =
    "*,*::before,*::after{animation:none !important;transition:none !important}" +
    ".grain{display:none}.preloader{display:none}.bars{display:none !important}" +
    ".reveal-up{opacity:1;transform:none}.reveal-media{clip-path:none}" +
    ".statement .word{opacity:1}.hero__meta{opacity:1}" +
    ".team-card{opacity:1 !important;transform:none !important}" +
    '.statement[data-reveal="tracking"]{opacity:1 !important;letter-spacing:normal !important}' +
    ".band--zoom .statement{transform:none !important}" +
    ".line-mask>span{transform:none !important}" +
    ".hero{height:900px !important}.contact{min-height:820px !important}";
  document.head.appendChild(s);
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("video").forEach((v) => {
      v.removeAttribute("autoplay");
      v.pause();
      v.removeAttribute("src");
      v.querySelectorAll("source").forEach((so) => so.remove());
      v.load();
    });
  });
}

/* ------------------------------------------------------------
   PROJECT DATA — powers the "netflix effect" overlay
   ------------------------------------------------------------ */
const PROJECTS = {
  dzbank: {
    brand: "DZ BANK",
    title: "50 Years DZ Bank New York",
    format: "Image Film",
    media: { type: "image", src: "assets/img/thumb-dzbank.jpg" },
    desc:
      "A milestone worth remembering. To mark 50 years of DZ Bank in New York, we crafted a short film that traces the bank's history in the city — part time capsule, part tribute, told through the people who were there.",
  },
  horvath: {
    brand: "HORVÁTH",
    title: "High-Performance Leadership Event",
    format: "Event Film",
    media: { type: "image", src: "assets/img/thumb-horvath.jpg" },
    desc:
      "Horváth, an international management consultancy, brought their first leadership event to New York City. We captured the energy of the day through conversations with speakers from Hugo Boss, Stanford, and the NBA — letting their words tell the story of what made it worth being there.",
  },
  violife: {
    brand: "VIOLIFE",
    title: "Undairy the Craving",
    format: "Brand Experience",
    media: { type: "image", src: "assets/logos/client-violife.png", tile: true },
    desc:
      "For Violife, 24stills produced video content around a New York City brand experience — following the crew across the city as people had Violife products delivered right to them.",
  },
  tagheuer: {
    brand: "TAG HEUER",
    title: "One Night in NYC",
    format: "Brand Documentary",
    media: { type: "video", src: "assets/video/preview-tagheuer.mp4", poster: "assets/img/thumb-tagheuer.jpg" },
    desc:
      "Hodinkee and TAG Heuer hosted an intimate dinner celebrating the launch of the limited edition Carrera Chronograph Seafarer x Hodinkee and the brand's rich history of 'Decades at Sea.' We supported the evening from concept to delivery — planning the content, filming on-site, and producing assets tailored for release across channels.",
  },
  huebner: {
    brand: "HÜBNER",
    title: "Process Harmonization",
    format: "Corporate Documentary",
    media: { type: "video", src: "assets/video/preview-huebner.mp4", poster: "assets/img/thumb-huebner.jpg" },
    desc:
      "A corporate documentary following Hübner's process harmonization journey — real people, real change, told from inside the organization.",
  },
  roehm: {
    brand: "RÖHM",
    title: "Customer Project: Röhm",
    format: "Corporate Documentary",
    media: { type: "video", src: "assets/video/preview-roehm.mp4", poster: "assets/img/thumb-roehm.jpg" },
    desc:
      "An inside look at the EMPLEOX customer project with Röhm — a corporate documentary capturing collaboration between teams as it actually happens.",
  },
  cycling: {
    brand: "PASSION CYCLING",
    title: "Passion Cycling",
    format: "Commercial",
    media: { type: "image", src: "assets/img/thumb-cycling.jpg" },
    desc:
      "A commercial built around the pure feeling of riding — pace, sweat and asphalt. Shot to move as fast as its subject.",
  },
};

/* ------------------------------------------------------------
   LETTERBOX BARS — shared "cinema shutter" motif.
   Reused by: preloader hand-off, page transitions, and the
   work-item overlay. One instance per page (#bars).
   ------------------------------------------------------------ */
function getBars() {
  const el = document.querySelector(".bars");
  if (!el) return null;
  return {
    el,
    top: el.querySelector(".bars__top"),
    bottom: el.querySelector(".bars__bottom"),
    mark: el.querySelector(".bars__mark"),
  };
}

/* Normalize the bars' transforms into GSAP-owned percentages.
   The CSS hidden state is translateY(±100%), which GSAP reads back as
   pixel `y` (yPercent stays 0) — animating yPercent against that is a
   silent no-op. Setting y:0 + explicit yPercent hands ownership to GSAP. */
function initBars(startCovered) {
  const b = getBars();
  if (!b) return;
  gsap.set(b.top, { y: 0, yPercent: startCovered ? 0 : -101 });
  gsap.set(b.bottom, { y: 0, yPercent: startCovered ? 0 : 101 });
  gsap.set(b.mark, {
    x: 0,
    y: 0,
    xPercent: -50,
    yPercent: -50,
    opacity: startCovered ? 1 : 0,
    scale: startCovered ? 1 : 0.6,
  });
  gsap.set(b.el, { pointerEvents: startCovered ? "auto" : "none" });
}

function coverBars({ duration = 0.5, withMark = false } = {}) {
  const b = getBars();
  const tl = gsap.timeline();
  if (!b) return tl;
  gsap.set(b.el, { pointerEvents: "auto" });
  tl.to(b.top, { yPercent: 0, duration, ease: "power4.in" }, 0).to(
    b.bottom,
    { yPercent: 0, duration, ease: "power4.in" },
    0
  );
  if (withMark) {
    tl.to(b.mark, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, "-=0.15");
  }
  return tl;
}

function uncoverBars({ duration = 0.6, withMark = false, delay = 0 } = {}) {
  const b = getBars();
  const tl = gsap.timeline({ delay });
  if (!b) return tl;
  if (withMark) {
    tl.to(b.mark, { opacity: 0, scale: 0.6, duration: 0.25, ease: "power2.in" });
  }
  tl.to(b.top, { yPercent: -101, duration, ease: "power4.out" }, withMark ? "-=0.05" : 0)
    .to(b.bottom, { yPercent: 101, duration, ease: "power4.out" }, "<")
    .set(b.el, { pointerEvents: "none" });
  return tl;
}

/* ------------------------------------------------------------
   PRELOADER — camera zoom-through (viewfinder → punch-in → reveal)
   ------------------------------------------------------------ */
function runPreloader() {
  const pre = document.querySelector(".preloader");

  if (!pre || QA) {
    if (pre) pre.style.display = "none";
    if (QA) {
      gsap.set(".hero__title .line > span", { yPercent: 0 });
      return;
    }
    return entrance();
  }

  const stage = pre.querySelector(".preloader__stage");
  const mark = pre.querySelector(".preloader__mark");
  const rec = pre.querySelector(".preloader__rec");
  const count = pre.querySelector(".preloader__count");
  const corners = pre.querySelectorAll(".preloader__frame span");

  gsap.set(mark, { filter: "invert(1) brightness(2) blur(10px)" });

  const counter = { v: 0 };
  const tl = gsap.timeline({
    onComplete: () => {
      pre.style.display = "none";
      entrance();
    },
  });

  tl.to(corners, { opacity: 1, duration: 0.4, stagger: 0.06, ease: "power2.out" })
    .to(rec, { opacity: 1, duration: 0.3 }, "-=0.2")
    .to(mark, { opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.3")
    .to(count, { opacity: 1, duration: 0.3 }, "<")
    .to(mark, { filter: "invert(1) brightness(2) blur(0px)", duration: 0.6, ease: "power2.out" }, "-=0.2")
    .to(
      counter,
      {
        v: 100,
        duration: reducedMotion ? 0.1 : 0.9,
        ease: "power1.inOut",
        onUpdate: () => (count.textContent = String(Math.round(counter.v)).padStart(3, "0") + " %"),
      },
      "<"
    )
    // camera punch-in: the whole viewfinder rockets toward the viewer
    .to(corners, { opacity: 0, duration: 0.25 }, "+=0.05")
    .to(rec, { opacity: 0, duration: 0.25 }, "<")
    .to(count, { opacity: 0, duration: 0.25 }, "<")
    .to(stage, { scale: reducedMotion ? 1 : 26, duration: reducedMotion ? 0.1 : 0.85, ease: "power4.in" }, "<")
    .to(pre, { opacity: 0, duration: 0.4, ease: "power1.in" }, "-=0.35");
}

function entrance() {
  // hero headline: line-by-line rise
  const lines = document.querySelectorAll(".hero__title .line > span");
  if (lines.length) {
    gsap.fromTo(
      lines,
      { yPercent: 110 },
      { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12 }
    );
  }
  const meta = document.querySelector(".hero__meta");
  if (meta) {
    gsap.fromTo(meta, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.5, ease: "power3.out" });
  }
}

/* ------------------------------------------------------------
   PAGE TRANSITIONS — cinema-shutter bars, with a hand-off across
   the hard navigation boundary (close on the old page, the new
   page's inline head-script keeps the bars covering so they can
   swing open on load — see the <script> in each page's <head>).
   ------------------------------------------------------------ */
function initTransitions() {
  const b = getBars();
  if (!b) return;

  document.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    const internal =
      href &&
      !href.startsWith("#") &&
      !href.startsWith("mailto:") &&
      !href.startsWith("http") &&
      !a.target;
    if (!internal) return;

    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (document.body.classList.contains("menu-open")) closeMenu();
      try {
        sessionStorage.setItem("24s-nav", "1");
      } catch (err) {
        /* sessionStorage unavailable — fall back to instant nav */
        window.location.href = href;
        return;
      }
      const tl = coverBars({ duration: reducedMotion ? 0.01 : 0.5, withMark: true });
      tl.to({}, { duration: reducedMotion ? 0 : 0.3 }); // brief hold on the mark
      tl.eventCallback("onComplete", () => (window.location.href = href));
    });
  });
}

/* ------------------------------------------------------------
   NAV — fullscreen menu, with an explicit Menu/Close label so the
   close affordance is never ambiguous on tablet/mobile.
   ------------------------------------------------------------ */
let menuIsOpen = false;

function openMenu() {
  const btn = document.querySelector(".menu-btn");
  const overlay = document.querySelector(".menu-overlay");
  if (!btn || !overlay) return;
  const label = btn.querySelector(".menu-btn__label");
  const links = overlay.querySelectorAll(".menu-link");

  menuIsOpen = true;
  document.body.classList.add("menu-open");
  document.body.style.overflow = "hidden";
  if (label) label.textContent = "Close";
  btn.setAttribute("aria-expanded", "true");
  btn.setAttribute("aria-label", "Close menu");

  gsap.set(overlay, { visibility: "visible" });
  gsap
    .timeline()
    .to(overlay, { clipPath: "inset(0 0 0% 0)", duration: 0.6, ease: "power4.inOut" })
    .fromTo(
      links,
      { yPercent: 60, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: "power3.out" },
      "-=0.2"
    );
}

function closeMenu() {
  const btn = document.querySelector(".menu-btn");
  const overlay = document.querySelector(".menu-overlay");
  if (!btn || !overlay || !menuIsOpen) return;
  const label = btn.querySelector(".menu-btn__label");

  menuIsOpen = false;
  document.body.classList.remove("menu-open");
  document.body.style.overflow = "";
  if (label) label.textContent = "Menu";
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-label", "Open menu");

  gsap.to(overlay, {
    clipPath: "inset(0 0 100% 0)",
    duration: 0.5,
    ease: "power4.inOut",
    onComplete: () => gsap.set(overlay, { visibility: "hidden" }),
  });
}

function initMenu() {
  const btn = document.querySelector(".menu-btn");
  const overlay = document.querySelector(".menu-overlay");
  if (!btn || !overlay) return;

  btn.setAttribute("aria-expanded", "false");
  btn.addEventListener("click", () => (menuIsOpen ? closeMenu() : openMenu()));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuIsOpen) closeMenu();
  });
}

/* ------------------------------------------------------------
   SPLIT STATEMENTS — four distinct reveal techniques, chosen per
   section so the page doesn't read as one repeated animation:
     words    — word-by-word scrub  (the site's signature move)
     lines    — clause-by-clause mask reveal (film-reel unspool)
     zoom     — pinned push-in scale (echoes the preloader's punch-in)
     tracking — gentle letter-spacing/opacity settle (weddings page)
   ------------------------------------------------------------ */
function applyAccent(str, accents) {
  let out = str;
  accents.forEach((a) => {
    const re = new RegExp(`\\b(${a})\\b`, "i");
    out = out.replace(re, '<span class="accent">$1</span>');
  });
  return out;
}

function splitStatements() {
  document.querySelectorAll(".statement[data-reveal]").forEach((el) => {
    const mode = el.dataset.reveal || "words";
    const accents = el.dataset.accent ? el.dataset.accent.split("|") : [];
    const raw = el.textContent.trim();

    if (mode === "lines") {
      const parts = raw.split(/(?<=—)\s+/);
      el.innerHTML = parts
        .map((p) => `<span class="line-mask"><span>${applyAccent(p.trim(), accents)}</span></span>`)
        .join(" ");
    } else if (mode === "tracking" || mode === "zoom") {
      el.innerHTML = applyAccent(raw, accents);
    } else {
      el.innerHTML = raw
        .split(/\s+/)
        .map((w) => `<span class="word">${w}</span>`)
        .join(" ");
      el.querySelectorAll(".word").forEach((w) => {
        if (accents.some((a) => w.textContent.replace(/[^\wÁÜÖ-]/gi, "").toUpperCase() === a.toUpperCase())) {
          w.classList.add("accent");
        }
      });
    }
  });
}

/* ------------------------------------------------------------
   SCROLL MOTION
   ------------------------------------------------------------ */
function initScrollMotion() {
  if (reducedMotion) return;

  document.querySelectorAll(".statement[data-reveal]").forEach((el) => {
    const mode = el.dataset.reveal || "words";

    if (mode === "lines") {
      const lines = el.querySelectorAll(".line-mask > span");
      gsap.fromTo(
        lines,
        { yPercent: 100 },
        {
          yPercent: 0,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 55%", scrub: 0.5 },
        }
      );
    } else if (mode === "tracking") {
      gsap.fromTo(
        el,
        { opacity: 0, letterSpacing: "0.35em" },
        {
          opacity: 1,
          letterSpacing: "0em",
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 85%", end: "top 40%", scrub: 0.6 },
        }
      );
    } else if (mode === "zoom") {
      // handled by initZoomBands (needs the pinned .band--zoom wrapper)
    } else {
      const words = el.querySelectorAll(".word");
      gsap.to(words, {
        opacity: 1,
        stagger: 0.06,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 45%", scrub: 0.4 },
      });
    }
  });

  // oversized section headlines drift sideways as you scroll
  document.querySelectorAll("[data-drift]").forEach((el) => {
    const dir = el.dataset.drift === "left" ? 1 : -1;
    gsap.fromTo(
      el,
      { x: 50 * dir },
      {
        x: -50 * dir,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
      }
    );
  });

  // generic rise-in reveals
  document.querySelectorAll(".reveal-up").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  // media unmask — thumbnails wipe open (opacity/clip animated, per brief)
  document.querySelectorAll(".reveal-media").forEach((el) => {
    gsap.to(el, {
      clipPath: "inset(0 0 0% 0)",
      duration: 1.1,
      ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });

  // hero video subtle parallax exit
  const heroVideo = document.querySelector(".hero video, .hero .hero-poster");
  if (heroVideo) {
    gsap.to(heroVideo, {
      yPercent: 12,
      scale: 1.06,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  // trusted-by marquee "wakes up" as the section is scrolled to
  document.querySelectorAll(".logo-marquee").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0.35 },
      {
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 75%", end: "top 30%", scrub: 0.5 },
      }
    );
  });

  // services — index digits pulse into focus as each row crosses center
  document.querySelectorAll(".svc__idx").forEach((idx) => {
    gsap.fromTo(
      idx,
      { scale: 0.55, opacity: 0.35 },
      {
        scale: 1,
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: idx, start: "top 72%", end: "top 42%", scrub: 0.4 },
      }
    );
  });

  // team — 3D tilt-in, staggered by grid position
  document.querySelectorAll(".team-card").forEach((card, i) => {
    gsap.to(card, {
      opacity: 1,
      rotateY: 0,
      y: 0,
      duration: 0.9,
      delay: (i % 3) * 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 88%" },
    });
  });

  initZoomBands();
}

/* interstitial bands — pinned push-in zoom text */
function initZoomBands() {
  document.querySelectorAll(".band--zoom").forEach((band) => {
    const statement = band.querySelector(".statement");
    if (!statement) return;
    gsap.fromTo(
      statement,
      { scale: 0.72 },
      {
        scale: 1.08,
        ease: "none",
        scrollTrigger: { trigger: band, start: "top top", end: "+=100%", scrub: 0.6, pin: true },
      }
    );
  });
}

/* ------------------------------------------------------------
   WORK CARDS — hover play loop + netflix-style letterbox overlay
   ------------------------------------------------------------ */
function initWorkCards() {
  document.querySelectorAll(".work-card").forEach((card) => {
    const video = card.querySelector("video");
    if (video) {
      card.classList.add("has-video");
      const media = card.querySelector(".work-card__media");
      if (media && !media.querySelector(".work-card__ring")) {
        const ring = document.createElement("span");
        ring.className = "work-card__ring";
        ring.setAttribute("aria-hidden", "true");
        media.appendChild(ring);
      }
      card.addEventListener("mouseenter", () => video.play().catch(() => {}));
      card.addEventListener("mouseleave", () => {
        video.pause();
        video.currentTime = 0;
      });
    }
    card.addEventListener("click", () => openProject(card.dataset.project, card));
  });
}

function buildOverlayMedia(mediaBox, data) {
  mediaBox.querySelectorAll("video, img, .tile, .project-overlay__play").forEach((n) => n.remove());

  let media;
  if (data.media.type === "video") {
    media = document.createElement("video");
    media.src = data.media.src;
    media.poster = data.media.poster || "";
    media.controls = false;
    media.loop = true;
    media.playsInline = true;
    media.preload = "none";
  } else if (data.media.tile) {
    media = document.createElement("div");
    media.className = "tile";
    media.style.cssText =
      "width:100%;height:100%;background:var(--accent);display:flex;align-items:center;justify-content:center;";
    const img = document.createElement("img");
    img.src = data.media.src;
    img.alt = data.brand;
    img.style.cssText = "width:50%;height:auto;object-fit:contain;filter:brightness(0);";
    media.appendChild(img);
  } else {
    media = document.createElement("img");
    media.src = data.media.src;
    media.alt = `${data.brand} — ${data.title}`;
  }
  mediaBox.prepend(media);

  // custom player: poster + centered play button — only for pieces with an actual film
  if (data.media.type === "video") {
    const play = document.createElement("button");
    play.type = "button";
    play.className = "project-overlay__play";
    play.setAttribute("aria-label", `Play ${data.title}`);
    play.innerHTML = '<span class="ring" aria-hidden="true"></span><span class="rec">Play Film</span>';
    play.addEventListener("click", () => {
      const overlay = document.querySelector(".project-overlay");
      media.controls = true;
      media.play().catch(() => {});
      overlay.classList.add("is-playing");
    });
    mediaBox.appendChild(play);
  }
}

let overlayAnimating = false;

/* Resolve the data that fills the overlay. Prefers CMS-friendly data-*
   attributes written onto the card (so a CMS such as Webflow can manage
   projects without editing this file); falls back to the built-in PROJECTS
   map used by the hand-coded static build. Expected card attributes:
   data-brand, data-format, data-title, data-desc, data-media-type
   ("video"|"image"), data-media-src, data-poster, data-tile ("true"). */
/* Second CMS wiring option: read the value out of a child element marked
   data-field="<name>". <img> yields its src, <a> its href, anything else its
   text. Binding text/image/link elements is well supported in every CMS,
   whereas binding values into custom attributes is not always possible —
   so this exists as the reliable alternative to the data-* route. */
function fieldValue(cardEl, name) {
  const el = cardEl.querySelector('[data-field="' + name + '"]');
  if (!el) return "";
  if (el.tagName === "IMG") return el.getAttribute("src") || "";
  if (el.tagName === "A") return el.getAttribute("href") || "";
  return el.textContent.trim();
}

function getProjectData(key, cardEl) {
  if (cardEl) {
    const d = cardEl.dataset;
    const src = d.mediaSrc || fieldValue(cardEl, "media");
    if (src) {
      const titleEl = cardEl.querySelector(".work-card__title");
      return {
        brand: d.brand || fieldValue(cardEl, "brand"),
        format: d.format || fieldValue(cardEl, "format"),
        title:
          d.title ||
          fieldValue(cardEl, "title") ||
          (titleEl ? titleEl.textContent.trim() : ""),
        desc: d.desc || fieldValue(cardEl, "desc"),
        media: {
          type: d.mediaType || fieldValue(cardEl, "mediaType") || "image",
          src: src,
          poster: d.poster || fieldValue(cardEl, "poster"),
          tile: (d.tile || fieldValue(cardEl, "tile")) === "true",
        },
      };
    }
  }
  return PROJECTS[key] || null;
}

function openProject(key, cardEl) {
  if (overlayAnimating) return;
  const data = getProjectData(key, cardEl);
  if (!data) return;

  const overlay = document.querySelector(".project-overlay");
  if (!overlay || overlay.classList.contains("open")) return;
  const mediaBox = overlay.querySelector(".project-overlay__media");
  const brand = overlay.querySelector(".project-overlay__brand");
  const title = overlay.querySelector(".project-overlay__title");
  const desc = overlay.querySelector(".project-overlay__desc");
  const bar = overlay.querySelector(".project-overlay__bar");

  // netflix sequence: bars CLOSE over the page first, the project content
  // swaps in while the screen is fully covered, then the bars part to
  // reveal it — the overlay must never pop in before the bars have met.
  overlayAnimating = true;
  const d1 = reducedMotion ? 0.01 : 0.42;
  const d2 = reducedMotion ? 0.01 : 0.55;
  gsap
    .timeline({ onComplete: () => (overlayAnimating = false) })
    .add(coverBars({ duration: d1, withMark: true }))
    .add(() => {
      buildOverlayMedia(mediaBox, data);
      brand.textContent = `${data.brand} // ${data.format}`;
      title.textContent = data.title;
      desc.textContent = data.desc;
      overlay.classList.remove("is-playing");
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      gsap.set(bar, { opacity: 0, yPercent: 24 });
    })
    .add(uncoverBars({ duration: d2, withMark: true }), "+=0.12")
    .fromTo(bar, { opacity: 0, yPercent: 24 }, { opacity: 1, yPercent: 0, duration: 0.4, ease: "power3.out" }, "-=0.3");
}

function closeProject() {
  if (overlayAnimating) return;
  const overlay = document.querySelector(".project-overlay");
  if (!overlay || !overlay.classList.contains("open")) return;
  const bar = overlay.querySelector(".project-overlay__bar");
  const d1 = reducedMotion ? 0.01 : 0.42;
  const d2 = reducedMotion ? 0.01 : 0.55;

  overlayAnimating = true;
  gsap
    .timeline({ onComplete: () => (overlayAnimating = false) })
    .to(bar, { opacity: 0, yPercent: 16, duration: 0.2, ease: "power2.in" })
    .add(coverBars({ duration: d1 }), "-=0.05")
    .add(() => {
      overlay.classList.remove("open", "is-playing");
      overlay.querySelectorAll("video").forEach((v) => v.pause());
      document.body.style.overflow = "";
    })
    .add(uncoverBars({ duration: d2 }), "+=0.02");
}

function initOverlayClose() {
  const overlay = document.querySelector(".project-overlay");
  if (!overlay) return;
  overlay.querySelector(".project-overlay__close").addEventListener("click", closeProject);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeProject();
  });
}

/* ------------------------------------------------------------
   SERVICES accordion
   ------------------------------------------------------------ */
function initServices() {
  document.querySelectorAll(".svc__row").forEach((row) => {
    const head = row.querySelector(".svc__head");
    const body = row.querySelector(".svc__body");
    head.addEventListener("click", () => {
      const isOpen = row.classList.contains("open");
      document.querySelectorAll(".svc__row.open").forEach((other) => {
        if (other === row) return;
        other.classList.remove("open");
        gsap.to(other.querySelector(".svc__body"), { height: 0, duration: 0.5, ease: "power3.inOut" });
      });
      row.classList.toggle("open", !isOpen);
      gsap.to(body, {
        height: isOpen ? 0 : "auto",
        duration: 0.6,
        ease: "power3.inOut",
      });
      if (!isOpen) {
        gsap.fromTo(
          body.querySelectorAll("li"),
          { opacity: 0, x: -14 },
          { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, delay: 0.15, ease: "power2.out" }
        );
      }
      setTimeout(() => ScrollTrigger.refresh(), 650);
    });
  });
}

/* ------------------------------------------------------------
   boot
   ------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  splitStatements();

  const cameFromNav = document.documentElement.classList.contains("nav-incoming");
  if (cameFromNav && !QA) {
    // arrived via an internal link: bars are covering (inline head script);
    // take GSAP ownership of their transforms, then swing them open
    initBars(true);
    document.documentElement.classList.remove("nav-incoming");
    const pre = document.querySelector(".preloader");
    if (pre) pre.style.display = "none";
    entrance();
    uncoverBars({ duration: reducedMotion ? 0.01 : 0.7, withMark: true, delay: 0.1 });
  } else {
    initBars(false);
    document.documentElement.classList.remove("nav-incoming");
    runPreloader();
  }

  initTransitions();
  initMenu();
  initScrollMotion();
  initWorkCards();
  initOverlayClose();
  initServices();

  const yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();
});
