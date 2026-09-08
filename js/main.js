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
   PROJECT DETAIL — poster-first player.
   The <video> ships with `controls` and `preload="none"` so it is usable
   even if this script never runs; the overlaid button is progressive
   enhancement that starts playback on the first tap (which also satisfies
   iOS's user-gesture requirement).
   ------------------------------------------------------------ */
function initDetailFilm() {
  document.querySelectorAll(".detail-film__frame").forEach((frame) => {
    const video = frame.querySelector("video");
    const btn = frame.querySelector(".detail-film__play");
    if (!video || !btn) return;

    btn.addEventListener("click", () => {
      frame.classList.add("is-playing");
      video.play().catch(() => {});
      video.focus({ preventScroll: true });
    });
    video.addEventListener("play", () => frame.classList.add("is-playing"));
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
  initDetailFilm();
  initServices();
  initFaq();
  initRefreshTriggers();
  honorInitialHash();

  const yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();
});
