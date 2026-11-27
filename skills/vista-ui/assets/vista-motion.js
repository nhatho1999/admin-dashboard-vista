/* ==========================================================================
   VISTA MOTION — choreography & micro-interactions for Vista UI. No dependencies.
   Load it in <head>, right after vista.css (NOT deferred) so the entrance starts without a flash:
       <link rel="stylesheet" href="vista.css"><script src="vista-motion.js"></script>

   Automatic (nothing to write):
     · page entrance  chrome fades in → panel settles → page head → cards rise in reading order
     · scroll reveal  cards below the fold rise when they enter the viewport (batched + staggered)
     · count-up       .vx-stat__value and [data-vx-count] count from 0 when their card lands
     · progress       .vx-progress bars fill when their card lands
     · glider         .vx-seg / .vx-tabs / sidebar + topnav .vx-nav / dock / rail / command list get
                      one sliding active pill
   Opt-in classes / attributes:
     .vx-glow                    cursor spotlight + lit border on glass cards
     .vx-tilt [data-vx-tilt=5]   subtle 3D tilt toward the cursor (max degrees)
     .vx-magnetic                button leans a few px toward the cursor
     .vx-ripple                  ink ripple from the press point
     [data-vx-reveal]            scroll-reveal for anything that is not a card
     [data-vx-count="off"]       opt a number out of count-up
     [data-vx-odometer]          digits roll like a counter (count-up + countTo), compositor-only
     [data-vx-swap="selector"]   on a data-vx-group: crossfade / replay the target when the choice changes;
                                 with [data-vx-patch='{"series":…}'] on the options the chart morphs to that data
     [data-vx-toast="Text"]      on a button: show a toast on click (+ data-vx-toast-tone, data-vx-toast-sub)
     [data-vx-loading="900"]     on a button: spinner for N ms first (then the toast, if any)
     [data-vx-open="#id"]        open a <dialog class="vx-modal | vx-drawer | vx-sheet | vx-cmdk">
     [data-vx-close]             inside a dialog: close it (backdrop click and Esc close too)
     dialog[data-vx-cmdk]        command palette: ⌘K / Ctrl+K opens it, type to filter, ↑↓ Enter
     [data-vx-sortable="group"]  children can be dragged within / across lists of the same group
                                 (FLIP re-layout; Alt+Arrow keys move a focused item; [data-vx-handle]
                                 limits the grab area and enables touch; fires `vx:sort`)
   Walkthroughs (explain a process, see references/walkthroughs.md):
     [data-vx-sequence]          plays its [data-vx-step] children one by one: .vx-step run-trace rows,
                                 .vx-seq__msg handshake arrows, story cards, .vx-stepper stages, .vx-screens,
                                 spotlights — with play / pause / step / speed / reset controls
     .vx-seq                     sequence diagram (lanes, lifelines, arrows from data-from → data-to)
     .vx-stepper                 numbered stages with a growing track (VistaMotion.stepTo)
     .vx-screens > .vx-screen    one visible screen; switch with VistaMotion.screen or data-vx-screen
   Levels: <html data-vx-motion="subtle | standard (default) | expressive | off">.
   Glass:  <html data-vx-glass="auto (default) | full | lite"> — auto drops live blur on slow devices.
   prefers-reduced-motion always wins → final states, no movement.
   Performance rules this file follows: glass surfaces (backdrop-filter) only fade, never move;
   every pointer handler is coalesced to one write per frame; layout is read in one batch before
   anything is written; number tweens share one rAF loop and only touch the DOM when the text changes.
   JS API: VistaMotion.{init, replay, reveal, countUp, countTo, odometer, flash, swap, insert, remove,
           enter, toast, loading, open, close, sortable, icons, sequence, stepTo, screen, spotlight,
           finish, level, tokens, glass}
   ========================================================================== */
(function (global) {
  "use strict";
  var doc = document, root = doc.documentElement;
  var mq = global.matchMedia ? global.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var CAN = typeof Element !== "undefined" && !!Element.prototype.animate;
  var raf = global.requestAnimationFrame ? global.requestAnimationFrame.bind(global)
    : function (f) { return setTimeout(function () { f(Date.now()); }, 16); };

  function level() {
    if (mq.matches || !CAN) return "off";
    var v = root.getAttribute("data-vx-motion");
    return v === "off" || v === "subtle" || v === "expressive" ? v : "standard";
  }
  function on() { return level() !== "off"; }

  /* ---- boot: hide the shell for the first frame (CSS has a 1.6s failsafe) ---- */
  if (on()) { root.classList.add("vx-motion"); if (doc.readyState === "loading") root.classList.add("vx-boot"); }

  /* ---- adaptive glass: drop live blur on devices that can't afford it ------------------
     <html data-vx-glass="auto (default) | full | lite">. In auto mode the first ~0.9s of the
     entrance (the busiest moment) is sampled; a median frame slower than ~30fps switches the page
     to lite glass and remembers it for the session so later pages start lite. Automation
     (navigator.webdriver) is never switched, so screenshots always show the full design. */
  var GLASS_KEY = "vx-glass";
  function glassAuto() { var g = root.getAttribute("data-vx-glass"); return !g || g === "auto"; }
  function liteGlass(why) {
    root.setAttribute("data-vx-glass", "lite");
    try { global.sessionStorage.setItem(GLASS_KEY, "lite"); } catch (e) { /* private mode */ }
    if (why && global.console) console.info("[vista-motion] lite glass:", why);
  }
  if (glassAuto() && !navigator.webdriver) {
    var rt = global.matchMedia && global.matchMedia("(prefers-reduced-transparency: reduce)");
    var remembered = false;
    try { remembered = global.sessionStorage.getItem(GLASS_KEY) === "lite"; } catch (e) { /* ignore */ }
    if ((rt && rt.matches) || remembered) liteGlass();
  }
  function probeGlass() {
    if (!glassAuto() || navigator.webdriver || doc.visibilityState === "hidden" || !doc.querySelector(".vx-glass, .vx-chrome, .vx-panel")) return;
    var t0 = 0, last = 0, d = [];
    raf(function tick(t) {
      if (!t0) t0 = t; else d.push(t - last);
      last = t;
      if (doc.visibilityState !== "visible") return;
      if (t - t0 < 900) { raf(tick); return; }
      d.sort(function (a, b) { return a - b; });
      var med = d.length ? d[d.length >> 1] : 1000;
      if (med > 30 && glassAuto()) liteGlass("median frame " + Math.round(med) + "ms during the entrance");
    });
  }

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
     frame during the delay; nothing is left behind when it ends. o.fade → opacity only. */
  function rise(el, delay, o) {
    o = o || {};
    var from = { opacity: 0 }, to = { opacity: 1 };
    if (!o.fade) {
      from.translate = (o.x || 0) + "px " + (o.y === undefined ? 14 : o.y) + "px"; to.translate = "0px 0px";
      if (o.s && o.s !== 1) { from.scale = String(o.s); to.scale = "1"; }
    }
    return anim(el, [from, to], { duration: o.dur || T.enter, delay: delay || 0, easing: o.ease || T.out, fill: "backwards" });
  }
  /* glass surfaces: moving an element with backdrop-filter re-samples and re-blurs its backdrop on
     every frame — the most expensive thing a browser can do here. They fade; their content moves. */
  function glassy(el) {
    var cs = getComputedStyle(el), v = cs.backdropFilter || cs.webkitBackdropFilter;
    return !!v && v !== "none";
  }
  function surface(el, delay, o) {
    if (glassy(el)) return rise(el, delay, { fade: true, dur: (o.dur || T.enter) * 0.7 });
    return rise(el, delay, o);
  }
  function tune() {
    var L = level();
    return L === "subtle" ? { d: 6, s: 1, st: 0.7, rows: false, nav: false, count: false }
      : L === "expressive" ? { d: 26, s: 0.965, st: 1.25, rows: true, nav: true, count: true }
      : { d: 16, s: 0.985, st: 1, rows: true, nav: true, count: true };
  }
  function q(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function shown(el) { return el.getClientRects().length > 0; }

  /* ---- icons: replace <i data-lucide> inside one subtree only (createIcons() scans the page) ---- */
  function pascal(n) { return n.replace(/(\w)(\w*)(_|-|\s*)/g, function (m, a, b) { return a.toUpperCase() + b.toLowerCase(); }); }
  function icons(scope) {
    var L = global.lucide;
    if (!L) return;
    if (!scope || scope === doc || scope === doc.body || !L.createElement || !L.icons) { if (L.createIcons) L.createIcons(); return; }
    var list = q("[data-lucide]", scope);
    if (scope.matches && scope.matches("i[data-lucide]")) list.unshift(scope);
    list.forEach(function (i) {
      if (i.tagName.toLowerCase() === "svg") return;
      var name = i.getAttribute("data-lucide"), node = L.icons[pascal(name)];
      if (!node || !i.parentNode) return;
      var attrs = {};
      for (var k in node[1]) attrs[k] = node[1][k];
      for (var a = 0; a < i.attributes.length; a++) attrs[i.attributes[a].name] = i.attributes[a].value;
      attrs["class"] = "lucide lucide-" + name + (i.getAttribute("class") ? " " + i.getAttribute("class") : "");
      i.parentNode.replaceChild(L.createElement([node[0], attrs, node[2]]), i);
    });
  }

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
    return (v < 0 && +s !== 0 ? "-" : "") + parts.join(".");
  }
  function expoOut(p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); }

  /* Text tweens. Each is driven by an (empty) Web Animation so finish()/pause() scrub it too.
     New tweens are queued and started together: all widths are read first (one layout), then
     every number is written — no read/write ping-pong across a row of KPI cards. All running
     tweens share one rAF loop and skip the DOM write when the visible text did not change. */
  var numQ = [], numRun = [], numFlushing = false, numLooping = false;
  function tweenNum(el, from, to, o) {
    var p = parseNum(el);
    if (!p || !on()) return null;
    if (el.__vxNum) { el.__vxNum.cancel(); p = parseNum(el); }
    var dur = o.duration || T.draw, delay = o.delay || 0;
    var a = anim(el, [], { duration: dur, delay: delay, fill: "none" });
    if (!a) return null;
    var j = { el: el, a: a, p: p, from: from, to: to, dur: dur, delay: delay, last: null, lockW: el.style.minWidth,
      finalText: o.finalText || p.pre + fmtNum(to, p.dec, p.group) + p.post };
    el.__vxNum = a;
    a.onfinish = function () { numDone(j); };
    a.oncancel = function () { numDone(j); };
    numQ.push(j);
    if (!numFlushing) { numFlushing = true; Promise.resolve().then(numFlush); }
    return a;
  }
  function numSet(j, v) {
    var s = j.p.pre + fmtNum(v, j.p.dec, j.p.group) + j.p.post;
    if (s !== j.last) { j.p.node.nodeValue = s; j.last = s; }
  }
  function numDone(j) {
    if (j.dead) return;
    j.dead = true;
    j.p.node.nodeValue = j.finalText; j.el.style.minWidth = j.lockW;
    if (j.el.__vxNum === j.a) j.el.__vxNum = null;
  }
  function numFlush() {
    numFlushing = false;
    var batch = numQ.filter(function (j) { return !j.dead; });
    numQ = [];
    batch.forEach(function (j) {          // 1 · read (offsetWidth ignores the entrance scale)
      var el = j.el, par = el.parentElement;
      if (getComputedStyle(el).display.indexOf("inline") >= 0 || (par && getComputedStyle(par).display.indexOf("flex") >= 0)) j.lock = el.offsetWidth;
    });
    batch.forEach(function (j) {          // 2 · write
      if (j.lock) j.el.style.minWidth = j.lock + "px";   // stop neighbours from jiggling
      numSet(j, j.from);
      numRun.push(j);
    });
    if (!numLooping && numRun.length) { numLooping = true; raf(numTick); }
  }
  function numTick() {
    var live = [];
    for (var i = 0; i < numRun.length; i++) {
      var j = numRun[i];
      if (j.dead) continue;
      var t = j.a.currentTime;
      if (t !== null && t > j.delay) numSet(j, j.from + (j.to - j.from) * expoOut(Math.min(1, (t - j.delay) / j.dur)));
      live.push(j);
    }
    numRun = live;
    if (numRun.length) raf(numTick); else numLooping = false;
  }

  /* Odometer: each digit is a 0–9 strip moved with transform (compositor only, zero text layout).
     A visually hidden copy keeps the real value for screen readers and copy/paste. */
  function odoInit(el) {
    if (el.__vxOdo) return el.__vxOdo;
    var p = parseNum(el);
    if (!p) return null;
    var st = { dec: p.dec, group: p.group, value: p.value, shape: "" };
    var sr = doc.createElement("span"), box = doc.createElement("span"), post = doc.createTextNode(p.post);
    sr.className = "vx-sr"; box.className = "vx-odo"; box.setAttribute("aria-hidden", "true");
    p.node.nodeValue = p.pre;
    var nx = p.node.nextSibling, par = p.node.parentNode;
    par.insertBefore(sr, nx); par.insertBefore(box, nx); par.insertBefore(post, nx);
    st.sr = sr; st.box = box;
    el.__vxOdo = st;
    odoDraw(st, p.value, false);
    return st;
  }
  /* animate=false only right after a rebuild that no style pass has seen yet → no transition */
  function odoDraw(st, v, animate) {
    var s = fmtNum(v, st.dec, st.group), shape = s.replace(/\d/g, "0");
    st.sr.textContent = s;
    if (shape !== st.shape) {               // digit count changed → rebuild, new columns start at 0
      var old = st.box.querySelectorAll(".vx-odo__d"), prev = [];
      for (var i = 0; i < old.length; i++) prev.push(old[i].style.getPropertyValue("--d") || "0");
      var html = "", cols = 0, digits = s.replace(/\D/g, "").length;
      for (var c = 0; c < s.length; c++) {
        var ch = s.charAt(c);
        if (/\d/.test(ch)) {
          var from = prev[prev.length - (digits - cols)] || "0";
          html += '<span class="vx-odo__d" style="--d:' + from + ";--i:" + (digits - cols - 1) + '"><span class="vx-odo__ghost">0</span>' +
            '<span class="vx-odo__strip"><i>0</i><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i></span></span>';
          cols++;
        } else html += '<span class="vx-odo__sep">' + ch + "</span>";
      }
      st.box.innerHTML = html;
      st.shape = shape;
      if (animate) void st.box.offsetWidth; // commit the start digits so the transition runs
    }
    var ds = st.box.querySelectorAll(".vx-odo__d"), k = 0;
    for (var d = 0; d < s.length; d++) if (/\d/.test(s.charAt(d))) ds[k++].style.setProperty("--d", s.charAt(d));
    st.value = v;
  }
  function odometer(el, to, o) {
    o = o || {};
    var st = odoInit(el);
    if (!st) return;
    if (st.timer) clearTimeout(st.timer);
    var from = st.value;
    st.pending = to;
    var go = function () { st.timer = 0; odoDraw(st, to, true); };
    // delayed start: wait, then let one frame paint the start digits so the strips can transition
    if (o.delay && on()) st.timer = setTimeout(function () { raf(function () { raf(function () { if (st.timer) go(); }); }); }, o.delay);
    else go();
    if (o.flash && to !== from) flash(el, to > from ? "up" : "down");
  }

  function countUp(el, o) {
    o = o || {};
    if (!el || el.getAttribute("data-vx-count") === "off") return null;
    if (el.hasAttribute("data-vx-odometer")) {
      var st = odoInit(el);
      if (!st || !st.value || el.__vxOdoCounted) return null;
      el.__vxOdoCounted = true;
      var target = st.value;
      q(".vx-odo__d", st.box).forEach(function (d) { d.style.setProperty("--d", "0"); }); // same width, all zeros
      st.value = 0;
      odometer(el, target, { delay: Math.max(16, o.delay || 0) });
      return null;
    }
    if (el.__vxNum) return null; // already counting (chart center + card)
    var p = parseNum(el);
    if (!p || !p.value) return null;
    var from = el.hasAttribute("data-vx-from") ? parseFloat(el.getAttribute("data-vx-from")) : 0;
    return tweenNum(el, from, p.value, { delay: o.delay, duration: o.duration, finalText: p.node.nodeValue });
  }
  /* countTo(el, 16702) — animate a live value change, keep its format, flash green/red */
  function countTo(el, to, o) {
    o = o || {};
    if (el.hasAttribute("data-vx-odometer")) { odometer(el, to, { flash: o.flash !== false }); return null; }
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
  var CHROME = ".vx-sidebar, .vx-topbar, .vx-topnav, .vx-spatial__top, .vx-spatial__rail, .vx-spatial__dock, .vx-toasts, dialog";
  var COUNT = ".vx-stat__value, [data-vx-count]:not([data-vx-count=off])";
  var revealIO = null;

  /* everything that happens when one block lands: rise, numbers, bars, rows */
  function land(el, delay, k) {
    el.classList.remove("vx-pre");
    el.__vxAt = performance.now() + delay; // vista-charts syncs its draw-in to this
    rise(el, delay, { y: k.d, s: k.s, ease: level() === "expressive" ? T.spring : T.out });
    if (k.count) q(COUNT, el).concat(el.matches(COUNT) ? [el] : []).forEach(function (n) {
      if (!n.closest(".vx-chart")) countUp(n, { delay: delay + 80 });
    });
    q(".vx-progress > i", el).forEach(function (b, i) {
      anim(b, [{ clipPath: "inset(0 100% 0 0 round 999px)" }, { clipPath: "inset(0 0% 0 0 round 999px)" }],
        { duration: T.draw, delay: delay + 160 + i * 60, easing: T.out, fill: "backwards" });
    });
    if (k.rows) q(".vx-table tbody tr, .vx-list > .vx-list__item, .vx-chat > *, .vx-board__list > *", el).slice(0, 8).forEach(function (r, i) {
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
    // 1 · chrome — glass bars fade, their content slides
    q(".vx-shell--notch").forEach(function (el) { rise(el, 0, { y: 0, s: 0.99 }); });
    q(".vx-sidebar").forEach(function (el) { surface(el, 0, { x: -k.d, y: 0 }); });
    q(".vx-topbar, .vx-topnav").forEach(function (el) { surface(el, 40, { y: -10 }); });
    q(".vx-spatial__top").forEach(function (el) { surface(el, 0, { y: -12 }); });
    q(".vx-spatial__rail").forEach(function (el) { surface(el, 80, { x: -k.d, y: 0 }); });
    q(".vx-spatial__dock").forEach(function (el) { surface(el, 140, { y: k.d }); });
    q(".vx-auth__side > *").forEach(function (el, i) { rise(el, 120 + i * 70 * k.st, { y: 12 }); });
    if (k.nav) q(".vx-nav").forEach(function (nav) {
      var horiz = !!nav.closest(".vx-topnav");
      q(":scope > :not(.vx-glider)", nav).forEach(function (it, i) {
        var o = horiz ? { x: 0, y: -6, dur: T.enter * 0.8 } : { x: -8, y: 0, dur: T.enter * 0.8 }, d = 110 + Math.min(i, 16) * 22;
        rise(it, d, o);
        if (it.classList.contains("is-active") && nav.__vxGlider) rise(nav.__vxGlider, d, o);
      });
    });
    q(".vx-plan .vx-progress > i").forEach(function (b) {
      anim(b, [{ clipPath: "inset(0 100% 0 0 round 999px)" }, { clipPath: "inset(0 0% 0 0 round 999px)" }], { duration: T.draw, delay: 420, easing: T.out, fill: "backwards" });
    });
    // 2 · panel (glass → fade only; solid panels may settle)
    q(".vx-panel").forEach(function (el) { surface(el, 60, { y: k.d + 6, s: k.s, dur: T.enter * 1.15 }); });
    // 3 · page head (eyebrow → title → summary → actions)
    q(".vx-page-head__text > *, .vx-page-head__actions").forEach(function (el, i) {
      var big = level() === "expressive" && el.classList.contains("vx-h1");
      rise(el, 150 + i * 55 * k.st, { y: big ? 18 : 10, s: big ? 0.97 : 1, ease: big ? T.spring : T.out });
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
  var GLIDE = ".vx-seg, .vx-tabs, .vx-spatial__dock, .vx-spatial__rail, .vx-shell--sidebar .vx-nav, .vx-topnav .vx-nav, .vx-cmdk__list";
  function glide(c) {
    if (c.__vxGlider) return;
    var g = doc.createElement("span");
    g.className = "vx-glider is-still"; g.setAttribute("aria-hidden", "true");
    if (getComputedStyle(c).position === "static") c.style.position = "relative";
    c.classList.add("vx-glide"); c.appendChild(g); c.__vxGlider = g; // last child: keeps :first-child / :nth-child selectors intact
    var tabs = c.classList.contains("vx-tabs"), queued = false;
    function place() {
      queued = false;
      var a = c.querySelector(":scope > .is-active");
      if (!a || !a.offsetWidth) { g.style.opacity = "0"; return; }
      var y = tabs ? a.offsetTop + a.offsetHeight - 2 : a.offsetTop;
      g.style.opacity = "1";
      g.style.width = a.offsetWidth + "px";
      g.style.height = (tabs ? 2 : a.offsetHeight) + "px";
      g.style.transform = "translate(" + a.offsetLeft + "px," + y + "px)";
    }
    function schedule() { if (!queued) { queued = true; raf(place); } } // one layout read per frame, after the DOM settles
    function still() { g.classList.add("is-still"); place(); raf(function () { raf(function () { g.classList.remove("is-still"); }); }); }
    still();
    if (global.MutationObserver) new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) if (recs[i].target !== g) { schedule(); return; }
    }).observe(c, { attributes: true, attributeFilter: ["class", "hidden"], childList: true, subtree: true });
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
    var last = nodes.map(function (n) { return n.isConnected ? n.getBoundingClientRect() : null; }); // all reads, then all writes
    nodes.forEach(function (n, i) {
      if (!last[i]) return;
      var dx = first[i].left - last[i].left, dy = first[i].top - last[i].top;
      if (dx || dy) anim(n, [{ translate: dx + "px " + dy + "px" }, { translate: "0 0" }], { duration: T.glide, easing: T.spring, composite: "add" });
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
    icons(node);
    if (global.VistaCharts) global.VistaCharts.renderAll(node);
    return enter(node);
  }
  function remove(el) {
    var parent = el.parentElement, sibs = parent ? Array.prototype.slice.call(parent.children).filter(function (n) { return n !== el; }) : [];
    var a = on() ? anim(el, [{ opacity: 0, translate: "0 -4px", scale: "0.98" }], { duration: T.enter * 0.45, easing: T.in, fill: "forwards" }) : null;
    var go = function () { flip(sibs, function () { el.remove(); }); if (a) a.cancel(); }; // cancel: re-inserting (undo) shows it again
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
    el.innerHTML = '<span class="vx-toast__ico"><i></i></span>' +
      '<div class="vx-toast__body"><b></b>' + (o.sub ? "<span></span>" : "") + "</div>" +
      (o.action ? '<button class="vx-btn vx-btn--sm vx-btn--light"></button>' : "") +
      '<button class="vx-toast__x" aria-label="Dismiss"><i data-lucide="x"></i></button><i class="vx-toast__bar"></i>';
    el.querySelector(".vx-toast__ico > i").setAttribute("data-lucide", o.icon || ICON[tone] || "info");
    el.querySelector("b").textContent = msg;
    if (o.sub) el.querySelector(".vx-toast__body span").textContent = o.sub;
    var olds = Array.prototype.slice.call(stack.children);
    flip(olds, function () { stack.insertBefore(el, stack.firstChild); });
    icons(el);
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

  /* ---- dialogs: modal · drawer · sheet · command palette ---------------------- */
  function dlgFrames(d) {
    var c = d.classList;
    if (c.contains("vx-drawer")) return [{ translate: (c.contains("vx-drawer--left") ? "-" : "") + "104% 0" }, { translate: "0 0" }];
    if (c.contains("vx-sheet")) return [{ translate: "0 104%" }, { translate: "0 0" }];
    return [{ opacity: 0, translate: "0 14px", scale: "0.96" }, { opacity: 1, translate: "0 0", scale: "1" }];
  }
  function backdrop(d, inn) {
    return anim(d, inn ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
      { duration: inn ? T.enter * 0.6 : T.fast * 1.4, easing: inn ? T.out : T.in, fill: inn ? "none" : "forwards", pseudoElement: "::backdrop" });
  }
  function dlg(d) { return typeof d === "string" ? doc.querySelector(d) : d; }
  function open(d) {
    d = dlg(d);
    if (!d || d.open) return d;
    if (d.__vxClose) { d.__vxClose.cancel(); d.__vxClose = null; }
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
    icons(d);
    if (d.hasAttribute("data-vx-cmdk")) cmdkReset(d);
    if (on()) {
      var f = dlgFrames(d), panel = d.classList.contains("vx-modal") || d.classList.contains("vx-cmdk");
      anim(d, f, { duration: T.enter * (panel ? 1 : 1.1), easing: panel ? T.spring : T.out });
      backdrop(d, true);
    }
    d.dispatchEvent(new CustomEvent("vx:open", { bubbles: true }));
    return d;
  }
  function close(d, value) {
    d = dlg(d);
    if (!d || !d.open || d.__vxClose) return;
    var fin = function () { d.__vxClose = null; d.close(value); if (a) a.cancel(); if (b) b.cancel(); };
    var a = null, b = null;
    if (on()) {
      var f = dlgFrames(d);
      a = anim(d, [f[1], f[0]], { duration: T.enter * 0.45, easing: T.in, fill: "forwards" });
      b = backdrop(d, false);
    }
    if (!a) return fin();
    d.__vxClose = a;
    a.finished.then(fin, function () { /* reopened while closing */ });
  }
  doc.addEventListener("cancel", function (e) {      // Esc → animated close
    var d = e.target;
    if (d.tagName === "DIALOG" && d.matches(".vx-modal, .vx-drawer, .vx-sheet, .vx-cmdk") && e.cancelable && on()) { e.preventDefault(); close(d); }
  }, true);
  doc.addEventListener("submit", function (e) {      // <form method="dialog"> → animated close
    var f = e.target, d = f.closest && f.closest("dialog");
    if (!d || (f.getAttribute("method") || "").toLowerCase() !== "dialog" || !on()) return;
    e.preventDefault(); close(d, e.submitter && e.submitter.value);
  }, true);

  /* command palette */
  function cmdkItems(d) { return q(".vx-cmdk__item", d); }
  function cmdkActive(d, item) {
    cmdkItems(d).forEach(function (n) { n.classList.toggle("is-active", n === item); n.setAttribute("aria-selected", n === item); });
    if (item && item.scrollIntoView) item.scrollIntoView({ block: "nearest" });
  }
  function cmdkFilter(d) {
    var inp = d.querySelector("input"), words = (inp ? inp.value : "").toLowerCase().split(/\s+/).filter(Boolean), first = null;
    cmdkItems(d).forEach(function (n) {
      var hay = (n.textContent + " " + (n.getAttribute("data-keywords") || "")).toLowerCase();
      var ok = words.every(function (w) { return hay.indexOf(w) >= 0; });
      n.hidden = !ok;
      if (ok && !first) first = n;
    });
    q(".vx-cmdk__group", d).forEach(function (g) {     // hide a group label with no visible items under it
      var n = g.nextElementSibling, any = false;
      while (n && !n.classList.contains("vx-cmdk__group")) { if (n.classList.contains("vx-cmdk__item") && !n.hidden) { any = true; break; } n = n.nextElementSibling; }
      g.hidden = !any;
    });
    var empty = d.querySelector(".vx-cmdk__empty");
    if (empty) empty.hidden = !!first;
    cmdkActive(d, first);
  }
  function cmdkReset(d) {
    var inp = d.querySelector("input");
    if (inp) { inp.value = ""; setTimeout(function () { inp.focus(); }, 0); }
    cmdkFilter(d);
  }
  doc.addEventListener("input", function (e) { var d = e.target.closest && e.target.closest("dialog[data-vx-cmdk]"); if (d) cmdkFilter(d); });
  doc.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === "k" || e.key === "K")) {
      var c = doc.querySelector("dialog[data-vx-cmdk]");
      if (c) { e.preventDefault(); if (c.open) close(c); else open(c); return; }
    }
    var d = e.target.closest && e.target.closest("dialog[data-vx-cmdk]");
    if (d && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
      var vis = cmdkItems(d).filter(function (n) { return !n.hidden; }), cur = vis.indexOf(d.querySelector(".vx-cmdk__item.is-active"));
      if (e.key === "Enter") { if (vis[cur]) { e.preventDefault(); vis[cur].click(); } return; }
      e.preventDefault();
      if (vis.length) cmdkActive(d, vis[(cur + (e.key === "ArrowDown" ? 1 : -1) + vis.length) % vis.length]);
      return;
    }
    sortKey(e);
    if (e.key === "Escape" && drag && drag.started) { e.preventDefault(); dragCancel(); }
  });
  doc.addEventListener("pointerover", function (e) {
    var it = e.target.closest && e.target.closest(".vx-cmdk__item");
    if (it && !it.classList.contains("is-active")) cmdkActive(it.closest("dialog"), it);
  }, { passive: true });

  /* ---- sortable lists (kanban, priorities, playlists) ------------------------- */
  var drag = null, eatClick = false;
  function sortItems(list) {
    return Array.prototype.filter.call(list.children, function (n) {
      return !n.classList.contains("vx-glider") && !n.classList.contains("vx-drop-slot") && !n.hasAttribute("data-vx-fixed");
    });
  }
  function lists(group) { return q('[data-vx-sortable="' + group + '"]'); }
  function itemOf(target) {
    for (var n = target; n && n !== doc.body; n = n.parentElement) {
      var p = n.parentElement;
      if (p && p.hasAttribute && p.hasAttribute("data-vx-sortable")) return n;
    }
    return null;
  }
  function tailRef(list) {                        // insert before trailing fixed items (e.g. "+ Add card")
    var kids = list.children, ref = null;
    for (var i = kids.length - 1; i >= 0; i--) { if (kids[i].hasAttribute("data-vx-fixed") || kids[i].classList.contains("vx-glider")) ref = kids[i]; else break; }
    return ref;
  }
  function sortEvent(item, from, to) {
    to.dispatchEvent(new CustomEvent("vx:sort", { bubbles: true, detail: { item: item, from: from, to: to, index: sortItems(to).indexOf(item) } }));
  }
  function moveItem(item, list, ref) {            // keyboard / programmatic move with FLIP
    var from = item.parentElement, nodes = sortItems(from).concat(from === list ? [] : sortItems(list));
    flip(nodes, function () { list.insertBefore(item, ref === undefined ? tailRef(list) : ref); });
    item.focus({ preventScroll: true });
    sortEvent(item, from, list);
  }
  function sortKey(e) {
    if (!e.altKey || ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) < 0) return;
    var item = e.target, list = item.parentElement;
    if (!list || !list.hasAttribute || !list.hasAttribute("data-vx-sortable") || item.hasAttribute("data-vx-fixed")) return;
    e.preventDefault();
    var its = sortItems(list), i = its.indexOf(item);
    if (e.key === "ArrowUp" && i > 0) moveItem(item, list, its[i - 1]);
    else if (e.key === "ArrowDown" && i < its.length - 1) moveItem(item, list, its[i + 1].nextSibling);
    else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      var all = lists(list.getAttribute("data-vx-sortable")), j = all.indexOf(list) + (e.key === "ArrowRight" ? 1 : -1);
      if (all[j]) { var t = sortItems(all[j]); moveItem(item, all[j], t[Math.min(i, t.length)] || undefined); }
    }
  }
  doc.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 || drag) return;
    var item = e.target.closest ? itemOf(e.target) : null;
    if (!item || item.hasAttribute("data-vx-fixed") || item.classList.contains("vx-glider")) return;
    var handle = item.querySelector("[data-vx-handle]");
    if (handle ? !e.target.closest("[data-vx-handle]") : (e.pointerType === "touch" || e.target.closest("button, a, input, textarea, select, label, [data-vx-nodrag]"))) return;
    drag = { item: item, list: item.parentElement, next: item.nextSibling, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, started: false };
  });
  function dragStart() {
    var it = drag.item, r = it.getBoundingClientRect();
    var slot = doc.createElement(it.tagName === "LI" ? "li" : "div");
    slot.className = "vx-drop-slot"; slot.style.height = r.height + "px";
    it.parentElement.insertBefore(slot, it);
    drag.slot = slot; drag.started = true; drag.r = r;
    doc.body.appendChild(it);                     // lift out of the column (no clipping, no containment)
    it.classList.add("vx-dragging");
    it.style.cssText += ";position:fixed;left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px;margin:0;z-index:90;pointer-events:none";
    drag.lift = anim(it, [{ scale: "1", rotate: "0deg" }, { scale: "1.03", rotate: "1.2deg" }], { duration: T.glide, easing: T.spring, fill: "forwards" });
    root.classList.add("vx-is-dragging");
  }
  function dragFrame() {
    var d = drag;
    if (!d) return;
    if (!d.started) { if (Math.abs(d.x - d.x0) + Math.abs(d.y - d.y0) < 5) return; dragStart(); }
    d.item.style.translate = (d.x - d.x0) + "px " + (d.y - d.y0) + "px";
    var under = doc.elementFromPoint(d.x, d.y), group = d.list.getAttribute("data-vx-sortable");
    var list = under && under.closest && under.closest('[data-vx-sortable="' + group + '"]');
    if (!list) return;
    var its = sortItems(list), ref = null;
    for (var i = 0; i < its.length; i++) { var b = its[i].getBoundingClientRect(); if (d.y < b.top + b.height / 2) { ref = its[i]; break; } }
    if (!ref) ref = tailRef(list);
    if (d.slot.parentElement === list && (d.slot.nextSibling === ref || d.slot === ref)) return;
    var nodes = sortItems(d.slot.parentElement).concat(list === d.slot.parentElement ? [] : its);
    flip(nodes, function () { list.insertBefore(d.slot, ref); });
  }
  function dragEnd() {
    var d = drag;
    drag = null;
    if (!d || !d.started) return;
    var it = d.item, before = it.getBoundingClientRect(), list = d.slot.parentElement;
    list.insertBefore(it, d.slot); d.slot.remove();
    if (d.lift) d.lift.cancel();
    it.classList.remove("vx-dragging"); root.classList.remove("vx-is-dragging");
    ["position", "left", "top", "width", "height", "margin", "z-index", "pointer-events", "translate"].forEach(function (p) { it.style.removeProperty(p); });
    var after = it.getBoundingClientRect();
    anim(it, [{ translate: (before.left - after.left) + "px " + (before.top - after.top) + "px", scale: "1.03", rotate: "1.2deg" },
      { translate: "0 0", scale: "1", rotate: "0deg" }], { duration: T.glide, easing: T.spring });
    eatClick = true; setTimeout(function () { eatClick = false; }, 0);
    if (list !== d.list || it.nextSibling !== d.next) sortEvent(it, d.list, list);
  }
  function dragCancel() {
    if (!drag || !drag.started) return;
    drag.list.insertBefore(drag.slot, drag.next && drag.next.parentElement === drag.list ? drag.next : tailRef(drag.list));
    dragEnd();
  }
  doc.addEventListener("pointerup", function () { if (drag) dragEnd(); });
  doc.addEventListener("pointercancel", function () { if (drag) dragCancel(); });
  doc.addEventListener("click", function (e) { if (eatClick) { e.stopPropagation(); e.preventDefault(); eatClick = false; } }, true);
  function sortable(list, group) { list.setAttribute("data-vx-sortable", group || list.getAttribute("data-vx-sortable") || "default"); return list; }

  /* ---- sequences: play a process step by step (run traces, handshakes, tours, stories) ----
     <section data-vx-sequence> … any number of [data-vx-step] in DOM order … </section>
     Step attributes: data-ms (duration, default 600; ±15% jitter unless data-vx-jitter="0" on the root),
     data-vx-result="fail|skip" (end state), data-vx-continue (keep going after a fail), data-vx-label,
     data-vx-spot="#el" + data-vx-coach="text" (spotlight before it runs), data-vx-screen="#screen"
     (show that screen), data-vx-stage="2" (move the root's .vx-stepper). Steps inside one
     [data-vx-parallel] wrapper run together and the sequence continues when all of them finish.
     Controls anywhere inside the root: [data-vx-run="play|pause|step|reset"], a data-vx-group with
     [data-vx-run-speed] whose options carry data-speed, and [data-vx-run-status] for the live label.
     Root options: data-vx-autoplay (start once when 40% visible), data-vx-done="Deployed" (final label),
     data-vx-unit="messages" (word in the status; automatic for pure sequence diagrams). Reset rewinds
     steps, the stepper and every .vx-screens inside the root.
     Time runs on Web Animations, so pause / speed / finish() are exact; nothing auto-plays by default. */
  var SEQS = [];
  function stepLabel(s) {
    var n = s.querySelector(".vx-step__name, .vx-seq__label b, b, h3, h4");
    return (s.getAttribute("data-vx-label") || (n ? n.textContent : s.textContent)).replace(/\s+/g, " ").trim().slice(0, 48);
  }
  function stepMeta(s, text, busy) {
    var m = s.querySelector(":scope > .vx-step__meta");
    if (!m) return;
    m.textContent = text;
    if (busy) { var d = doc.createElement("span"); d.className = "vx-dots"; d.setAttribute("aria-hidden", "true"); d.innerHTML = "<i></i><i></i><i></i>"; m.insertBefore(d, m.firstChild); }
  }
  function stepState(s, st) {
    s.classList.remove("is-pending", "is-active", "is-done", "is-fail", "is-skip");
    s.classList.add("is-" + st);
    s.setAttribute("data-state", st);
    var sum = s.querySelector("summary");
    if (sum) sum.tabIndex = st === "done" || st === "fail" ? 0 : -1;
  }
  /* keep the running step visible inside its own scroll box — never scroll the page for it */
  function keepVisible(s) {
    for (var b = s.parentElement; b && b !== doc.body; b = b.parentElement) {
      var oy = getComputedStyle(b).overflowY;
      if (oy === "auto" || oy === "scroll") {
        var top = s.offsetTop - b.offsetTop, bottom = top + s.offsetHeight + 12;
        if (bottom > b.scrollTop + b.clientHeight) b.scrollTop = bottom - b.clientHeight;
        else if (top < b.scrollTop) b.scrollTop = Math.max(0, top - 12);
        return;
      }
    }
  }
  function sequence(root) {
    if (!root) return null;
    if (root.__vxSeq) return root.__vxSeq;
    var steps = q("[data-vx-step]", root), units = [], st = "ready", rate = 1, cur = -1, live = [], total = 0, failed = false;
    steps.forEach(function (s) {                       // group parallel steps into one unit
      var par = s.closest("[data-vx-parallel]"), last = units[units.length - 1];
      if (par && root.contains(par) && last && last.par === par) last.steps.push(s);
      else units.push({ par: par && root.contains(par) ? par : null, steps: [s] });
    });
    var status = root.querySelector("[data-vx-run-status]"), idle = status ? status.textContent : "";
    var stepper = root.querySelector(".vx-stepper"), jitter = root.getAttribute("data-vx-jitter") !== "0";
    var unit = root.getAttribute("data-vx-unit") || (steps.length && steps.every(function (s) { return s.classList.contains("vx-seq__msg"); }) ? "messages" : "steps");
    function say(t) { if (status) status.textContent = t; }
    function fire(name, detail) { root.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail })); }
    function controls() {
      q("[data-vx-run]", root).forEach(function (b) {
        var a = b.getAttribute("data-vx-run"), off =
          a === "play" ? st === "running" : a === "pause" ? st !== "running" :
          a === "step" ? st === "running" || st === "done" : a === "reset" ? st === "ready" || st === "running" : false;
        b.disabled = off;
        if (a === "play") { var l = b.querySelector("[data-vx-run-label]"); if (l) l.textContent = st === "done" ? "Replay" : st === "paused" ? "Resume" : (l.getAttribute("data-vx-run-label") || "Run"); }
      });
      root.setAttribute("data-run", st);
    }
    function prep() {
      live.forEach(function (x) { x.t.onfinish = null; x.t.cancel(); });
      live = []; cur = -1; total = 0; failed = false;
      steps.forEach(function (s) { stepState(s, "pending"); stepMeta(s, s.getAttribute("data-vx-wait") || "Waiting"); });
      if (stepper) stepTo(stepper, 0, true);
      q(".vx-screens", root).forEach(function (b) { var first = b.querySelector(":scope > .vx-screen"); if (first) screen(first, true); });
      say(idle || "Ready · " + steps.length + " " + unit);
      st = "ready"; controls();
    }
    var fast = false;                                  // complete(): jump to the end without spotlights or motion
    function startStep(s) {
      var spot = !fast && s.getAttribute("data-vx-spot");
      if (spot) spotlight(root.querySelector(spot) || doc.querySelector(spot), { label: s.getAttribute("data-vx-coach") });
      var scr = s.getAttribute("data-vx-screen");
      if (scr) screen(root.querySelector(scr) || doc.querySelector(scr), fast);
      if (s.hasAttribute("data-vx-stage") && stepper) stepTo(stepper, +s.getAttribute("data-vx-stage"), fast);
      stepState(s, "active"); stepMeta(s, "Running", true); if (!fast) keepVisible(s);
      if (on() && !fast) {
        if (s.classList.contains("vx-seq__msg")) {
          var ar = s.querySelector(".vx-seq__arrow");
          anim(ar, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: Math.min(700, (+s.getAttribute("data-ms") || 600) * 0.7) / rate, easing: T.out });
          anim(s.querySelector(".vx-seq__label"), [{ opacity: 0, translate: "0 4px" }, { opacity: 1, translate: "0 0" }], { duration: T.enter * 0.7, easing: T.out });
        } else if (!s.classList.contains("vx-step")) rise(s, 0, { y: 8, dur: T.enter * 0.8 });
      }
      var ms = (+s.getAttribute("data-ms") || 600) * (jitter ? 0.85 + Math.random() * 0.3 : 1);
      var t = CAN ? s.animate([], { duration: ms }) : null;   // the step's clock
      var x = { s: s, t: t, ms: ms };
      if (t) { t.playbackRate = rate; t.onfinish = function () { endStep(x); }; }
      else setTimeout(function () { endStep(x); }, ms / rate);
      live.push(x);
      fire("vx:step", { index: steps.indexOf(s), el: s, state: "active" });
    }
    function endStep(x) {
      var i = live.indexOf(x);
      if (i < 0) return;
      live.splice(i, 1);
      var s = x.s, res = s.getAttribute("data-vx-result") || "done";
      stepState(s, res);
      stepMeta(s, res === "done" ? (x.ms / 1000).toFixed(1) + "s" : res === "fail" ? "Failed" : "Skipped");
      if (res === "fail" && !s.hasAttribute("data-vx-continue")) failed = true;
      fire("vx:step", { index: steps.indexOf(s), el: s, state: res });
      if (live.length) return;                         // parallel siblings still running
      total += units[cur].steps.reduce(function (m, z) { return Math.max(m, z.__vxMs || 0); }, x.ms);
      if (failed || cur + 1 >= units.length) return done();
      if (st === "running") startUnit(cur + 1);
      else if (st === "stepping") { st = "paused"; say("Paused · " + (cur + 1) + "/" + units.length); controls(); }
    }
    function startUnit(k) {
      cur = k;
      var u = units[k];
      u.steps.forEach(function (s) { s.__vxMs = 0; });
      say(stepLabel(u.steps[0]) + (u.steps.length > 1 ? " + " + (u.steps.length - 1) + " in parallel" : "") + "…");
      u.steps.forEach(startStep);
      live.forEach(function (x) { x.s.__vxMs = x.ms; });
    }
    function done() {
      st = "done";
      var ok = !failed, lbl = root.getAttribute(ok ? "data-vx-done" : "data-vx-failed") || (ok ? "Done" : "Failed");
      say(steps.length + " " + unit + " · " + (total / 1000).toFixed(1) + "s · " + lbl);
      controls();
      fire("vx:done", { ok: ok, ms: total });
    }
    var api = {
      play: function () {
        if (st === "running") return api;
        if (st === "done") prep();
        if ((st === "paused" || st === "stepping") && live.length) { st = "running"; live.forEach(function (x) { if (x.t) x.t.play(); }); say(stepLabel(live[0].s) + "…"); controls(); return api; }
        st = "running"; controls();
        startUnit(cur + 1);
        return api;
      },
      pause: function () {
        if (st !== "running") return api;
        st = "paused"; live.forEach(function (x) { if (x.t) x.t.pause(); });
        say("Paused · " + (cur + 1) + "/" + units.length); controls();
        return api;
      },
      step: function () {
        if (st === "running" || st === "done") return api;
        if (live.length) { st = "stepping"; live.slice().forEach(function (x) { if (x.t) x.t.finish(); }); return api; }
        st = "stepping"; controls(); startUnit(cur + 1);
        return api;
      },
      reset: function () { prep(); return api; },
      speed: function (x) { rate = Math.max(0.1, +x || 1); live.forEach(function (y) { if (y.t) y.t.playbackRate = rate; }); return api; },
      complete: function () {                         // jump to the end state (screenshots, finish())
        if (st === "ready") return api;
        st = "running"; fast = true;
        var guard = 0;
        while (st !== "done" && guard++ < 500) { if (!live.length) startUnit(cur + 1); live.slice().forEach(function (x) { if (x.t) x.t.onfinish = null; if (x.t) x.t.cancel(); endStep(x); }); }
        fast = false;
        return api;
      },
      state: function () { return st; }
    };
    root.__vxSeq = api;
    SEQS.push(api);
    prep();
    if (root.hasAttribute("data-vx-autoplay")) {
      if (global.IntersectionObserver) {
        var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); setTimeout(api.play, on() ? 400 : 0); } }, { threshold: 0.4 });
        io.observe(root);
      } else api.play();
    }
    return api;
  }

  /* stepper (Cart → Checkout → Payment): numbered dots on a track whose fill grows with transform */
  function stepTo(el, i, quiet) {
    var items = Array.prototype.filter.call(el.children, function (n) { return n.tagName === "LI"; }), n = items.length;
    if (!n) return;
    i = Math.max(0, Math.min(n - 1, i));
    el.style.setProperty("--n", n);
    el.style.setProperty("--vx-fill", n > 1 ? i / (n - 1) : 0);
    items.forEach(function (li, k) {
      var was = li.classList.contains("is-active");
      li.classList.toggle("is-done", k < i); li.classList.toggle("is-active", k === i);
      if (k === i) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      if (k === i && !was && !quiet && on()) anim(li, [{ scale: "0.6" }, { scale: "1" }], { duration: T.glide, easing: T.bounce, pseudoElement: "::before" });
    });
  }

  /* screens: one visible .vx-screen inside .vx-screens (product walkthroughs, wizards) */
  function screen(el, quiet) {
    if (!el || el.classList.contains("is-active")) return;
    var box = el.parentElement, all = Array.prototype.slice.call(box.children), old = box.querySelector(":scope > .vx-screen.is-active");
    var dir = old && all.indexOf(el) < all.indexOf(old) ? -1 : 1;
    if (old) {
      old.classList.remove("is-active");
      if (on() && !quiet) {
        old.classList.add("is-leaving");
        var a = anim(old, [{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: (-28 * dir) + "px 0" }], { duration: T.enter * 0.5, easing: T.in });
        var clear = function () { old.classList.remove("is-leaving"); };
        if (a) a.finished.then(clear, clear); else clear();
      }
    }
    el.classList.add("is-active");
    icons(el);
    if (on() && !quiet) anim(el, [{ opacity: 0, translate: (28 * dir) + "px 0" }, { opacity: 1, translate: "0 0" }], { duration: T.enter, delay: old ? T.enter * 0.2 : 0, easing: T.out, fill: "backwards" });
    if (global.VistaCharts) q("[data-vx-chart]", el).forEach(function (c) { if (!c.querySelector("svg")) global.VistaCharts.renderAll(c); });
    el.dispatchEvent(new CustomEvent("vx:screen", { bubbles: true }));
  }

  /* spotlight(el, {label}) — a ring (and optional coach label) settles around an element, pulses once,
     then fades. For guided tours and "this is what happens next" moments. Transform/opacity only. */
  function spotlight(el, o) {
    o = o || {};
    if (!el || !el.getBoundingClientRect) return Promise.resolve();
    var r = el.getBoundingClientRect(), pad = o.pad === undefined ? 6 : o.pad, rad = getComputedStyle(el).borderTopLeftRadius || "12px";
    var ring = doc.createElement("div"), tip = null, dur = o.duration || 1500;
    ring.className = "vx-spot"; ring.setAttribute("aria-hidden", "true");
    ring.style.cssText = "left:" + (r.left - pad) + "px;top:" + (r.top - pad) + "px;width:" + (r.width + pad * 2) + "px;height:" + (r.height + pad * 2) + "px;border-radius:calc(" + rad + " + " + pad + "px)";
    doc.body.appendChild(ring);
    if (o.label) {
      tip = doc.createElement("div"); tip.className = "vx-coach"; tip.setAttribute("role", "status"); tip.textContent = o.label;
      tip.style.left = Math.round(r.left + r.width / 2) + "px"; tip.style.top = Math.round(r.top - pad - 10) + "px";
      doc.body.appendChild(tip);
    }
    var rm = function () { ring.remove(); if (tip) tip.remove(); };
    if (!on()) return new Promise(function (res) { setTimeout(function () { rm(); res(); }, dur); });
    var a = anim(ring, [{ opacity: 0, scale: "1.18" }, { opacity: 1, scale: "1", offset: 0.22 }, { opacity: 1, scale: "1.035", offset: 0.45 },
      { opacity: 1, scale: "1", offset: 0.65 }, { opacity: 0, scale: "1" }], { duration: dur, easing: "ease-out" });
    if (tip) anim(tip, [{ opacity: 0, translate: "0 6px" }, { opacity: 1, translate: "0 0", offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: dur, easing: "ease-out" });
    return a ? a.finished.then(rm, rm) : Promise.resolve(rm());
  }

  /* sequence diagram: lanes + lifelines; each .vx-seq__msg gets its arrow span from data-from / data-to */
  function seqDiagram(el) {
    if (el.__vxSeqD) return;
    el.__vxSeqD = true;
    var lanes = el.querySelectorAll(".vx-seq__lanes > *").length || 2;
    el.style.setProperty("--lanes", lanes);
    if (!el.querySelector(":scope > .vx-seq__life")) {
      var life = doc.createElement("div"); life.className = "vx-seq__life"; life.setAttribute("aria-hidden", "true");
      for (var i = 0; i < lanes; i++) life.appendChild(doc.createElement("span"));
      el.insertBefore(life, el.firstChild);
    }
    q(".vx-seq__msg", el).forEach(function (m) {
      var f = Math.max(1, Math.min(lanes, +m.getAttribute("data-from") || 1)), t = Math.max(1, Math.min(lanes, +m.getAttribute("data-to") || 2));
      var a = Math.min(f, t), b = Math.max(f, t);
      m.style.setProperty("--a", a); m.style.setProperty("--b", b + 1); m.style.setProperty("--span", b - a + 1);
      m.classList.toggle("is-back", f > t); m.classList.toggle("is-note", f === t);
      if (!m.querySelector(":scope > .vx-seq__label")) {
        var lab = doc.createElement("div"); lab.className = "vx-seq__label";
        while (m.firstChild) lab.appendChild(m.firstChild);
        m.appendChild(lab);
      }
      if (f !== t && !m.querySelector(":scope > .vx-seq__arrow")) {
        var ar = doc.createElement("div"); ar.className = "vx-seq__arrow"; ar.setAttribute("aria-hidden", "true");
        m.appendChild(ar);
      }
      if (!m.hasAttribute("aria-label")) m.setAttribute("aria-label", (m.getAttribute("data-from-name") || "Lane " + f) + " to " + (m.getAttribute("data-to-name") || "lane " + t) + ": " + m.textContent.replace(/\s+/g, " ").trim());
    });
  }

  /* ---- pointer: glow · tilt · magnetic · drag — one rAF write per frame ---------- */
  var P = { x: 0, y: 0, tg: null, queued: false }, glowEl = null, glowR = null, tilted = null, tiltR = null, mag = null, magR = null;
  function untilt(t) { t.classList.remove("is-tilting"); t.style.transform = ""; }
  function unmag(m) { m.classList.remove("is-magnet"); m.style.translate = ""; }
  function forgetRects() { glowR = tiltR = magR = null; }
  global.addEventListener("scroll", forgetRects, { passive: true, capture: true });
  global.addEventListener("resize", forgetRects, { passive: true });
  function pointerFrame() {
    P.queued = false;
    if (drag) { dragFrame(); if (drag && drag.started) return; }
    var tg = P.tg && P.tg.closest ? P.tg : null, lv = level();
    var g = tg && tg.closest(".vx-glow"), t = tg && lv !== "off" && lv !== "subtle" ? tg.closest(".vx-tilt") : null;
    var m = tg && lv !== "off" ? tg.closest(".vx-magnetic") : null;
    if (g !== glowEl) { glowEl = g; glowR = null; }
    if (t !== tilted) { if (tilted) untilt(tilted); tilted = t; tiltR = null; }
    if (m !== mag) { if (mag) unmag(mag); mag = m; magR = null; }
    // reads (cached per element until scroll / resize)
    if (g && !glowR) glowR = g.getBoundingClientRect();
    if (t && !tiltR) tiltR = t.getBoundingClientRect();
    if (m && !magR) magR = m.getBoundingClientRect();
    // writes
    if (g) { g.style.setProperty("--mx", Math.round(P.x - glowR.left) + "px"); g.style.setProperty("--my", Math.round(P.y - glowR.top) + "px"); }
    if (t) {
      var max = +t.getAttribute("data-vx-tilt") || 5, px = (P.x - tiltR.left) / tiltR.width - 0.5, py = (P.y - tiltR.top) / tiltR.height - 0.5;
      t.classList.add("is-tilting");
      t.style.transform = "perspective(900px) rotateX(" + (-py * max).toFixed(2) + "deg) rotateY(" + (px * max).toFixed(2) + "deg)";
    }
    if (m) {
      var pull = +m.getAttribute("data-vx-magnetic") || 6;
      var mx = (P.x - magR.left) / magR.width - 0.5, my = (P.y - magR.top) / magR.height - 0.5;
      m.classList.add("is-magnet");
      m.style.translate = (mx * pull * 2).toFixed(1) + "px " + (my * pull * 2).toFixed(1) + "px";
    }
  }
  doc.addEventListener("pointermove", function (e) {
    if (!drag && e.pointerType && e.pointerType !== "mouse") return;
    P.x = e.clientX; P.y = e.clientY; P.tg = e.target;
    if (drag) { drag.x = e.clientX; drag.y = e.clientY; }
    if (!P.queued) { P.queued = true; raf(pointerFrame); }
  }, { passive: true });
  function pointerGone() { if (tilted) { untilt(tilted); tilted = null; } if (mag) { unmag(mag); mag = null; } glowEl = null; }
  doc.addEventListener("pointerleave", pointerGone);
  doc.addEventListener("mouseout", function (e) { if (!e.relatedTarget) pointerGone(); });

  /* ripple: ink grows from the press point (transform + opacity only) */
  doc.addEventListener("pointerdown", function (e) {
    var b = e.target.closest && e.target.closest(".vx-ripple");
    if (!b || !on()) return;
    var r = b.getBoundingClientRect(), s = Math.ceil(Math.hypot(r.width, r.height) * 2);
    var ink = doc.createElement("span");
    ink.className = "vx-ripple__ink"; ink.setAttribute("aria-hidden", "true");
    ink.style.cssText = "width:" + s + "px;height:" + s + "px;left:" + (e.clientX - r.left - s / 2) + "px;top:" + (e.clientY - r.top - s / 2) + "px";
    b.appendChild(ink);
    var a = anim(ink, [{ transform: "scale(0)", opacity: 0.32 }, { transform: "scale(1)", opacity: 0 }], { duration: T.enter * 1.2, easing: T.out });
    var rm = function () { ink.remove(); };
    if (a) a.finished.then(rm, rm); else rm();
  }, { passive: true });

  /* ---- declarative hooks ------------------------------------------------------ */
  doc.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    var o = t.closest("[data-vx-open]");
    if (o) { e.preventDefault(); var src = o.closest("dialog[open]"), dst = dlg(o.getAttribute("data-vx-open")); if (src && src !== dst) close(src); open(dst); return; }
    var rb = t.closest("[data-vx-run]");
    if (rb) { var sq = sequence(rb.closest("[data-vx-sequence]")), act = rb.getAttribute("data-vx-run"); if (sq && sq[act]) sq[act](); return; }
    var c = t.closest("[data-vx-close]");
    if (c) { close(c.closest("dialog")); return; }
    if (t.tagName === "DIALOG" && t.open && t.matches(".vx-modal, .vx-drawer, .vx-sheet, .vx-cmdk")) {   // backdrop click
      var r = t.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(t);
      return;
    }
    var it = t.closest(".vx-cmdk__item");
    if (it && !it.hasAttribute("data-vx-keep")) close(it.closest("dialog"));
    var b = t.closest("[data-vx-toast], [data-vx-loading]");
    if (!b || b.classList.contains("is-loading")) return;
    var fire = function () {
      if (b.hasAttribute("data-vx-toast")) toast(b.getAttribute("data-vx-toast"), { tone: b.getAttribute("data-vx-toast-tone") || "success", sub: b.getAttribute("data-vx-toast-sub") || "" });
    };
    if (b.hasAttribute("data-vx-loading")) loading(b, +b.getAttribute("data-vx-loading") || 900).then(fire); else fire();
  });
  doc.addEventListener("vx:change", function (e) {
    var g = e.target, it = e.detail && e.detail.item;
    if (g.hasAttribute && g.hasAttribute("data-vx-run-speed") && it) { var sq = sequence(g.closest("[data-vx-sequence]")); if (sq) sq.speed(it.getAttribute("data-speed")); return; }
    if (g.hasAttribute && g.hasAttribute("data-vx-screens-nav") && it && it.getAttribute("data-vx-screen")) { screen(doc.querySelector(it.getAttribute("data-vx-screen"))); return; }
    var sel = g.getAttribute && g.getAttribute("data-vx-swap");
    if (!sel) return;
    var card = g.closest(".vx-card"), target = (card && card.querySelector(sel)) || doc.querySelector(sel);
    var item = e.detail && e.detail.item, patch = item && item.getAttribute("data-vx-patch");
    if (patch && target && target.__vx && global.VistaCharts && global.VistaCharts.update) {   // new data → shapes morph
      try { global.VistaCharts.update(target, JSON.parse(patch)); return; } catch (err) { console.error("[vista-motion] bad data-vx-patch JSON", item, err); }
    }
    swap(target);
  });

  /* ---- lifecycle -------------------------------------------------------------- */
  function init(scope) {
    if (!T.enter) readTokens();
    q(GLIDE, scope).forEach(glide);
    q(".vx-seq", scope).forEach(seqDiagram);
    q(".vx-stepper", scope).forEach(function (el) {
      var li = Array.prototype.filter.call(el.children, function (n) { return n.tagName === "LI"; }), a = li.findIndex(function (n) { return n.classList.contains("is-active"); });
      stepTo(el, a < 0 ? li.filter(function (n) { return n.classList.contains("is-done"); }).length : a, true);
    });
    q(".vx-screens", scope).forEach(function (b) { if (!b.querySelector(":scope > .vx-screen.is-active") && b.querySelector(":scope > .vx-screen")) b.querySelector(":scope > .vx-screen").classList.add("is-active"); });
    q("[data-vx-sequence]", scope).forEach(sequence);
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
    SEQS.forEach(function (sq) { if (sq.state() === "running" || sq.state() === "paused" || sq.state() === "stepping") sq.complete(); });
    q("[data-vx-odometer]").forEach(function (el) { var s = el.__vxOdo; if (s && s.timer) { clearTimeout(s.timer); s.timer = 0; odoDraw(s, s.pending, true); } });
    if (numQ.length) numFlush();
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
    probeGlass();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start); else start();
  global.addEventListener("beforeprint", finish);
  // arriving through a cross-document View Transition: the transition already animates the panel
  global.addEventListener("pagereveal", function (e) { if (e.viewTransition) finish(); });
  // the user turns on "reduce motion" while the page is open → settle everything now
  if (mq.addEventListener) mq.addEventListener("change", function () { if (mq.matches) { finish(); root.classList.remove("vx-motion"); } });

  global.VistaMotion = {
    init: init, replay: replay, reveal: reveal, countUp: countUp, countTo: countTo, odometer: odometer, flash: flash,
    swap: swap, insert: insert, remove: remove, enter: enter, toast: toast, loading: loading,
    open: open, close: close, sortable: sortable, icons: icons,
    sequence: sequence, stepTo: stepTo, screen: screen, spotlight: spotlight,
    finish: finish, level: level, tokens: function () { if (!T.enter) readTokens(); return T; },
    glass: function (mode) {   // VistaMotion.glass("lite" | "full" | "auto") → set / clear the session choice
      if (mode) { root.setAttribute("data-vx-glass", mode); try { if (mode === "lite") global.sessionStorage.setItem(GLASS_KEY, "lite"); else global.sessionStorage.removeItem(GLASS_KEY); } catch (e) { /* ignore */ } }
      return root.getAttribute("data-vx-glass") || "auto";
    }
  };
})(window);
