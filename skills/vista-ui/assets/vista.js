/* VISTA UI — micro-interactions (optional, no dependencies).
   - renders Lucide icons (<i data-lucide="home"></i>) if lucide is loaded
   - toggles .is-active inside [data-vx-group] (segmented controls, chips, tabs, dock, nav)
   - toggles .is-on on .vx-switch / .vx-check
   - data-vx-theme-switch="lagoon|indigo|aurora|evergreen" buttons switch the theme live
     (cross-fades through a View Transition where supported)
   - fires a bubbling `vx:change` event ({detail:{item}}) on a group after its active item changes;
     vista-motion.js listens to it for [data-vx-swap] */
(function () {
  "use strict";
  function icons() { if (window.lucide && window.lucide.createIcons) window.lucide.createIcons(); }

  document.addEventListener("click", function (e) {
    var sw = e.target.closest(".vx-switch, .vx-check");
    if (sw) { sw.classList.toggle("is-on"); sw.setAttribute("aria-checked", sw.classList.contains("is-on")); return; }

    var th = e.target.closest("[data-vx-theme-switch]");
    if (th) {
      var apply = function () {
        document.documentElement.setAttribute("data-theme", th.getAttribute("data-vx-theme-switch"));
        if (window.VistaCharts) window.VistaCharts.renderAll(null, { animate: false });
      };
      var calm = window.VistaMotion ? window.VistaMotion.level() === "off"
        : window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (document.startViewTransition && !calm) document.startViewTransition(apply); else apply();
    }

    var group = e.target.closest("[data-vx-group]");
    if (group) {
      var item = e.target.closest("button, a, .vx-chip");
      if (item && group.contains(item) && item.parentElement.closest("[data-vx-group]") === group) {
        if (item.tagName === "A" && item.getAttribute("href") === "#") e.preventDefault();
        var changed = !item.classList.contains("is-active");
        group.querySelectorAll(".is-active").forEach(function (n) {
          if (n.closest("[data-vx-group]") === group) n.classList.remove("is-active");
        });
        item.classList.add("is-active");
        if (changed) group.dispatchEvent(new CustomEvent("vx:change", { bubbles: true, detail: { item: item } }));
      }
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", icons);
  else icons();
})();
