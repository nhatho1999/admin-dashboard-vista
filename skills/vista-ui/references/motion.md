# Motion

Glass looks expensive when it *moves* like a physical material: panels settle into place, light
follows the cursor, numbers roll up, the active pill slides instead of blinking. This file is the
motion language of Vista UI and how to ship it with `assets/vista-motion.js`.

Live reference: `examples/lagoon-live-ops-motion.html` (every pattern below, wired to real interactions).

## 1. Principles

1. **Motion explains cause → effect.** Something moves because the user did something, or because data
   arrived. Never decoration on a loop.
2. **One choreography per moment.** The page entrance is a single, ordered sequence (chrome → panel →
   head → cards in reading order). After that the page is calm; only what the user touches moves.
3. **Arrive soft, leave fast.** Entrances decelerate (`--vx-ease-out`), exits accelerate (`--vx-ease-in`)
   and take ≈ 60% of the matching entrance.
4. **Same material, same physics.** Everything shares the tokens below. Things that the user
   moves or toggles (pills, switches, toasts, tilts) use the spring; things that arrive use ease-out.
5. **Never block, never trap.** Animations are interruptible, input works during them, and
   `prefers-reduced-motion` gets final states with no movement.

## 2. Setup

```html
<link rel="stylesheet" href="vista-assets/vista.css">
<script src="vista-assets/vista-motion.js"></script>          <!-- in <head>, not deferred -->
…
<script src="vista-assets/vendor/lucide.min.js"></script>
<script src="vista-assets/vista-charts.js"></script>
<script src="vista-assets/vista.js"></script>                   <!-- end of <body>, as before -->
```
Loaded in `<head>`, the script hides the shell for exactly one frame (`html.vx-boot`) so nothing flashes
before the entrance. If JS fails, a CSS failsafe shows everything after 1.6s.

Intensity: `<html data-vx-motion="…">`

| Level | Use for | Entrance | Extras |
|---|---|---|---|
| `subtle` | finance, health, dense back-office, data entry | 6px fade-rise, no count-up, no nav stagger | glow yes, tilt off |
| `standard` (default) | most dashboards, e-commerce, SaaS, CRM | 16px rise + scale .985, count-up, rows cascade, charts draw | everything |
| `expressive` | demos, consumer, onboarding, "wow" landing dashboards | 26px rise + scale .965, spring landing, H1 blur-in | everything |
| `off` | kiosks, screenshots, tests | none | none |

`prefers-reduced-motion: reduce` always behaves like `off` (CSS kills all transitions/animations; JS
shows final numbers and finished charts).

## 3. Tokens (in `vista.css`, read by both JS files)

| Token | Value | Use |
|---|---|---|
| `--vx-dur-press` | 90ms | `:active` scale-down |
| `--vx-dur-fast` | 160ms | hover color/opacity, tooltips, **exits** |
| `--vx-dur` | 220ms | small state changes (legacy base) |
| `--vx-dur-glide` | 420ms | glider, switch knob, hover lift, tilt reset, FLIP re-layout |
| `--vx-dur-enter` | 560ms | cards, panels, toasts arriving |
| `--vx-dur-draw` | 900ms | chart draw-in, count-up, progress fill |
| `--vx-stagger` | 45ms | delay between siblings (cap ≈ 12 steps → whole page lands in < 1s) |
| `--vx-ease-out` | `cubic-bezier(.16,1,.3,1)` | anything arriving |
| `--vx-ease-in` | `cubic-bezier(.55,0,.75,.2)` | anything leaving |
| `--vx-ease-in-out` | `cubic-bezier(.65,0,.35,1)` | moving between two on-screen spots, crossfades |
| `--vx-ease-spring` | `linear(…)` damped spring, ~4% overshoot | glider, press release, toasts, bars |
| `--vx-ease-bounce` | `linear(…)` ~12% overshoot | tiny things only: checkbox pop, icon nudge, end dots |

Distances: hover lift 1–2px · press scale .92–.98 · card entrance 6–26px · nothing travels more than
~30px. Rotation only in tilt (≤ 6°) and icon nudges (≤ 4°). Override any token per theme or per page:
`:root { --vx-dur-enter: 480ms; }`.

## 4. The page entrance (automatic)

```
ms   0        100       200       300       400       500       600       800      1200
     ├ sidebar slides in from the left (nav items cascade 22ms apart, active pill rides with its item)
     ├─ topbar drops 10px
     │  ├ panel rises 22px + scales .985→1
     │  │     ├ eyebrow ├ H1 ├ summary ├ actions          (55ms apart)
     │  │     │      ├ card 1 ├ card 2 ├ card 3 …           (45ms apart, sorted top→bottom, left→right)
     │  │     │      │    ├ its numbers count up from 0   (900ms, expo-out)
     │  │     │      │    ├ its progress bars fill
     │  │     │      │    ├ its table rows / list items cascade (35ms apart, max 8)
     │  │     │      │    └ its charts draw in (+120ms after the card starts)
     cards below the fold: hidden (.vx-pre) until 12% visible, then the same landing, batched + staggered
```
What counts as a "card": `.vx-card`, `.vx-quick__item`, `.vx-insight`, `.vx-add-tile`, `[data-vx-reveal]`
(outermost only — cards inside cards ride with their parent).

## 5. Pattern catalogue

| Moment | What moves | How you get it |
|---|---|---|
| Page load | entrance above | automatic |
| Scroll | cards rise when they enter | automatic; `data-vx-reveal` for non-cards |
| KPI numbers | count up from 0, width locked so neighbours don't jiggle | automatic on `.vx-stat__value`; `data-vx-count` elsewhere; `data-vx-count="off"`, `data-vx-from="900"` |
| Charts | bars grow (spring, left→right), lines/areas sweep, donut/gauge/ring arcs fill, end dot pops, center total counts | automatic (`vista-charts.js`); `"animate": false` per chart |
| Period / metric switch | chart replays quickly (0.7×) or the block crossfades | `data-vx-swap="#chart-id"` on the `data-vx-group`; or `VistaMotion.swap(el, update)` |
| Segmented control, tabs, sidebar nav, dock, rail | one shared pill/underline slides to the new choice (spring) | automatic on `.vx-seg`, `.vx-tabs`, `.vx-shell--sidebar .vx-nav`, `.vx-spatial__dock`, `.vx-spatial__rail` |
| Hover | buttons lift 1px, cards lift 2px, quick-action icon nudges, "Review →" arrow slides 3px | CSS, automatic |
| Press | scale .92–.98 in 90ms, spring back | CSS, automatic on buttons, icon buttons, chips, seg items, quick actions |
| Glass light | spotlight + lit 1px border follow the cursor | `.vx-glow` on cards (KPI row, feature/dark cards) |
| Depth | card tilts toward the cursor, springs back | `.vx-tilt` (+ `data-vx-tilt="4"`), max one or two per screen |
| Primary CTA | one diagonal sheen sweep on hover | automatic on `.vx-btn--cta` |
| Toggle | switch knob springs + stretches while pressed; checkbox pops | automatic |
| Live data in | new row slides in, siblings glide down (FLIP), row flashes | `VistaMotion.insert(list, row)` |
| Row out | fades up, rows below close the gap | `VistaMotion.remove(row)` |
| Value change | number rolls to the new value, flashes green/red | `VistaMotion.countTo(el, 16702)` |
| Waiting < 1s | button spinner, label hidden, width kept | `data-vx-loading="900"` or `VistaMotion.loading(btn, promise)` |
| Waiting > 1s | skeleton with shimmer, then crossfade to content | `.vx-skeleton--text/--title/--value/--circle/--block` + `swap` |
| Feedback | glass toast rises (spring), countdown bar, pauses on hover/focus, exits faster, stack reflows | `data-vx-toast="Saved"` or `VistaMotion.toast(msg, {tone, sub, action})` |
| Theme switch | whole page crossfades | automatic for `data-vx-theme-switch` (View Transitions) |
| Page → page | panel exits up, new panel rises; chrome stays put | opt-in: add `<style>@view-transition { navigation: auto; }</style>` to every page (same origin) |

## 6. Recipes

**Period switch that loads new data**
```js
document.querySelector("#period").addEventListener("vx:change", async (e) => {
  const chart = document.querySelector("#revenue");
  const data = await fetch(`/api/revenue?p=${e.detail.item.dataset.p}`).then(r => r.json());
  VistaCharts.render(chart, "bar", { ...chart.__vx.cfg, series: data.series });   // replays the draw-in
  VistaMotion.countTo(document.querySelector("#revenue-total"), data.total);
});
```
**Save with feedback**
```js
saveBtn.addEventListener("click", () =>
  VistaMotion.loading(saveBtn, api.save(form))
    .then(() => VistaMotion.toast("Changes saved", { sub: "Visible to your team now" }))
    .catch(() => VistaMotion.toast("Couldn't save", { tone: "danger", sub: "Check your connection and retry" })));
```
**Destructive action with undo**
```js
VistaMotion.remove(row).then(() =>
  VistaMotion.toast("Invoice archived", { action: { label: "Undo", onClick: () => VistaMotion.insert(tbody, row, next) } }));
```
**Skeleton → content**
```js
VistaMotion.swap(box, () => { box.innerHTML = SKELETON; });
const html = await load();
VistaMotion.swap(box, () => { box.innerHTML = html; lucide.createIcons(); VistaCharts.renderAll(box); });
```
**Content injected later (SPA route, modal, tab)** — `VistaMotion.init(root)` adds gliders,
`VistaCharts.renderAll(root)` draws charts (they animate when visible), `VistaMotion.reveal(card)` lands a card.
`VistaMotion.replay()` re-runs the whole entrance (e.g. after a client-side route change).

Full API: `init(root) · replay() · reveal(el, delay) · countUp(el, {delay, duration}) · countTo(el, value) ·
flash(el, "up"|"down") · swap(el, update) · insert(parent, node, before?) · remove(el) · enter(el) ·
toast(msg, {tone: success|info|warn|danger, sub, icon, action:{label,onClick}, duration}) ·
loading(btn, ms|promise) · finish() · level() · tokens()`. Groups fire `vx:change` (`e.detail.item`).

## 7. Performance

- Animate only `transform` / `opacity` (plus `clip-path` for wipes and SVG `stroke-dashoffset`). Entrances use the
  individual `translate` / `scale` properties so they never overwrite an element's own `transform`.
- The glider is the one exception that animates `width`/`height` — it is absolutely positioned, so it
  never reflows siblings.
- `will-change` only on the glider and tilt cards. Don't add it to every card (memory per layer, glass
  blur makes layers expensive).
- Cap staggers (≈ 12 steps); the full above-the-fold entrance must land in ≈ 1s, charts by ≈ 1.5s.
- Backdrop blur is the expensive part: avoid animating `backdrop-filter`, avoid moving huge blurred
  surfaces after load (the panel moves once, in the entrance).
- Charts are measured with layout size (`clientWidth`), so entrance scaling never shrinks them.

## 8. Accessibility & UX rules

- `prefers-reduced-motion` → no movement, no fades, final values (built in; don't override it).
- No infinite animation except loaders (skeleton shimmer, button spinner) and the `vx-live` dot.
- Never delay interaction: buttons are clickable during the entrance; animations never gate state.
- Interruptible: a new `swap`/`countTo` on the same element cancels the old one and sets the final state
  explicitly — never rely on `animationend` for correctness.
- Toasts are announced (`role="status"`, `aria-live="polite"`), pause on hover **and** keyboard focus,
  have a close button, and are for confirmations — errors that need action belong inline.
- Hover-only effects (glow, tilt) are decoration; nothing important is reachable only by hover.
- Keyboard focus ring settles in (`:focus-visible` animates offset) so it's noticeable, not jarring.

## 9. Don't

- Don't animate every element on scroll, bounce icons, pulse badges or loop gradients.
- Don't use the spring for things that arrive from off-screen at large distances (it overshoots visibly) — use ease-out.
- Don't make exits as slow as entrances, or entrances slower than ~600ms per element.
- Don't move content the user is reading (no parallax inside panels, no auto-advancing carousels without pause).
- Don't put `.vx-tilt` on tables, forms or anything with dense text; one or two hero cards max.
- Don't chain toasts for every background event — one per user action.
- Don't add custom `@keyframes` when a token + `rise`/`swap`/`enter` already covers it.

## 10. Verify

```
python3 scripts/screenshot.py page.html --full                     # end state after VistaMotion.finish()
python3 scripts/screenshot.py page.html --frames 0,150,300,500,900  # filmstrip of the entrance
python3 scripts/screenshot.py page.html --reduced-motion           # nothing missing without motion
```
The still screenshot reports `[error] … still invisible after motion finished` if a card got stuck hidden.
In the filmstrip check: chrome before panel, head before cards, cards in reading order, nothing jumps
or overlaps oddly, charts start after their card, the whole thing is done by ~1s.
