/* ==========================================================================
   VISTA CHARTS — tiny, dependency‑free SVG charts that read theme tokens.
   Types : bar · line · area · donut · gauge · ring · sparkline
   Usage : <div class="vx-chart" style="--h:240px" data-vx-chart="bar"
                data-vx='{"labels":["Jan","Feb"],"series":[{"name":"Rev","data":[3,5]}]}'></div>
           Charts auto-render on DOMContentLoaded and re-render on resize.
           JS API: VistaCharts.render(el, type, config) / VistaCharts.renderAll(root)
   Colors: "var(--vx-chart-1)" … "--vx-chart-6" are used by default, or pass
           `color` per series / slice (any CSS color or token name like "chart-3").
   Motion: charts draw themselves in the first time they scroll into view (bars grow, lines
           sweep, arcs fill). Calling render() again on the same element replays it faster
           (period switch). Off with "animate": false, renderAll(root, {animate:false}),
           <html data-vx-motion="off"> or prefers-reduced-motion.
   ========================================================================== */
(function (global) {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var uid = 0;

  /* ---------- helpers ---------- */
  function h(tag, attrs, parent) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }
  function color(c, i) {
    if (!c) return "var(--vx-chart-" + ((i % 6) + 1) + ")";
    if (/^chart-\d$/.test(c)) return "var(--vx-" + c + ")";
    if (/^--/.test(c)) return "var(" + c + ")";
    return c;
  }
  function fmt(v, f) {
    f = f || {};
    if (v === null || v === undefined || isNaN(v)) return "";
    var n = Number(v), s;
    if (f.compact !== false && Math.abs(n) >= 1e6) s = trim(n / 1e6) + "M";
    else if (f.compact !== false && Math.abs(n) >= 1e3) s = trim(n / 1e3) + "K";
    else s = f.decimals !== undefined ? n.toFixed(f.decimals) : trim(n);
    return (f.prefix || "") + s + (f.suffix || "");
  }
  function trim(n) { return (Math.round(n * 10) / 10).toString(); }
  function niceMax(max, ticks) {
    if (max <= 0) return 1;
    var raw = max / ticks, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
    var step = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag;
    return Math.ceil(max / step) * step;
  }
  function size(el) {
    // layout size, not getBoundingClientRect: entrance transforms (scale) must not shrink the chart
    var w = el.clientWidth, hh = el.clientHeight;
    if (!w) { var r = el.getBoundingClientRect(); w = r.width; hh = r.height; }
    return { w: Math.max(40, Math.round(w)), h: Math.max(30, Math.round(hh)) };
  }
  function svgRoot(el, w, hgt) {
    el.innerHTML = "";
    return h("svg", { viewBox: "0 0 " + w + " " + hgt, width: w, height: hgt, role: "img" }, el);
  }
  /* monotone cubic interpolation → smooth line without overshoot */
  function smoothPath(pts) {
    var n = pts.length;
    if (n < 2) return "";
    if (n === 2) return "M" + pts[0][0] + "," + pts[0][1] + "L" + pts[1][0] + "," + pts[1][1];
    var dx = [], dy = [], m = [], t = [];
    for (var i = 0; i < n - 1; i++) {
      dx[i] = pts[i + 1][0] - pts[i][0];
      dy[i] = pts[i + 1][1] - pts[i][1];
      m[i] = dy[i] / dx[i];
    }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = t[i + 1] = 0; continue; }
      var a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { var k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    var d = "M" + pts[0][0] + "," + pts[0][1];
    for (i = 0; i < n - 1; i++) {
      var c = dx[i] / 3;
      d += "C" + (pts[i][0] + c) + "," + (pts[i][1] + c * t[i]) + " " + (pts[i + 1][0] - c) + "," +
        (pts[i + 1][1] - c * t[i + 1]) + " " + pts[i + 1][0] + "," + pts[i + 1][1];
    }
    return d;
  }
  function linePath(pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + p[0] + "," + p[1]; }).join(""); }
  function arc(cx, cy, r, a0, a1) {
    var large = a1 - a0 > Math.PI ? 1 : 0;
    return "M" + (cx + r * Math.cos(a0)) + "," + (cy + r * Math.sin(a0)) +
      "A" + r + "," + r + " 0 " + large + " 1 " + (cx + r * Math.cos(a1)) + "," + (cy + r * Math.sin(a1));
  }
  function tooltip(el) {
    var t = el.querySelector(".vx-tooltip");
    if (!t) { t = document.createElement("div"); t.className = "vx-tooltip"; el.appendChild(t); }
    return t;
  }
  function center(el, c, cls) {
    if (!c) return;
    var d = document.createElement("div");
    d.className = "vx-chart__center" + (cls ? " " + cls : "");
    d.innerHTML = (c.value !== undefined ? "<b>" + c.value + "</b>" : "") + (c.label ? "<span>" + c.label + "</span>" : "");
    el.appendChild(d);
  }
  function seriesMax(series, stacked) {
    var max = 0, len = series.length ? series[0].data.length : 0;
    for (var i = 0; i < len; i++) {
      var sum = 0;
      series.forEach(function (s) { var v = +s.data[i] || 0; sum = stacked ? sum + v : Math.max(sum, v); });
      max = Math.max(max, sum);
    }
    return max;
  }
  function axes(svg, cfg, box, max, labels, min) {
    var ticks = cfg.ticks || 4, g = h("g", {}, svg);
    min = min || 0;
    if (cfg.grid !== false) {
      for (var i = 0; i <= ticks; i++) {
        var y = box.y + box.h - (box.h * i) / ticks;
        h("line", { x1: box.x, x2: box.x + box.w, y1: y, y2: y, stroke: "var(--vx-chart-grid)", "stroke-dasharray": i ? "3 4" : null }, g);
        if (cfg.yAxis !== false) {
          var tx = h("text", { x: box.x - 10, y: y + 3.5, "text-anchor": "end" }, g);
          var tv = min + ((max - min) * i) / ticks;
          tx.textContent = tv === 0 ? ((cfg.yFormat && cfg.yFormat.prefix) || "") + "0" : fmt(tv, cfg.yFormat);
        }
      }
    }
    if (cfg.xAxis !== false && labels) {
      var lastX = -Infinity, minGap = cfg.labelGap || 52;
      labels.forEach(function (l, i) {
        if (l === "" || l === null || l === undefined) return;
        var x = cfg._xAt(i);
        if (x - lastX < minGap) return;
        lastX = x;
        var t = h("text", { x: x, y: box.y + box.h + 18, "text-anchor": "middle" }, g);
        t.textContent = l;
      });
    }
  }
  function layout(cfg, s) {
    var left = cfg.yAxis === false ? 4 : cfg.padLeft || 40;
    var bottom = cfg.xAxis === false ? 4 : 26;
    return { x: left, y: cfg.padTop || 10, w: s.w - left - (cfg.padRight || 8), h: s.h - bottom - (cfg.padTop || 10) };
  }
  function hoverLayer(el, svg, box, n, xAt, html, onMove) {
    var tip = tooltip(el), guide = h("line", { y1: box.y, y2: box.y + box.h, stroke: "var(--vx-chart-muted)", "stroke-width": 1, opacity: 0 }, svg);
    var hit = h("rect", { x: box.x, y: box.y, width: box.w, height: box.h, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", function (e) {
      var r = svg.getBoundingClientRect(), mx = e.clientX - r.left, best = 0, bd = Infinity;
      for (var i = 0; i < n; i++) { var d = Math.abs(xAt(i) - mx); if (d < bd) { bd = d; best = i; } }
      guide.setAttribute("x1", xAt(best)); guide.setAttribute("x2", xAt(best)); guide.setAttribute("opacity", 1);
      tip.innerHTML = html(best); tip.style.left = xAt(best) + "px"; tip.style.top = box.y + 8 + "px"; tip.classList.add("is-on");
      if (onMove) onMove(best);
    });
    hit.addEventListener("mouseleave", function () { tip.classList.remove("is-on"); guide.setAttribute("opacity", 0); if (onMove) onMove(-1); });
  }
  function tipHtml(cfg, i) {
    var out = "<div>" + (cfg.labels ? cfg.labels[i] : "") + "</div>";
    cfg.series.forEach(function (s, k) {
      out += '<div class="row"><i style="--c:' + color(s.color, k) + '"></i>' + (s.name || "") + "<b>" + fmt(s.data[i], cfg.yFormat) + "</b></div>";
    });
    return out;
  }

  /* ---------- BAR (grouped or stacked, optional highlight) ---------- */
  function bar(el, cfg) {
    var s = size(el), svg = svgRoot(el, s.w, s.h), box = layout(cfg, s);
    var series = cfg.series, n = series[0].data.length, stacked = !!cfg.stacked;
    var max = cfg.max || niceMax(seriesMax(series, stacked), cfg.ticks || 4);
    var slot = box.w / n, groups = stacked ? 1 : series.length;
    var bw = Math.min(cfg.barWidth || 999, (slot * (cfg.barRatio || 0.56)) / groups);
    var gap = groups > 1 ? Math.max(2, bw * 0.18) : 0;
    var rad = cfg.radius !== undefined ? cfg.radius : Math.min(8, bw / 2);
    cfg._xAt = function (i) { return box.x + slot * i + slot / 2; };
    axes(svg, cfg, box, max, cfg.labels);
    var hl = cfg.highlight === "last" ? n - 1 : cfg.highlight;
    var bars = [];
    for (var i = 0; i < n; i++) {
      var base = box.y + box.h, groupW = groups * bw + (groups - 1) * gap, gx = cfg._xAt(i) - groupW / 2;
      series.forEach(function (sr, k) {
        var v = +sr.data[i] || 0, bh = (v / max) * box.h;
        var x = stacked ? gx : gx + k * (bw + gap), y = stacked ? base - bh : box.y + box.h - bh;
        var c = color(sr.color, k);
        if (hl !== undefined && hl !== null && i !== hl && !stacked && series.length === 1) c = cfg.dimColor || "color-mix(in srgb, " + c + " 45%, transparent)";
        if (hl === i && cfg.highlightColor) c = color(cfg.highlightColor);
        var top = !stacked || k === series.length - 1;
        var r = Math.min(rad, bh / 2);
        var d = top
          ? "M" + x + "," + (y + bh) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y + "H" + (x + bw - r) + "Q" + (x + bw) + "," + y + " " + (x + bw) + "," + (y + r) + "V" + (y + bh) + "Z"
          : "M" + x + "," + (y + bh) + "V" + y + "H" + (x + bw) + "V" + (y + bh) + "Z";
        var p = h("path", { d: d, fill: c, opacity: sr.opacity, "class": "vx-m-bar", "data-i": i, "data-k": stacked ? k : 0 }, svg);
        if (stacked && k < series.length - 1) p.setAttribute("stroke", "transparent");
        bars.push({ el: p, i: i });
        if (stacked) base -= bh;
        if (hl === i && cfg.highlightLabel && (k === series.length - 1)) {
          var pill = document.createElement("div");
          pill.className = "vx-chart-pill vx-chart-pill--light";
          pill.textContent = typeof cfg.highlightLabel === "string" ? cfg.highlightLabel : fmt(v, cfg.yFormat);
          pill.style.left = x + bw / 2 + "px"; pill.style.top = y - 14 + "px";
          el.appendChild(pill);
        }
      });
    }
    if (cfg.refLine !== undefined) {
      var ry = box.y + box.h - (cfg.refLine / max) * box.h;
      h("line", { x1: box.x, x2: box.x + box.w, y1: ry, y2: ry, stroke: "var(--vx-ink-2)", "stroke-dasharray": "4 4", opacity: .55, "class": "vx-m-ref" }, svg);
      if (cfg.refLabel) {
        var rp = document.createElement("div"); rp.className = "vx-chart-pill vx-chart-pill--light";
        rp.textContent = cfg.refLabel; rp.style.left = box.x + box.w - 30 + "px"; rp.style.top = ry + "px"; el.appendChild(rp);
      }
    }
    if (cfg.tooltip !== false) hoverLayer(el, svg, box, n, cfg._xAt, function (i) { return tipHtml(cfg, i); }, function (sel) {
      bars.forEach(function (b) { b.el.style.opacity = sel < 0 || b.i === sel ? "" : ".55"; });
    });
  }

  /* ---------- LINE / AREA ---------- */
  function line(el, cfg, forceArea) {
    var s = size(el), svg = svgRoot(el, s.w, s.h), box = layout(cfg, s);
    var series = cfg.series, n = Math.max.apply(null, series.map(function (x) { return x.data.length; }));
    var total = cfg.points || (cfg.labels ? cfg.labels.length : n);
    var max = cfg.max || niceMax(seriesMax(series, false), cfg.ticks || 4), min = cfg.min || 0;
    var step = total > 1 ? box.w / (total - 1) : 0;
    cfg._xAt = function (i) { return box.x + step * i; };
    var yAt = function (v) { return box.y + box.h - ((v - min) / (max - min)) * box.h; };
    axes(svg, cfg, box, max, cfg.labels, min);
    var defs = h("defs", {}, svg);
    series.forEach(function (sr, k) {
      var c = color(sr.color, k), pts = [];
      sr.data.forEach(function (v, i) { if (v !== null && v !== undefined) pts.push([cfg._xAt(i), yAt(v)]); });
      var d = cfg.smooth === false ? linePath(pts) : smoothPath(pts);
      if ((forceArea || sr.area) && pts.length > 1) {
        var id = "vxg" + ++uid, gr = h("linearGradient", { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        h("stop", { offset: "0%", "stop-color": c, "stop-opacity": sr.areaOpacity || 0.28 }, gr);
        h("stop", { offset: "100%", "stop-color": c, "stop-opacity": 0 }, gr);
        h("path", { d: d + "L" + pts[pts.length - 1][0] + "," + (box.y + box.h) + "L" + pts[0][0] + "," + (box.y + box.h) + "Z", fill: "url(#" + id + ")", "class": "vx-m-area", "data-k": k }, svg);
      }
      h("path", {
        d: d, fill: "none", stroke: c, "stroke-width": sr.width || 2.4, "stroke-linecap": "round", "stroke-linejoin": "round",
        "stroke-dasharray": sr.dashed ? "5 5" : null, opacity: sr.opacity, "class": "vx-m-line", "data-k": k
      }, svg);
      if (sr.endDot !== false && (cfg.endDot || sr.endDot) && pts.length) {
        var lp = pts[pts.length - 1];
        h("circle", { cx: lp[0], cy: lp[1], r: 5, fill: "#fff", stroke: c, "stroke-width": 2.5, "class": "vx-m-dot" }, svg);
      }
    });
    if (cfg.tooltip !== false) {
      var dots = series.map(function (sr, k) { return h("circle", { r: 4.5, fill: "#fff", stroke: color(sr.color, k), "stroke-width": 2.5, opacity: 0 }, svg); });
      hoverLayer(el, svg, box, total, cfg._xAt, function (i) { return tipHtml(cfg, i); }, function (i) {
        dots.forEach(function (d, k) {
          var v = series[k].data[i];
          if (i < 0 || v === null || v === undefined) return d.setAttribute("opacity", 0);
          d.setAttribute("cx", cfg._xAt(i)); d.setAttribute("cy", yAt(v)); d.setAttribute("opacity", 1);
        });
      });
    }
  }

  /* ---------- DONUT (rounded, gapped segments) ---------- */
  function donut(el, cfg) {
    var s = size(el), dim = Math.min(s.w, s.h), svg = svgRoot(el, s.w, s.h);
    var th = cfg.thickness || Math.max(10, dim * 0.13), r = dim / 2 - th / 2 - 2, cx = s.w / 2, cy = s.h / 2;
    var data = cfg.data, total = data.reduce(function (a, d) { return a + (+d.value || 0); }, 0) || 1;
    var gap = (cfg.gap !== undefined ? cfg.gap : 3) * Math.PI / 180 + th / r * (cfg.round === false ? 0 : 1);
    if (cfg.track !== false) h("circle", { cx: cx, cy: cy, r: r, fill: "none", stroke: "var(--vx-chart-muted)", "stroke-width": th, opacity: .5 }, svg);
    var a = -Math.PI / 2, tip = tooltip(el);
    data.forEach(function (d, i) {
      var sweep = (d.value / total) * Math.PI * 2, a0 = a + gap / 2, a1 = a + sweep - gap / 2;
      if (a1 > a0) {
        var p = h("path", {
          d: arc(cx, cy, r, a0, a1), fill: "none", stroke: color(d.color, i), "stroke-width": th,
          "stroke-linecap": cfg.round === false ? "butt" : "round", "class": "vx-m-arc",
          "data-a": ((a0 + Math.PI / 2) / (Math.PI * 2)).toFixed(4), "data-s": ((a1 - a0) / (Math.PI * 2)).toFixed(4)
        }, svg);
        p.addEventListener("mousemove", function (e) {
          var b = el.getBoundingClientRect();
          tip.innerHTML = '<div class="row"><i style="--c:' + color(d.color, i) + '"></i>' + d.label + "<b>" +
            (cfg.format ? fmt(d.value, cfg.format) : Math.round((d.value / total) * 100) + "%") + "</b></div>";
          tip.style.left = e.clientX - b.left + "px"; tip.style.top = e.clientY - b.top + "px"; tip.classList.add("is-on");
          p.setAttribute("stroke-width", th + 4);
        });
        p.addEventListener("mouseleave", function () { tip.classList.remove("is-on"); p.setAttribute("stroke-width", th); });
      }
      a += sweep;
    });
    center(el, cfg.center);
  }

  /* ---------- GAUGE (semicircle, stacked segments) ---------- */
  function gauge(el, cfg) {
    var s = size(el), svg = svgRoot(el, s.w, s.h);
    var th = cfg.thickness || 22, r = Math.min(s.w / 2, s.h) - th / 2 - 4, cx = s.w / 2, cy = s.h - 4;
    var max = cfg.max || 100, segs = cfg.segments || [{ value: cfg.value || 0 }];
    h("path", { d: arc(cx, cy, r, Math.PI, Math.PI * 2 - 0.0001), fill: "none", stroke: "var(--vx-chart-muted)", "stroke-width": th, "stroke-linecap": "round" }, svg);
    var acc = 0;
    // draw cumulative from largest to smallest so rounded caps overlap correctly
    var cum = segs.map(function (sg) { acc += sg.value; return acc; });
    for (var i = segs.length - 1; i >= 0; i--) {
      var a1 = Math.PI + Math.min(1, cum[i] / max) * Math.PI;
      if (cum[i] > 0) h("path", { d: arc(cx, cy, r, Math.PI, Math.max(Math.PI + 0.01, a1)), fill: "none", stroke: color(segs[i].color, i), "stroke-width": th, "stroke-linecap": "round", "class": "vx-m-arc", "data-a": 0, "data-s": Math.min(1, cum[i] / max).toFixed(4) }, svg);
    }
    center(el, cfg.center, "vx-chart__center--gauge");
  }

  /* ---------- RING (single progress circle) ---------- */
  function ring(el, cfg) {
    var s = size(el), dim = Math.min(s.w, s.h), svg = svgRoot(el, s.w, s.h);
    var th = cfg.thickness || Math.max(6, dim * 0.09), r = dim / 2 - th / 2 - 1, cx = s.w / 2, cy = s.h / 2;
    var pct = Math.max(0, Math.min(1, (cfg.value || 0) / (cfg.max || 100)));
    h("circle", { cx: cx, cy: cy, r: r, fill: "none", stroke: cfg.trackColor || "var(--vx-chart-muted)", "stroke-width": th }, svg);
    if (pct > 0) {
      var c = 2 * Math.PI * r;
      h("circle", {
        cx: cx, cy: cy, r: r, fill: "none", stroke: color(cfg.color, 0), "stroke-width": th, "stroke-linecap": "round",
        "stroke-dasharray": c * pct + " " + c, transform: "rotate(-90 " + cx + " " + cy + ")",
        "class": "vx-m-arc", "data-a": 0, "data-s": pct.toFixed(4), "data-len": c * pct
      }, svg);
    }
    center(el, cfg.center || { value: Math.round(pct * 100) + "%", label: cfg.label });
  }

  /* ---------- SPARKLINE ---------- */
  function spark(el, cfg) {
    var s = size(el), svg = svgRoot(el, s.w, s.h), data = cfg.data || [];
    var max = Math.max.apply(null, data), min = Math.min.apply(null, data), pad = 3;
    var rng = max - min || 1, step = (s.w - pad * 2) / Math.max(1, data.length - 1);
    var pts = data.map(function (v, i) { return [pad + i * step, pad + (s.h - pad * 2) * (1 - (v - min) / rng)]; });
    var c = color(cfg.color, 0), d = cfg.smooth === false ? linePath(pts) : smoothPath(pts);
    if (cfg.area !== false) {
      var id = "vxs" + ++uid, gr = h("linearGradient", { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, h("defs", {}, svg));
      h("stop", { offset: "0%", "stop-color": c, "stop-opacity": .25 }, gr);
      h("stop", { offset: "100%", "stop-color": c, "stop-opacity": 0 }, gr);
      h("path", { d: d + "L" + pts[pts.length - 1][0] + "," + s.h + "L" + pts[0][0] + "," + s.h + "Z", fill: "url(#" + id + ")", "class": "vx-m-area" }, svg);
    }
    h("path", { d: d, fill: "none", stroke: c, "stroke-width": cfg.width || 1.8, "stroke-linecap": "round", "stroke-linejoin": "round", "class": "vx-m-line" }, svg);
  }

  var TYPES = {
    bar: bar, line: function (e, c) { line(e, c, false); }, area: function (e, c) { line(e, c, true); },
    donut: donut, gauge: gauge, ring: ring, sparkline: spark, spark: spark
  };

  /* ---------- MOTION: draw-in on first view, quick replay on update ---------- */
  var ROOT = document.documentElement, easeOk = {};
  function motionOff() {
    return ROOT.getAttribute("data-vx-motion") === "off" ||
      !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function tokMs(name, fb) {
    var v = getComputedStyle(ROOT).getPropertyValue(name).trim(), n = parseFloat(v);
    if (isNaN(n)) return fb;
    return /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n;
  }
  function tokEase(name, fb) {
    var v = getComputedStyle(ROOT).getPropertyValue(name).trim();
    if (!v) return fb;
    if (easeOk[v] === undefined) {
      try { document.createElement("div").animate([], { duration: 1, easing: v }).cancel(); easeOk[v] = true; }
      catch (e) { easeOk[v] = false; }
    }
    return easeOk[v] ? v : fb;
  }
  function extras(el) { return el.querySelectorAll(":scope > svg, :scope > .vx-chart-pill, :scope > .vx-chart__center"); }
  function hide(el) { extras(el).forEach(function (n) { n.style.opacity = "0"; }); }
  function unhide(el) { extras(el).forEach(function (n) { n.style.opacity = ""; }); }
  /* entrance sync: vista-motion.js stamps each revealed block with __vxAt (when it lands) */
  function hostDelay(el) {
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      if (n.__vxAt) return Math.max(0, n.__vxAt - performance.now()) + 120;
    }
    return 0;
  }
  function play(el, speed, delay) {
    el.__vxArmed = false;
    unhide(el);
    var svg = el.querySelector(":scope > svg");
    if (!svg || !svg.animate) return;
    var draw = tokMs("--vx-dur-draw", 900) * speed, enter = tokMs("--vx-dur-enter", 560) * speed;
    var out = tokEase("--vx-ease-out", "cubic-bezier(.16,1,.3,1)");
    var spring = tokEase("--vx-ease-spring", out), bounce = tokEase("--vx-ease-bounce", spring);
    function o(d, dur, ease) { return { duration: dur, delay: delay + d, easing: ease, fill: "backwards" }; }
    svg.animate([{ opacity: 0 }, { opacity: 1 }], o(0, 260 * speed, "linear"));

    var bars = svg.querySelectorAll(".vx-m-bar"), n = 0;
    bars.forEach(function (b) { n = Math.max(n, +b.getAttribute("data-i") + 1); });
    var step = n ? Math.min(34, 380 / n) * speed : 0;
    bars.forEach(function (b) {
      b.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }],
        o(+b.getAttribute("data-i") * step + +b.getAttribute("data-k") * 90 * speed, enter * 1.2, spring));
    });
    svg.querySelectorAll(".vx-m-line, .vx-m-ref").forEach(function (p) {
      p.animate([{ clipPath: "inset(-20% 100% -20% 0)" }, { clipPath: "inset(-20% 0% -20% 0)" }],
        o((+p.getAttribute("data-k") || 0) * 90 * speed, draw, out));
    });
    svg.querySelectorAll(".vx-m-area").forEach(function (p) {
      p.animate([{ clipPath: "inset(0 100% 0 0)", opacity: 0 }, { clipPath: "inset(0 0% 0 0)", opacity: 1 }],
        o((+p.getAttribute("data-k") || 0) * 90 * speed, draw * 1.1, out));
    });
    svg.querySelectorAll(".vx-m-dot").forEach(function (p) {
      p.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], o(draw * 0.8, enter, bounce));
    });
    svg.querySelectorAll(".vx-m-arc").forEach(function (p) {
      var len = +p.getAttribute("data-len") || (p.getTotalLength ? p.getTotalLength() : 0);
      if (!len) return;
      if (!p.getAttribute("stroke-dasharray")) p.style.strokeDasharray = len + "px " + (len + 4) + "px";
      var a = +p.getAttribute("data-a") || 0, sw = +p.getAttribute("data-s") || 1;
      p.animate([{ strokeDashoffset: len + "px", opacity: 0 }, { opacity: 1, offset: 0.06 }, { strokeDashoffset: "0px", opacity: 1 }],
        o(a * draw, Math.max(260 * speed, sw * draw * 1.2), out));
    });
    el.querySelectorAll(":scope > .vx-chart-pill").forEach(function (p, i) {
      p.animate([{ opacity: 0, translate: "0 6px" }, { opacity: 1, translate: "0 0" }], o(draw * 0.6 + i * 60, enter, spring));
    });
    var c = el.querySelector(":scope > .vx-chart__center");
    if (c) {
      c.animate([{ opacity: 0, scale: "0.94" }, { opacity: 1, scale: "1" }], o(draw * 0.25, enter, spring));
      var b = c.querySelector("b");
      if (b && global.VistaMotion && global.VistaMotion.countUp) global.VistaMotion.countUp(b, { delay: delay + draw * 0.2, duration: draw });
    }
  }
  var io = global.IntersectionObserver ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      var t = e.target;
      // rAF: let vista-motion's reveal (same frame) stamp the host card first
      requestAnimationFrame(function () { if (t.__vxArmed) play(t, 1, hostDelay(t)); });
    });
  }, { threshold: 0.2 }) : null;

  function render(el, type, cfg, opts) {
    if (!TYPES[type]) { console.warn("[vista-charts] unknown type", type); return; }
    el.__vx = { type: type, cfg: cfg };
    el.classList.add("vx-chart");
    try { TYPES[type](el, cfg); } catch (err) { console.error("[vista-charts]", type, err); }
    var animate = cfg.animate !== false && !(opts && opts.animate === false) && !motionOff();
    if (!animate) el.__vxArmed = false;
    else if (el.__vxSeen) play(el, 0.7, 0);              // data/period change → quick replay
    else {
      el.__vxArmed = true; hide(el);
      if (io) io.observe(el); else play(el, 1, 0);
    }
    el.__vxSeen = true;
    if (!el.__vxObs && global.ResizeObserver) {
      var last = 0;
      el.__vxObs = new ResizeObserver(function (en) {
        var w = Math.round(en[0].contentRect.width);
        if (w && w !== last) {
          last = w; TYPES[el.__vx.type](el, el.__vx.cfg);
          if (el.__vxArmed) hide(el);
        }
      });
      el.__vxObs.observe(el);
    }
  }
  function renderAll(root, opts) {
    var list = Array.prototype.slice.call((root || document).querySelectorAll("[data-vx-chart]"));
    if (root && root.matches && root.matches("[data-vx-chart]")) list.unshift(root);
    list.forEach(function (el) {
      var raw = el.getAttribute("data-vx");
      if (!raw) { var sc = el.querySelector('script[type="application/json"]'); raw = sc && sc.textContent; }
      var cfg = {};
      try { cfg = raw ? JSON.parse(raw) : {}; } catch (e) { console.error("[vista-charts] bad JSON in", el, e); return; }
      render(el, el.getAttribute("data-vx-chart"), cfg, opts);
    });
  }
  /* play every chart still waiting for the viewport (screenshots, print, VistaMotion.finish) */
  function flush() {
    document.querySelectorAll(".vx-chart").forEach(function (el) { if (el.__vxArmed) { if (io) io.unobserve(el); play(el, 1, 0); } });
  }
  global.VistaCharts = { render: render, renderAll: renderAll, replay: function (el) { if (el.__vx) render(el, el.__vx.type, el.__vx.cfg); }, flush: flush, format: fmt };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { renderAll(); });
  else renderAll();
})(window);
