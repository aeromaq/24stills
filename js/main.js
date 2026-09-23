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
    ".mosaic__item{opacity:1 !important;transform:none !important}" +
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
   LETTERBOX BARS — shared "cinema shutter" motif.
   Reused by: preloader hand-off and page transitions.
   One instance per page (.bars).
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
  // detail pages open on the project title rather than a hero headline
  const detail = document.querySelector(".detail-hero__inner");
  if (detail) {
    gsap.fromTo(
      detail.children,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "power3.out" }
    );
  }
}

/* ------------------------------------------------------------
   ANCHOR SCROLLING

   Native anchor jumps and `scroll-behavior: smooth` both fight
   ScrollTrigger: pinned sections insert a pin-spacer *after* the browser
   has already resolved the target's position, so the landing offset is
   computed against a layout that no longer exists. On a cold load of
   `index.html#contact` that left the page sitting at scroll 0 — the
   Services / Contact nav links did nothing when followed from another
   page. So we own anchor scrolling entirely: measure after ScrollTrigger
   has built its spacers, then scroll.
   ------------------------------------------------------------ */
function scrollToTarget(target, smooth = true) {
  if (!target) return;
  ScrollTrigger.refresh();
  const top = target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({
    top,
    behavior: smooth && !reducedMotion ? "smooth" : "auto",
  });
}

/** Resolve the "#id" part of an href to an element on this page, or null. */
function sameDocTarget(href) {
  if (!href) return null;
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return null;
  const id = href.slice(hashIndex + 1);
  if (!id) return null;

  const pathPart = href.slice(0, hashIndex);
  if (pathPart) {
    // "index.html#services" only counts as same-document when we're on index
    const here = window.location.pathname.split("/").pop() || "index.html";
    const there = pathPart.split("/").pop();
    if (there && there !== here) return null;
  }
  return document.getElementById(id);
}

function initAnchors() {
  document.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    const target = sameDocTarget(href);
    if (!target) return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (document.body.classList.contains("menu-open")) closeMenu();
      scrollToTarget(target);
      history.replaceState(null, "", "#" + target.id);
    });
  });
}

/* A hash present on load. Placing the page once isn't enough: the webfont
   reflows headlines and lazy images fill their boxes *after* the first
   placement, which slides the target out from under us. So we re-apply the
   landing position on each settling milestone, and stop the moment the
   visitor takes over the scroll themselves. */
let hashTarget = null;

function applyHashLanding() {
  if (!hashTarget) return;
  scrollToTarget(hashTarget, false);
}

function honorInitialHash() {
  if (!window.location.hash) return;
  hashTarget = document.getElementById(window.location.hash.slice(1));
  if (!hashTarget) return;

  const release = () => (hashTarget = null);
  // any deliberate input from the visitor ends our claim on the scroll position
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach((evt) =>
    window.addEventListener(evt, release, { once: true, passive: true })
  );

  requestAnimationFrame(() => requestAnimationFrame(applyHashLanding));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(applyHashLanding).catch(() => {});
  }
  window.addEventListener("load", () => setTimeout(applyHashLanding, 60), { once: true });
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
      !href.startsWith("tel:") &&
      !href.startsWith("http") &&
      !a.target &&
      !sameDocTarget(href); // in-page anchors are handled by initAnchors
    if (!internal) return;

    a.addEventListener("click", (e) => {
      // let modifier-clicks open a new tab the way the user asked
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
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
  overlay.removeAttribute("aria-hidden");

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
    onComplete: () => {
      gsap.set(overlay, { visibility: "hidden" });
      overlay.setAttribute("aria-hidden", "true");
    },
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

/* Headline drift, at a throw the current breakpoint can actually accommodate.
   Registered through ScrollTrigger.matchMedia so switching breakpoints tears
   the old triggers down instead of stacking a second set on top. */
function driftHeadlines(throwPx) {
  document.querySelectorAll("[data-drift]").forEach((el) => {
    const dir = el.dataset.drift === "left" ? 1 : -1;
    gsap.fromTo(
      el,
      { x: throwPx * dir },
      {
        x: -throwPx * dir,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
      }
    );
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

  /* Oversized section headlines drift sideways as you scroll. The ±50px throw
     is sized for desktop; on a 390px screen it slides the display type out past
     the gutter, where body{overflow-x:hidden} silently clips it. Scale the
     throw to the viewport instead of shipping one number to every breakpoint. */
  /* Three tiers, not two: at tablet widths the display type is still large but
     the gutter is not, so the full desktop throw pushed headings past the edge
     where body{overflow-x:hidden} clipped them. */
  ScrollTrigger.matchMedia({
    "(min-width: 1000px)": () => driftHeadlines(50),
    "(min-width: 768px) and (max-width: 999px)": () => driftHeadlines(22),
    "(max-width: 767px)": () => driftHeadlines(10),
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

  // project detail hero — slow push-in as the page is scrolled away
  const detailBg = document.querySelector(".detail-hero__bg");
  if (detailBg) {
    gsap.to(detailBg, {
      yPercent: 10,
      scale: 1.08,
      ease: "none",
      scrollTrigger: { trigger: ".detail-hero", start: "top top", end: "bottom top", scrub: true },
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

  // mosaic tiles stagger up as each row enters
  document.querySelectorAll(".mosaic").forEach((grid) => {
    gsap.to(grid.querySelectorAll(".mosaic__item"), {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.06,
      ease: "power3.out",
      scrollTrigger: { trigger: grid, start: "top 88%" },
    });
  });

  initZoomBands();
}

/* Interstitial bands — pinned push-in zoom text.

   Pinning a full-height section is only a good idea when there's room for
   it: on short/mobile viewports it eats the whole screen for a scroll
   length that reads as "the page is stuck". matchMedia scopes the pin to
   desktop and tears it down cleanly on resize; below that the band still
   gets its push-in, just unpinned. */
function initZoomBands() {
  const bands = document.querySelectorAll(".band--zoom");
  if (!bands.length) return;

  ScrollTrigger.matchMedia({
    "(min-width: 900px)": () => {
      bands.forEach((band) => {
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
    },
    "(max-width: 899px)": () => {
      bands.forEach((band) => {
        const statement = band.querySelector(".statement");
        if (!statement) return;
        gsap.fromTo(
          statement,
          { scale: 0.82 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: 0.6 },
          }
        );
      });
    },
  });
}

/* ------------------------------------------------------------
   WORK CARDS & MOSAIC TILES — hover play loop.
   Cards are real links to /work/<slug>/, so there is no click handler
   here: navigation is the anchor's job (and stays crawlable).
   ------------------------------------------------------------ */
function initWorkCards() {
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  document.querySelectorAll(".work-card, .mosaic__item").forEach((card) => {
    const video = card.querySelector("video");
    if (!video) return;

    card.classList.add("has-video");
    const media = card.querySelector(".work-card__media, .mosaic__media");
    if (media && !media.querySelector(".work-card__ring")) {
      const ring = document.createElement("span");
      ring.className = "work-card__ring";
      ring.setAttribute("aria-hidden", "true");
      media.appendChild(ring);
    }

    if (!canHover) {
      /* Touch devices get no hover state, so the loop would never play and
         `preload="none"` would leave a dead <video> in the DOM. Drop it and
         let the poster image stand — the film itself lives on the detail
         page, which is one tap away. */
      video.remove();
      card.classList.remove("has-video");
      return;
    }

    const play = () => video.play().catch(() => {});
    const stop = () => {
      video.pause();
      video.currentTime = 0;
    };
    card.addEventListener("mouseenter", play);
    card.addEventListener("focusin", play);
    card.addEventListener("mouseleave", stop);
    card.addEventListener("focusout", stop);
  });
}

/* ------------------------------------------------------------
   HERO SHOWREEL — load the film only where it earns its bytes.

   The showreel is a ~4 MB decorative layer sitting at 62% opacity behind the
   headline. On a phone, or on a metered/slow connection, the poster frame
   carries the same image at 260 KB, so the video is simply never requested.
   ------------------------------------------------------------ */
function initHeroVideo() {
  const video = document.querySelector(".hero video[data-src]");
  if (!video) return;

  const conn = navigator.connection || {};
  const tooExpensive =
    conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || "");
  const bigEnough = window.matchMedia("(min-width: 900px)").matches;

  if (reducedMotion || tooExpensive || !bigEnough) return; // poster stands in

  video.src = video.dataset.src;
  video.load();
  video.play().catch(() => {
    /* autoplay refused — the poster is already showing, so nothing to do */
  });
}

/* ------------------------------------------------------------
   PROJECT DETAIL — poster-first player.
   The <video> ships with `controls` and `preload="none"` so it is usable
   even if this script never runs; the overlaid button is progressive
   enhancement that starts playback on the first tap (which also satisfies
   iOS's user-gesture requirement).
   ------------------------------------------------------------ */
function initDetailFilm() {
  document.querySelectorAll(".detail-film__frame").forEach((frame) => {
    const btn = frame.querySelector(".detail-film__play");
    if (!btn) return;

    const ytId = frame.dataset.youtube;
    if (ytId) {
      /* Swap the facade for the real embed on first click, with autoplay=1 so
         the click the visitor already made is the one that starts the film. */
      btn.addEventListener(
        "click",
        () => {
          const iframe = document.createElement("iframe");
          iframe.className = "detail-film__embed";
          iframe.src =
            "https://www.youtube-nocookie.com/embed/" +
            encodeURIComponent(ytId) +
            "?autoplay=1&rel=0&modestbranding=1";
          iframe.title = frame.dataset.title || "Project film";
          iframe.allow = "accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen";
          iframe.allowFullscreen = true;
          iframe.setAttribute("frameborder", "0");
          frame.appendChild(iframe);
          frame.classList.add("is-playing");
        },
        { once: true }
      );
      return;
    }

    const video = frame.querySelector("video");
    if (!video) return;
    btn.addEventListener("click", () => {
      frame.classList.add("is-playing");
      video.play().catch(() => {});
      video.focus({ preventScroll: true });
    });
    video.addEventListener("play", () => frame.classList.add("is-playing"));
  });
}

/* ============================================================
   LEGACY WEBFLOW COMPATIBILITY — the "netflix effect" overlay.

   The static build ships work cards as <a> links to /work/<slug>/. The live
   Webflow site is still the pre-revision Designer build: <button
   class="work-card" data-project="…"> plus a single .project-overlay
   container, with no detail pages to link to. Both load this one file from
   jsDelivr, so removing the overlay outright would leave every work card on
   the published site a dead click until the Designer is rebuilt
   (WEBFLOW-BUILD.md §6/§6b).

   So the overlay stays, activated only when that legacy markup is present.
   Delete this whole section once the Webflow pages are rebuilt as links.
   ============================================================ */

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

/* A legacy card is one that carries `data-project` but doesn't actually point
   anywhere: Webflow's Designer renders these as <a href="#"> (a link block with
   no page set) or as <button>. Cards in the new build point at /work/<slug>/,
   so they never match and keep their plain navigation. */
function legacyCards() {
  return [...document.querySelectorAll("[data-project]")].filter((el) => {
    if (!el.classList.contains("work-card") && !el.classList.contains("mosaic__item")) return false;
    const href = el.getAttribute("href");
    return !href || href === "#";
  });
}

function initLegacyOverlay() {
  if (!document.querySelector(".project-overlay")) return;
  const cards = legacyCards();
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault(); // href="#" would otherwise jump the page to the top
      openProject(card.dataset.project, card);
    });
  });
  initOverlayClose();
}

/* ------------------------------------------------------------
   WEBFLOW WORK DETAIL — build the player from bound CMS fields.

   The Webflow collection template can't put a CMS value into an element
   attribute (the API rejects attribute value bindings for these field types),
   so the page carries hidden spans whose *text* is bound instead — the
   `[data-field]` fallback this project already documents. This reads them and
   renders the same poster-first player the static build uses.
   ------------------------------------------------------------ */
function initWebflowDetailFilm() {
  const host = document.querySelector('[data-wfd="film"]');
  if (!host) return;

  const read = (name) => {
    const el = host.querySelector('[data-field="' + name + '"]');
    return el ? el.textContent.trim() : "";
  };

  /* `film` is the full piece; `media` is only the short cut that plays under
     the cursor on a card. Prefer the film, and fall back to the cut for
     projects whose full film has not been delivered yet. */
  const src = read("film") || read("media");
  const youtube = read("youtube");
  const title = read("title") || "this project";
  /* Media type is authoritative when set; fall back to the file extension so a
     project is never mis-rendered just because the option was left blank. */
  const declared = read("mediaType").toLowerCase();
  const isVideo =
    !!read("film") || declared === "video" || (!declared && /\.(mp4|webm|mov)(\?|$)/i.test(src));

  if (!youtube && !isVideo) return; // stills-only project: the hero carries it

  const poster = document.querySelector('[data-wfd="hero-bg"]');
  const frame = document.createElement("div");
  frame.className = "detail-film__frame";

  if (youtube) {
    frame.classList.add("detail-film__frame--yt");
    frame.dataset.youtube = youtube;
    frame.dataset.title = title;
    if (poster && poster.currentSrc) {
      const img = document.createElement("img");
      img.className = "detail-film__poster";
      img.src = poster.currentSrc;
      img.alt = "";
      frame.appendChild(img);
    }
  } else {
    const video = document.createElement("video");
    video.className = "detail-film__video";
    video.src = src;
    if (poster && poster.currentSrc) video.poster = poster.currentSrc;
    video.controls = true;
    video.playsInline = true;
    video.preload = "none";
    video.setAttribute("aria-label", title + " \u2014 film by 24stills");
    frame.appendChild(video);
  }

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "detail-film__play";
  btn.setAttribute("aria-label", "Play " + title);
  btn.innerHTML = '<span class="ring" aria-hidden="true"></span><span class="rec">Play Film</span>';
  frame.appendChild(btn);

  host.prepend(frame);
  host.classList.add("has-film");
  initDetailFilm(); // wires the play button, YouTube facade included
}

/* ------------------------------------------------------------
   WEDDING FILMS — play in place.

   Wedding films have no detail pages of their own (they aren't CMS projects),
   so a tile swaps itself for a player on click rather than navigating. Hover
   loops come free from initWorkCards, which already treats .mosaic__item.
   ------------------------------------------------------------ */
function initWeddingFilms() {
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Matched on the attribute, not a class: the Webflow page can set custom
     attributes on a tile but cannot apply `wed-film`, which isn't a registered
     Webflow style. One selector then drives both builds. */
  document.querySelectorAll("[data-film]").forEach((tile) => {
    /* The hand-built page wraps the still in `.mosaic__media`; a Webflow tile
       has no such class, so fall back to the tile itself. Both the hover loop
       and the click-to-play player go into whichever one we resolve here —
       resolving it twice is how the Webflow click silently did nothing. */
    const media = tile.querySelector(".mosaic__media, [data-wed='media']") || tile;
    /* No hover state on touch, so the loop would never play and `preload=none`
       would leave a dead <video> behind — skip it there and let the still
       stand, exactly as initWorkCards() does for the mosaic. */
    if (canHover && tile.dataset.loop && !tile.querySelector("video")) {
      const loop = document.createElement("video");
      loop.className = "wed-film__loop";
      loop.muted = true; loop.loop = true; loop.playsInline = true;
      loop.preload = "none"; loop.src = tile.dataset.loop;
      loop.setAttribute("aria-hidden", "true");
      loop.tabIndex = -1;
      media.appendChild(loop);
      tile.classList.add("has-film");
      tile.addEventListener("mouseenter", () => loop.play().catch(() => {}));
      tile.addEventListener("mouseleave", () => { loop.pause(); loop.currentTime = 0; });
    }
    tile.addEventListener("click", () => {
      if (tile.classList.contains("is-playing")) return;
      const poster = tile.querySelector("img");

      const video = document.createElement("video");
      video.className = "wed-film__video";
      video.src = tile.dataset.film;
      if (poster) video.poster = poster.currentSrc || poster.src;
      video.controls = true;
      video.playsInline = true;
      video.setAttribute("aria-label", (tile.dataset.filmTitle || "Wedding film") + " — by 24stills");

      media.querySelectorAll("video").forEach((v) => v.remove()); // drop the hover loop
      media.appendChild(video);
      tile.classList.add("is-playing");
      video.play().catch(() => {});
    });
  });
}

/* ------------------------------------------------------------
   FAVICON — dark mark on a light UI, light mark on a dark one.

   Done in JS rather than `<link media="(prefers-color-scheme: dark)">`
   because Chrome ignores `media` on an icon link; only Firefox and Safari
   honour it. Swapping here works everywhere and, unlike the declarative
   form, also follows the visitor flipping their theme mid-session.

   Every icon link is marked `data-favicon` and named `favicon-<scheme>-<px>`,
   so the swap is a filename substitution and the same code serves both the
   static build (relative paths) and Webflow (absolute CDN URLs).
   ------------------------------------------------------------ */
function initFavicon() {
  let links = [...document.querySelectorAll("link[data-favicon]")];
  if (!links.length) return;

  const query = window.matchMedia("(prefers-color-scheme: dark)");

  const apply = () => {
    const scheme = query.matches ? "dark" : "light";
    links = links.map((link) => {
      const href = link.getAttribute("href") || "";
      const next = href.replace(/favicon-(?:light|dark)-/, `favicon-${scheme}-`);
      if (next === href) return link;
      /* Replace the node instead of mutating href: Chrome caches an icon
         against the element and will happily keep painting the old one. */
      const fresh = link.cloneNode(false);
      fresh.setAttribute("href", next);
      link.replaceWith(fresh);
      return fresh;
    });
  };

  apply();
  if (query.addEventListener) query.addEventListener("change", apply);
  else if (query.addListener) query.addListener(apply); // Safari < 14
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
        other.querySelector(".svc__head").setAttribute("aria-expanded", "false");
        gsap.to(other.querySelector(".svc__body"), { height: 0, duration: 0.5, ease: "power3.inOut" });
      });

      row.classList.toggle("open", !isOpen);
      head.setAttribute("aria-expanded", String(!isOpen));
      gsap.to(body, {
        height: isOpen ? 0 : "auto",
        duration: 0.6,
        ease: "power3.inOut",
        /* Refresh once the row has finished resizing rather than on a
           guessed timeout, so triggers below never measure mid-animation. */
        onComplete: () => ScrollTrigger.refresh(),
      });
      if (!isOpen) {
        gsap.fromTo(
          body.querySelectorAll("li"),
          { opacity: 0, x: -14 },
          { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, delay: 0.15, ease: "power2.out" }
        );
      }
    });
  });
}

/* ------------------------------------------------------------
   FAQ accordion (weddings)
   ------------------------------------------------------------ */
function initFaq() {
  document.querySelectorAll(".faq__row").forEach((row) => {
    const head = row.querySelector(".faq__q");
    const body = row.querySelector(".faq__a");
    if (!head || !body) return;
    head.addEventListener("click", () => {
      const isOpen = row.classList.contains("open");
      row.classList.toggle("open", !isOpen);
      head.setAttribute("aria-expanded", String(!isOpen));
      gsap.to(body, {
        height: isOpen ? 0 : "auto",
        duration: 0.45,
        ease: "power3.inOut",
        onComplete: () => ScrollTrigger.refresh(),
      });
    });
  });
}

/* ------------------------------------------------------------
   LAYOUT SETTLING

   Every trigger position is a measurement of the page, and the page keeps
   changing after DOMContentLoaded: the display webfont reflows headlines,
   lazy images fill their boxes, the hero video swaps in. Each of those
   invalidates start/end values that were computed earlier. Refresh once
   the page has actually stopped moving.
   ------------------------------------------------------------ */
function initRefreshTriggers() {
  const refresh = () => {
    ScrollTrigger.refresh();
    applyHashLanding();
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refresh).catch(() => {});
  }
  window.addEventListener("load", refresh, { once: true });

  // catch any image that resolves late without pinning a listener per image
  if ("ResizeObserver" in window) {
    let pending = null;
    const ro = new ResizeObserver(() => {
      clearTimeout(pending);
      pending = setTimeout(refresh, 120);
    });
    ro.observe(document.body);
  }
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
  initAnchors();
  initMenu();
  initScrollMotion();
  initWorkCards();
  initHeroVideo();
  initDetailFilm();
  initFavicon();
  initWebflowDetailFilm();
  initWeddingFilms();
  initLegacyOverlay();
  initServices();
  initFaq();
  initRefreshTriggers();
  honorInitialHash();

  const yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();
});
