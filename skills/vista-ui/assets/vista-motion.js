/* ==========================================================================
   VISTA MOTION — choreography & micro-interactions for Vista UI. No dependencies.
   Load it in <head>, right after vista.css (NOT deferred) so the entrance starts without a flash:
       <link rel="stylesheet" href="vista.css"><script src="vista-motion.js"></script>

   Automatic (nothing to write):
     · page entrance  chrome slides in → panel settles → page head → cards rise in reading order
     · scroll reveal  cards below the fold rise when they enter the viewport (batched + staggered)
     · count-up       .vx-stat__value and [data-vx-count] count from 0 when their card lands
     · progress       .vx-progress bars fill when their card lands
     · glider         .vx-seg / .vx-tabs / sidebar .vx-nav / dock / rail get one sliding active pill
   Opt-in classes / attributes:
     .vx-glow                    cursor spotlight + lit border on glass cards
     .vx-tilt [data-vx-tilt=5]   subtle 3D tilt toward the cursor (max degrees)
     [data-vx-reveal]            scroll-reveal for anything that is not a card
     [data-vx-count="off"]       opt a number out of count-up
     [data-vx-swap="selector"]   on a data-vx-group: crossfade / replay the target when the choice changes
     [data-vx-toast="Text"]      on a button: show a toast on click (+ data-vx-toast-tone, data-vx-toast-sub)
     [data-vx-loading="900"]     on a button: spinner for N ms first (then the toast, if any)
   Levels: <html data-vx-motion="subtle | standard (default) | expressive | off">.
   prefers-reduced-motion always wins → final states, no movement.
   JS API: VistaMotion.{init, replay, reveal, countUp, countTo, flash, swap, insert, remove, enter,
           toast, loading, finish, level}
   ========================================================================== */
(function (global) {
  "use strict";
  var doc = document, root = doc.documentElement;
  var mq = global.matchMedia ? global.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var CAN = typeof Element !== "undefined" && !!Element.prototype.animate;

  function level() {
    if (mq.matches || !CAN) return "off";
    var v = root.getAttribute("data-vx-motion");
    return v === "off" || v === "subtle" || v === "expressive" ? v : "standard";
  }
  function on() { return level() !== "off"; }

  /* ---- boot: hide the shell for the first frame (CSS has a 1.6s failsafe) ---- */
  if (on()) { root.classList.add("vx-motion"); if (doc.readyState === "loading") root.classList.add("vx-boot"); }

  /* ---- tokens (single source of truth = CSS custom properties) ---- */
  var T = {}, okEase = {};
  function readTokens() {
    var cs = getComputedStyle(root);
    function ms(name, fb) {
      var v = cs.getPropertyValue(name).trim(), n = parseFloat(v);
      return isNaN(n) ? fb : /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n;
    }
    function ease(name, fb) {
      var v = cs.getPropertyValue(name).trim();
      if (!v) return fb;
      if (okEase[v] === undefined) {
        try { doc.createElement("div").animate([], { duration: 1, easing: v }).cancel(); okEase[v] = true; }
        catch (e) { okEase[v] = false; }
      }
      return okEase[v] ? v : fb;
    }
    T.press = ms("--vx-dur-press", 90); T.fast = ms("--vx-dur-fast", 160); T.glide = ms("--vx-dur-glide", 420);
    T.enter = ms("--vx-dur-enter", 560); T.draw = ms("--vx-dur-draw", 900); T.stagger = ms("--vx-stagger", 45);
    T.out = ease("--vx-ease-out", "cubic-bezier(.16,1,.3,1)");
    T.in = ease("--vx-ease-in", "cubic-bezier(.55,0,.75,.2)");
    T.inOut = ease("--vx-ease-in-out", "cubic-bezier(.65,0,.35,1)");
    T.spring = ease("--vx-ease-spring", T.out);
    T.bounce = ease("--vx-ease-bounce", T.spring);
  }

  function anim(el, frames, opts) {
    if (!el || !CAN) return null;
    try { return el.animate(frames, opts); } catch (e) { return null; }
  }
  /* rise: the one entrance primitive. Uses individual translate/scale so it never fights an
     element's own transform (centered docks, hover lifts). fill:"backwards" holds the start
     frame during the delay; nothing is left behind when it ends. */
  function rise(el, delay, o) {
    o = o || {};
    var from = { opacity: 0, translate: (o.x || 0) + "px " + (o.y === undefined ? 14 : o.y) + "px" };
    var to = { opacity: 1, translate: "0px 0px" };
    if (o.s && o.s !== 1) { from.scale = String(o.s); to.scale = "1"; }
    if (o.blur) { from.filter = "blur(" + o.blur + "px)"; to.filter = "blur(0px)"; }
    return anim(el, [from, to], { duration: o.dur || T.enter, delay: delay || 0, easing: o.ease || T.out, fill: "backwards" });
  }
  function tune() {
    var L = level();
    return L === "subtle" ? { d: 6, s: 1, st: 0.7, rows: false, nav: false, count: false }
      : L === "expressive" ? { d: 26, s: 0.965, st: 1.25, rows: true, nav: true, count: true, blur: 8 }
        : { d: 16, s: 0.985, st: 1, rows: true, nav: true, count: true };
  }
  function q(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function shown(el) { return el.getClientRects().length > 0; }

  /* ---- numbers ---------------------------------------------------------- */
  var NUM_RE = /^([\s\S]*?)(-?\d[\d,]*(?:\.\d+)?)([\s\S]*)$/;
  function parseNum(el) {
    var w = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      var m = NUM_RE.exec(n.nodeValue);
      if (m) {
        var raw = m[2], dec = raw.indexOf(".") >= 0 ? raw.split(".")[1].length : 0;
        return { node: n, pre: m[1], post: m[3], value: parseFloat(raw.replace(/,/g, "")), dec: dec, group: raw.indexOf(",") >= 0 };
      }
    }
    return null;
  }
  function fmtNum(v, dec, group) {
    var s = Math.abs(v).toFixed(dec), parts = s.split(".");
    if (group) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (v < 0 ? "-" : "") + parts.join(".");
  }
  function expoOut(p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); }
  /* The tween is driven by an (empty) Web Animation, so finish()/pause()/currentTime scrub it too. */
  function tweenNum(el, from, to, o) {
    var p = parseNum(el);
    if (!p || !on()) return null;
    if (el.__vxNum) { el.__vxNum.cancel(); p = parseNum(el); }
    var finalText = o.finalText || p.pre + fmtNum(to, p.dec, p.group) + p.post;
    var dur = o.duration || T.draw, delay = o.delay || 0;
    var a = anim(el, [], { duration: dur, delay: delay, fill: "none" });
    if (!a) return null;
    el.__vxNum = a;
    var lockW = el.style.minWidth;
    if (getComputedStyle(el).display.indexOf("inline") >= 0 || el.parentElement && getComputedStyle(el.parentElement).display.indexOf("flex") >= 0) {
      el.style.minWidth = el.getBoundingClientRect().width + "px";   // stop neighbours from jiggling
    }
    function set(v) { p.node.nodeValue = p.pre + fmtNum(v, p.dec, p.group) + p.post; }
    function done() { p.node.nodeValue = finalText; el.style.minWidth = lockW; if (el.__vxNum === a) el.__vxNum = null; }
    set(from);
    (function tick() {
      if (el.__vxNum !== a) return;
      var t = a.currentTime;
      if (t !== null) set(from + (to - from) * expoOut(Math.max(0, Math.min(1, (t - delay) / dur))));
      if (a.playState !== "finished") requestAnimationFrame(tick);
    })();
    a.onfinish = done; a.oncancel = function () { if (el.__vxNum === a) done(); };
    return a;
  }
  function countUp(el, o) {
    o = o || {};
    if (!el || el.getAttribute("data-vx-count") === "off") return null;
    if (el.__vxNum) return null;                      // already counting (chart center + card)
    var p = parseNum(el);
    if (!p || !p.value) return null;
    var from = el.hasAttribute("data-vx-from") ? parseFloat(el.getAttribute("data-vx-from")) : 0;
    return tweenNum(el, from, p.value, { delay: o.delay, duration: o.duration, finalText: p.node.nodeValue });
  }
  /* countTo(el, 16702) — animate a live value change, keep its format, flash green/red */
  function countTo(el, to, o) {
    o = o || {};
    var p = parseNum(el);
    if (!p) return null;
    var from = p.value;
    if (!on()) { p.node.nodeValue = p.pre + fmtNum(to, p.dec, p.group) + p.post; return null; }
    var a = tweenNum(el, from, to, { duration: o.duration || T.draw * 0.7, delay: o.delay || 0 });
    if (o.flash !== false && to !== from) flash(el, to > from ? "up" : "down");
    return a;
  }
  function flash(el, dir) {
    if (!el) return;
    el.classList.remove("vx-flash", "vx-flash--up", "vx-flash--down");
    void el.offsetWidth;
    el.classList.add("vx-flash");
    if (dir) el.classList.add("vx-flash--" + dir);
    el.addEventListener("animationend", function h() { el.classList.remove("vx-flash", "vx-flash--up", "vx-flash--down"); el.removeEventListener("animationend", h); });
  }

  /* ---- entrance & scroll reveal ---------------------------------------- */
  var BLOCK = ".vx-card, .vx-quick__item, .vx-insight, .vx-add-tile, [data-vx-reveal]";
  var CHROME = ".vx-sidebar, .vx-topbar, .vx-spatial__top, .vx-spatial__rail, .vx-spatial__dock, .vx-toasts";
  var COUNT = ".vx-stat__value, [data-vx-count]:not([data-vx-count=off])";
  var revealIO = null;

  /* everything that happens when one block lands: rise, numbers, bars, rows */
  function land(el, delay, k) {
    el.classList.remove("vx-pre");
    el.__vxAt = performance.now() + delay;                 // vista-charts syncs its draw-in to this
    rise(el, delay, { y: k.d, s: k.s, ease: level() === "expressive" ? T.spring : T.out });
    if (k.count) q(COUNT, el).concat(el.matches(COUNT) ? [el] : []).forEach(function (n) {
      if (!n.closest(".vx-chart")) countUp(n, { delay: delay + 80 });
    });
    q(".vx-progress > i", el).forEach(function (b, i) {
      anim(b, [{ clipPath: "inset(0 100% 0 0 round 999px)" }, { clipPath: "inset(0 0% 0 0 round 999px)" }],
        { duration: T.draw, delay: delay + 160 + i * 60, easing: T.out, fill: "backwards" });
    });
    if (k.rows) q(".vx-table tbody tr, .vx-list > .vx-list__item, .vx-chat > *", el).slice(0, 8).forEach(function (r, i) {
      anim(r, [{ opacity: 0, translate: "0 6px" }, { opacity: 1, translate: "0 0" }],
        { duration: T.enter * 0.8, delay: delay + 140 + i * 35, easing: T.out, fill: "backwards" });
    });
  }
  function blocks() {
    return q(BLOCK).filter(function (el) {
      return !el.closest(CHROME) && !el.closest(".vx-page-head") && !(el.parentElement && el.parentElement.closest(BLOCK)) && shown(el);
    });
  }
  function readingOrder(list) {
    return list.map(function (el) { return { el: el, r: el.getBoundingClientRect() }; })
      .sort(function (a, b) { return Math.round(a.r.top / 24) - Math.round(b.r.top / 24) || a.r.left - b.r.left; });
  }
  function entrance() {
    var k = tune(), vh = global.innerHeight || 800;
    // 1 · chrome
    q(".vx-shell--notch").forEach(function (el) { rise(el, 0, { y: 0, s: 0.99 }); });
    q(".vx-sidebar").forEach(function (el) { rise(el, 0, { x: -k.d, y: 0 }); });
    q(".vx-topbar").forEach(function (el) { rise(el, 40, { y: -10 }); });
    q(".vx-spatial__top").forEach(function (el) { rise(el, 0, { y: -12 }); });
    q(".vx-spatial__rail").forEach(function (el) { rise(el, 80, { x: -k.d, y: 0 }); });
    q(".vx-spatial__dock").forEach(function (el) { rise(el, 140, { y: k.d }); });
    if (k.nav) q(".vx-nav").forEach(function (nav) {
      q(":scope > :not(.vx-glider)", nav).forEach(function (it, i) {
        var o = { x: -8, y: 0, dur: T.enter * 0.8 }, d = 110 + Math.min(i, 16) * 22;
        rise(it, d, o);
        if (it.classList.contains("is-active") && nav.__vxGlider) rise(nav.__vxGlider, d, o);
      });
    });
    q(".vx-plan .vx-progress > i").forEach(function (b) {
      anim(b, [{ clipPath: "inset(0 100% 0 0 round 999px)" }, { clipPath: "inset(0 0% 0 0 round 999px)" }], { duration: T.draw, delay: 420, easing: T.out, fill: "backwards" });
    });
    // 2 · panel
    q(".vx-panel").forEach(function (el) { rise(el, 60, { y: k.d + 6, s: k.s, dur: T.enter * 1.15 }); });
    // 3 · page head (eyebrow → title → summary → actions)
    q(".vx-page-head__text > *, .vx-page-head__actions").forEach(function (el, i) {
      rise(el, 150 + i * 55 * k.st, { y: 10, blur: k.blur && el.classList.contains("vx-h1") ? k.blur : 0 });
    });
    // 4 · blocks: visible ones in reading order, the rest wait for scroll
    var visible = [], later = [];
    blocks().forEach(function (el) { (el.getBoundingClientRect().top < vh * 0.97 ? visible : later).push(el); });
    readingOrder(visible).forEach(function (it, i) { land(it.el, 230 + Math.min(i, 12) * T.stagger * k.st, k); });
    if (!later.length) return;
    if (!global.IntersectionObserver) { later.forEach(function (el) { land(el, 0, k); }); return; }
    later.forEach(function (el) { el.classList.add("vx-pre"); });
    revealIO = revealIO || new IntersectionObserver(function (entries) {
      var hits = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { revealIO.unobserve(e.target); return e.target; });
      readingOrder(hits).forEach(function (it, i) { land(it.el, i * T.stagger * 1.3, tune()); });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    later.forEach(function (el) { revealIO.observe(el); });
  }
  function reveal(el, delay) { if (revealIO) revealIO.unobserve(el); if (on()) land(el, delay || 0, tune()); else el.classList.remove("vx-pre"); }

  /* ---- glider ------------------------------------------------------------ */
  var GLIDE = ".vx-seg, .vx-tabs, .vx-spatial__dock, .vx-spatial__rail, .vx-shell--sidebar .vx-nav";
  function glide(c) {
    if (c.__vxGlider) return;
    var g = doc.createElement("span");
    g.className = "vx-glider is-still"; g.setAttribute("aria-hidden", "true");
    if (getComputedStyle(c).position === "static") c.style.position = "relative";
    c.classList.add("vx-glide"); c.appendChild(g); c.__vxGlider = g;   // last child: keeps :first-child / :nth-child selectors intact
    var tabs = c.classList.contains("vx-tabs");
    function place() {
      var a = c.querySelector(":scope > .is-active");
      if (!a || !a.offsetWidth) { g.style.opacity = "0"; return; }
      var y = tabs ? a.offsetTop + a.offsetHeight - 2 : a.offsetTop;
      g.style.opacity = "1";
      g.style.width = a.offsetWidth + "px";
      g.style.height = (tabs ? 2 : a.offsetHeight) + "px";
      g.style.transform = "translate(" + a.offsetLeft + "px," + y + "px)";
    }
    function still() { g.classList.add("is-still"); place(); requestAnimationFrame(function () { requestAnimationFrame(function () { g.classList.remove("is-still"); }); }); }
    still();
    if (global.MutationObserver) new MutationObserver(function (recs) {
      if (recs.some(function (r) { return r.target !== g; })) place();
    }).observe(c, { subtree: true, attributes: true, attributeFilter: ["class"], childList: true });
    if (global.ResizeObserver) new ResizeObserver(still).observe(c);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(still);
  }

  /* ---- swap / insert / remove (state changes that keep spatial continuity) ---- */
  function replayCharts(target) {
    if (!global.VistaCharts || !global.VistaCharts.replay) return;
    (target.matches("[data-vx-chart]") ? [target] : q("[data-vx-chart]", target)).forEach(global.VistaCharts.replay);
  }
  /* swap(target, update?) — quick fade-out (exit), run update, fade-in (enter). Interruptible:
     a newer swap on the same target cancels the old one and only the newest update runs. */
  function swap(target, update) {
    if (!target) return Promise.resolve();
    if (!update && target.matches("[data-vx-chart]")) { replayCharts(target); return Promise.resolve(); }
    if (!on()) { if (update) update(); else replayCharts(target); return Promise.resolve(); }
    if (target.__vxSwap) target.__vxSwap.cancel();
    var out = anim(target, [{ opacity: 0, translate: "0 -4px" }], { duration: T.fast, easing: T.in, fill: "forwards" });
    target.__vxSwap = out;
    return out.finished.then(function () {
      if (update) update(); else replayCharts(target);
      var inn = anim(target, [{ opacity: 0, translate: "0 6px" }, { opacity: 1, translate: "0 0" }], { duration: T.enter * 0.6, easing: T.out });
      out.cancel();
      target.__vxSwap = inn;
      return inn && inn.finished;
    }).catch(function () { /* interrupted by a newer swap */ });
  }
  /* FLIP: measure, mutate, then glide everything that moved back into place */
  function flip(nodes, mutate) {
    var first = nodes.map(function (n) { return n.getBoundingClientRect(); });
    mutate();
    if (!on()) return;
    nodes.forEach(function (n, i) {
      if (!n.isConnected) return;
      var r = n.getBoundingClientRect(), dx = first[i].left - r.left, dy = first[i].top - r.top;
      if (dx || dy) anim(n, [{ translate: dx + "px " + dy + "px" }, { translate: "0 0" }], { duration: T.glide, easing: T.spring });
    });
  }
  function enter(el, o) {
    o = o || {};
    rise(el, o.delay || 0, { y: o.y === undefined ? -6 : o.y, s: 0.98, ease: T.spring });
    if (o.flash !== false) flash(el);
    return el;
  }
  /* insert(list, row, before?) — new row slides in, siblings glide to make room */
  function insert(parent, node, ref) {
    var sibs = Array.prototype.slice.call(parent.children);
    flip(sibs, function () { parent.insertBefore(node, ref === undefined ? parent.firstChild : ref); });
    if (global.lucide && global.lucide.createIcons) global.lucide.createIcons();
    if (global.VistaCharts) global.VistaCharts.renderAll(node);
    return enter(node);
  }
  function remove(el) {
    var parent = el.parentElement, sibs = parent ? Array.prototype.slice.call(parent.children).filter(function (n) { return n !== el; }) : [];
    var a = on() ? anim(el, [{ opacity: 0, translate: "0 -4px", scale: "0.98" }], { duration: T.enter * 0.45, easing: T.in, fill: "forwards" }) : null;
    var go = function () { flip(sibs, function () { el.remove(); }); if (a) a.cancel(); };   // cancel: re-inserting (undo) shows it again
    return a ? a.finished.then(go, go) : Promise.resolve(go());
  }

  /* ---- toasts --------------------------------------------------------------- */
  var ICON = { success: "circle-check", info: "info", warn: "triangle-alert", danger: "circle-x" };
  function toast(msg, o) {
    o = typeof o === "string" ? { tone: o } : (o || {});
    var stack = doc.querySelector(".vx-toasts");
    if (!stack) {
      stack = doc.createElement("div"); stack.className = "vx-toasts";
      stack.setAttribute("role", "status"); stack.setAttribute("aria-live", "polite");
      doc.body.appendChild(stack);
    }
    var tone = o.tone || "success", el = doc.createElement("div");
    el.className = "vx-toast vx-toast--" + tone;
    el.innerHTML = '<span class="vx-toast__ico"><i data-lucide="' + (o.icon || ICON[tone] || "info") + '"></i></span>' +
      '<div class="vx-toast__body"><b></b>' + (o.sub ? "<span></span>" : "") + "</div>" +
      (o.action ? '<button class="vx-btn vx-btn--sm vx-btn--light"></button>' : "") +
      '<button class="vx-toast__x" aria-label="Dismiss"><i data-lucide="x"></i></button><i class="vx-toast__bar"></i>';
    el.querySelector("b").textContent = msg;
    if (o.sub) el.querySelector(".vx-toast__body span").textContent = o.sub;
    var olds = Array.prototype.slice.call(stack.children);
    flip(olds, function () { stack.insertBefore(el, stack.firstChild); });
    if (global.lucide && global.lucide.createIcons) global.lucide.createIcons();
    if (on()) anim(el, [{ opacity: 0, translate: "0 16px", scale: "0.96" }, { opacity: 1, translate: "0 0", scale: "1" }], { duration: T.enter, easing: T.spring });
    var gone = false;
    function dismiss() {
      if (gone) return; gone = true;
      var rest = Array.prototype.slice.call(stack.children).filter(function (n) { return n !== el; });
      var drop = function () { flip(rest, function () { el.remove(); }); };
      var a = on() ? anim(el, [{ opacity: 0, translate: "0 8px", scale: "0.97" }], { duration: T.enter * 0.45, easing: T.in, fill: "forwards" }) : null;
      if (a) a.finished.then(drop, drop); else drop();
    }
    // the countdown *is* the progress bar animation → hover/focus pauses both
    var bar = el.querySelector(".vx-toast__bar");
    if (!on()) bar.style.opacity = "0";
    var timer = CAN ? bar.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: o.duration || 4200, easing: "linear", fill: "forwards" }) : null;
    if (timer) {
      timer.onfinish = dismiss;
      el.addEventListener("pointerenter", function () { timer.pause(); });
      el.addEventListener("pointerleave", function () { if (!gone) timer.play(); });
      el.addEventListener("focusin", function () { timer.pause(); });
      el.addEventListener("focusout", function () { if (!gone) timer.play(); });
    } else setTimeout(dismiss, o.duration || 4200);
    el.querySelector(".vx-toast__x").addEventListener("click", dismiss);
    if (o.action) {
      var ab = el.querySelector(".vx-btn");
      ab.textContent = o.action.label || "Undo";
      ab.addEventListener("click", function () { if (o.action.onClick) o.action.onClick(); dismiss(); });
    }
    var all = stack.children;
    if (all.length > 4) { var oldest = all[all.length - 1]; if (oldest.__vxDismiss) oldest.__vxDismiss(); else oldest.remove(); }
    el.__vxDismiss = dismiss;
    return { el: el, dismiss: dismiss };
  }
  /* loading(button, ms) → spinner until the promise/timeout settles */
  function loading(btn, wait) {
    btn.classList.add("is-loading"); btn.setAttribute("aria-busy", "true");
    var p = typeof wait === "number" || wait === undefined ? new Promise(function (r) { setTimeout(r, wait || 900); }) : Promise.resolve(wait);
    var end = function () { btn.classList.remove("is-loading"); btn.removeAttribute("aria-busy"); };
    return p.then(function (v) { end(); return v; }, function (e) { end(); throw e; });
  }

  /* ---- pointer: glow + tilt ------------------------------------------------- */
  var tilted = null;
  function untilt(t) { t.classList.remove("is-tilting"); t.style.transform = ""; }
  doc.addEventListener("pointermove", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    var tg = e.target && e.target.closest ? e.target : null;
    if (!tg) return;
    var g = tg.closest(".vx-glow");
    if (g) {
      var r = g.getBoundingClientRect();
      g.style.setProperty("--mx", (e.clientX - r.left).toFixed(0) + "px");
      g.style.setProperty("--my", (e.clientY - r.top).toFixed(0) + "px");
    }
    var t = level() === "off" || level() === "subtle" ? null : tg.closest(".vx-tilt");
    if (t !== tilted) { if (tilted) untilt(tilted); tilted = t; }
    if (t) {
      var b = t.getBoundingClientRect(), max = +t.getAttribute("data-vx-tilt") || 5;
      var px = (e.clientX - b.left) / b.width - 0.5, py = (e.clientY - b.top) / b.height - 0.5;
      t.classList.add("is-tilting");
      t.style.transform = "perspective(900px) rotateX(" + (-py * max).toFixed(2) + "deg) rotateY(" + (px * max).toFixed(2) + "deg)";
    }
  }, { passive: true });
  doc.addEventListener("pointerleave", function () { if (tilted) { untilt(tilted); tilted = null; } });
  doc.addEventListener("mouseout", function (e) { if (!e.relatedTarget && tilted) { untilt(tilted); tilted = null; } });

  /* ---- declarative hooks ------------------------------------------------------ */
  doc.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-vx-toast], [data-vx-loading]");
    if (!b || b.classList.contains("is-loading")) return;
    var fire = function () {
      if (b.hasAttribute("data-vx-toast")) toast(b.getAttribute("data-vx-toast"), { tone: b.getAttribute("data-vx-toast-tone") || "success", sub: b.getAttribute("data-vx-toast-sub") || "" });
    };
    if (b.hasAttribute("data-vx-loading")) loading(b, +b.getAttribute("data-vx-loading") || 900).then(fire); else fire();
  });
  doc.addEventListener("vx:change", function (e) {
    var g = e.target, sel = g.getAttribute && g.getAttribute("data-vx-swap");
    if (!sel) return;
    var card = g.closest(".vx-card");
    swap((card && card.querySelector(sel)) || doc.querySelector(sel));
  });

  /* ---- lifecycle -------------------------------------------------------------- */
  function init(scope) {
    if (!T.enter) readTokens();
    q(GLIDE, scope).forEach(glide);
  }
  function replay() {
    readTokens();
    q(".vx-pre").forEach(function (el) { el.classList.remove("vx-pre"); });
    if (on()) entrance();
    if (global.VistaCharts) q("[data-vx-chart]").forEach(global.VistaCharts.replay);
  }
  /* finish(): jump every pending/ongoing motion to its end state (screenshots, print, tests) */
  function finish() {
    if (revealIO) q(".vx-pre").forEach(function (el) { reveal(el, 0); });
    if (global.VistaCharts && global.VistaCharts.flush) global.VistaCharts.flush();
    if (doc.getAnimations) doc.getAnimations().forEach(function (a) {
      try { var t = a.effect && a.effect.getComputedTiming(); if (t && t.endTime !== Infinity && a.playState !== "finished") a.finish(); } catch (e) { /* ignore */ }
    });
    root.classList.remove("vx-boot");
  }
  function start() {
    readTokens();
    init(doc);
    if (on()) entrance();
    root.classList.remove("vx-boot");
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start); else start();
  global.addEventListener("beforeprint", finish);
  // arriving through a cross-document View Transition: the transition already animates the panel
  global.addEventListener("pagereveal", function (e) { if (e.viewTransition) finish(); });

  global.VistaMotion = {
    init: init, replay: replay, reveal: reveal, countUp: countUp, countTo: countTo, flash: flash,
    swap: swap, insert: insert, remove: remove, enter: enter, toast: toast, loading: loading,
    finish: finish, level: level, tokens: function () { if (!T.enter) readTokens(); return T; }
  };
})(window);
