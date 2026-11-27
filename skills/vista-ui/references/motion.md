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
| `expressive` | demos, consumer, onboarding, "wow" landing dashboards | 26px rise + scale .965, spring landing, H1 springs in | everything |
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
     ├ sidebar fades in (glass never moves); its nav items slide in 22ms apart, active pill rides along
     ├─ topbar / topnav fades in
     │  ├ panel fades in (a solid, non-blurred panel — notch shell — also rises 22px + scales .985→1)
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
| New data, same chart | bars/lines/areas **morph** from the old shapes to the new ones (no redraw from zero) | `data-vx-patch='{"series":[…]}'` on each option of a `data-vx-swap` group, or `VistaCharts.update(el, {series})` |
| Live counter | digits roll like an odometer — transform only, zero text relayout | `data-vx-odometer` on the number (count-up + `countTo` use it automatically) |
| Dialogs | modal settles in (spring, from 96%), drawer slides from the edge, sheet from the bottom, backdrop fades; exits faster | `<dialog class="vx-modal | vx-drawer | vx-sheet">` + `data-vx-open="#id"` / `data-vx-close`; Esc + backdrop click animate too |
| Command palette | opens with ⌘K / Ctrl+K, filters as you type, active row glides (shared pill) | `<dialog class="vx-cmdk" data-vx-cmdk>` (markup in `templates/topnav.html`) |
| Drag & drop | card lifts (scale 1.03, 1.2° tilt), a dashed slot opens, other cards glide out of the way, drop springs into the slot | `data-vx-sortable="group"` on each list; Alt+Arrow keys for keyboard; listen to `vx:sort` |
| Press (touch-friendly) | ink ripple from the press point | `.vx-ripple` on buttons / tiles |
| Pointer pull | a CTA leans ≤ 6px toward the cursor, springs back | `.vx-magnetic` (+ `data-vx-magnetic="4"`), one per area |
| Explaining a process | steps run one by one (spinner → check, connector fills), arrows draw between lanes, stages fill, screens slide, a ring spotlights the next control | `[data-vx-sequence]` + `[data-vx-step]` — see `walkthroughs.md` |
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
| Page → page | panel exits up, new panel rises; chrome stays put | automatic between same-origin pages that load `vista.css` (cross-document View Transitions, Chromium) |

## 6. Recipes

**Period switch that loads new data**
```js
document.querySelector("#period").addEventListener("vx:change", async (e) => {
  const chart = document.querySelector("#revenue");
  const data = await fetch(`/api/revenue?p=${e.detail.item.dataset.p}`).then(r => r.json());
  VistaCharts.update(chart, { series: data.series });   // morphs old bars into the new ones
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
**Open a record in a drawer, confirm in a modal**
```html
<button class="vx-btn" data-vx-open="#invoice">Open</button>
<dialog class="vx-drawer" id="invoice" aria-labelledby="inv-t">
  <div class="vx-dialog__head"><div><h2 class="vx-h2" id="inv-t">INV-0076</h2></div>
    <button class="vx-iconbtn vx-iconbtn--sm" data-vx-close aria-label="Close"><i data-lucide="x"></i></button></div>
  <div class="vx-dialog__body">…</div>
  <div class="vx-dialog__foot"><button class="vx-btn vx-btn--ghost" data-vx-close>Cancel</button>
    <button class="vx-btn vx-btn--cta" data-vx-open="#confirm">Refund</button></div>   <!-- closes the drawer, opens the modal -->
</dialog>
```
`VistaMotion.open(el|"#id")` / `close(el)` do the same from code; dialogs fire `vx:open`. Native `<dialog>` gives
focus trapping, Esc, and focus return for free.

**Kanban that saves its order**
```js
document.addEventListener("vx:sort", (e) => {
  const { item, to, index } = e.detail;      // the moved card, its new list, its new position
  api.move(item.dataset.id, to.dataset.status, index).catch(() => VistaMotion.toast("Couldn't move card", "danger"));
});
```

**Content injected later (SPA route, modal, tab)** — `VistaMotion.init(root)` adds gliders,
`VistaCharts.renderAll(root)` draws charts (they animate when visible), `VistaMotion.reveal(card)` lands a card.
`VistaMotion.replay()` re-runs the whole entrance (e.g. after a client-side route change).

Full API: `init(root) · replay() · reveal(el, delay) · countUp(el, {delay, duration}) · countTo(el, value) ·
odometer(el, value, {delay, flash}) · flash(el, "up"|"down") · swap(el, update) · insert(parent, node, before?) ·
remove(el) · enter(el) · toast(msg, {tone: success|info|warn|danger, sub, icon, action:{label,onClick}, duration}) ·
loading(btn, ms|promise) · open(dialog) · close(dialog) · sortable(list, group) · icons(root) ·
sequence(root) → {play, pause, step, speed, reset, complete, state} · stepTo(stepper, i) · screen(el) ·
spotlight(el, {label, duration}) · finish() ·
level() · tokens() · glass("lite"|"full"|"auto")`. Charts: `VistaCharts.update(el, patch)` (morph),
`replay(el)` (draw-in again), `render(el, type, cfg)`, `escape(text)`.
Events: groups fire `vx:change` (`e.detail.item`), sortable lists `vx:sort` (`{item, from, to, index}`), dialogs `vx:open`,
sequences `vx:step` (`{index, el, state}`) and `vx:done` (`{ok, ms}`), screens `vx:screen`.

## 7. Performance — what keeps it at 60fps

Measured with `scripts/screenshot.py --perf`: with blur rendered in software (old/integrated GPUs, GPU
blocklists, VMs) live `backdrop-filter` makes every frame ~5× slower (lagoon overview: p50 83ms → 17ms
without it). Everything below follows from that and from keeping the main thread free.

1. **Glass never moves.** Elements with `backdrop-filter` (sidebar, topbar, topnav, panel, spatial bars)
   only fade in; their *content* (nav items, cards) does the moving. Moving or scaling a blurred surface
   re-samples and re-blurs its backdrop on every frame. Never animate `backdrop-filter` itself.
2. **Adaptive glass.** `<html data-vx-glass="auto">` (default): vista-motion samples the first ~0.9s and, if
   the median frame is slower than ~30fps, switches to `lite` (no live blur; floating bars over photos get an
   opaque veil) and remembers it for the session. `prefers-reduced-transparency` → lite. Force `full` or
   `lite` per page; `VistaMotion.glass()` reads / sets it. Automation (Playwright) always stays `full`.
3. **Compositor-only properties.** `transform` / `opacity` / individual `translate` `scale` `rotate`.
   `clip-path` wipes (progress, chart sweep) and SVG `d` morphs run on the main thread — keep them short
   and staggered. Tooltips move with `translate`, not `left`/`top`; the `vx-live` ping and skeleton
   shimmer are transform/opacity loops, not `box-shadow` / `background-position`.
4. **One write per frame.** Pointer effects (glow, tilt, magnetic, drag), chart hover and the glider are
   coalesced with `requestAnimationFrame`; element rects are cached until scroll/resize.
5. **Read, then write.** Batch layout reads before DOM writes (count-ups queue up and start together; FLIP
   measures every node before moving any). One forced layout per batch, not per card.
6. **Don't touch the DOM when nothing changed.** Count-ups share one rAF loop and skip identical text;
   tooltips re-render only when the hovered index changes; resize redraws charts at most once per frame
   and never on the observer's initial callback.
7. **Odometer for live numbers.** `data-vx-odometer` rolls digit strips with `transform`: no text relayout
   at all, ideal for values that update every second.
8. **Layers on demand.** `will-change` only on the glider and on `.vx-tilt:hover`. Don't add it to cards.
9. **Skip off-screen work.** Big below-the-fold sections can take `.vx-defer` (`content-visibility: auto`).
   Pause timers on `visibilitychange` for live pages.
10. Cap staggers (≈ 12 steps); above-the-fold entrance lands in ≈ 1s, charts by ≈ 1.5s. Charts are
    measured with layout size (`clientWidth`), so entrance scaling never shrinks them.

## 8. Accessibility & UX rules

- `prefers-reduced-motion` → no movement, no fades, final values (built in; don't override it).
- No infinite animation except loaders (skeleton shimmer, button spinner, running-step spinner and dots) and the `vx-live` dot.
- Walkthroughs never auto-play (except small diagrams with `data-vx-autoplay`), never scroll the page, and keep
  progressing under reduced motion — only the movement is removed.
- Dialogs: native `<dialog>` + `showModal()` (focus trap, Esc, focus return); give each one
  `aria-labelledby`. The command palette is keyboard-first (↑↓ Enter Esc).
- Drag & drop always has a keyboard path: focusable items (`tabindex="0"`) move with Alt+↑↓ (within a list)
  and Alt+←→ (to the neighbouring list). Touch drags need a `[data-vx-handle]` (it sets `touch-action: none`).
- The odometer keeps the real value in a visually hidden copy for screen readers and copy/paste.
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
python3 scripts/screenshot.py page.html --perf                     # frames full vs lite glass, script/layout cost
```
The still screenshot reports `[error] … still invisible after motion finished` if a card got stuck hidden.
In the filmstrip check: chrome before panel, head before cards, cards in reading order, nothing jumps
or overlaps oddly, charts start after their card, the whole thing is done by ~1s.
