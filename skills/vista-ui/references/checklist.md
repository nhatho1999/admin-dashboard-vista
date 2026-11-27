# Ship checklist

Run `python3 scripts/screenshot.py page.html --full` and go through this list with the PNG open.

## Structure
- [ ] Layer order respected: backdrop → chrome → one `vx-panel` → `vx-card`s. No card sits directly on the backdrop.
- [ ] Page head present: (eyebrow) + H1 + one-line summary + actions on the right.
- [ ] KPI row of 4 (or 5) equal cards near the top on dashboard-like pages.
- [ ] Content uses `vx-grid-*` / `vx-split`; cards in a row have equal height; gaps are 16px.
- [ ] Exactly one active nav item; active item matches the page title.

## Content
- [ ] No placeholders left (`[[`, Lorem, `Item 1`, `$XXX`). `grep -n "\[\[" page.html` returns nothing.
- [ ] Numbers are realistic, formatted (`$16,477`, `2.32%`), and have context (delta or caption).
- [ ] Every chart card has a title + caption; multi-series charts have a legend.
- [ ] Statuses use `vx-status` pills with the right semantic color; people use avatars with initials.
- [ ] Icons render (no empty squares) — every `data-lucide` name exists on lucide.dev. No emoji.

## Visual
- [ ] Text never overflows or wraps awkwardly (long names ellipsize; stat values stay on one line).
- [ ] Charts render (no empty boxes) and fit their cards; y-axis labels not clipped.
- [ ] Only one filled CTA per toolbar; secondary actions are glass/light pills.
- [ ] Contrast OK: muted captions readable on the panel; white text only on dark/feature cards.
- [ ] No inline hex colors except chart configs/flags — styling goes through `vx-` classes and `--vx-` tokens.

## Behaviour
- [ ] Screenshot script printed no `[console error]` lines.
- [ ] Segmented controls / chips / tabs toggle (`data-vx-group` on their container).
- [ ] Interactive elements are `<button>`/`<a>`; icon-only buttons have `aria-label`.
- [ ] Checked at 1440px, and at 1100px / 390px if the page is meant for smaller screens.

## Motion
- [ ] `vista-motion.js` is loaded in `<head>` (right after `vista.css`), not at the end of `<body>`.
- [ ] `--frames 0,150,300,500,900` filmstrip: chrome → panel → head → cards in reading order; charts start after their card; all landed by ~1s.
- [ ] No `[error] … still invisible after motion finished`; `--reduced-motion` screenshot shows every card, number and chart.
- [ ] Every async button has feedback (`data-vx-loading` and/or a toast); period switches replay their chart (`data-vx-swap`).
- [ ] Live updates use `VistaMotion.insert/remove/countTo`, not a full re-render.
- [ ] `vx-tilt` on at most two hero cards; no custom infinite animations except loaders; no animating width/height/top/left.
- [ ] Custom transitions use `--vx-dur-*` / `--vx-ease-*` tokens; exits faster than entrances.
- [ ] Data updates call `VistaCharts.update` (morph) — not `innerHTML` + `renderAll`; live counters use `data-vx-odometer`.
- [ ] Dialogs are `<dialog class="vx-modal|vx-drawer|vx-sheet|vx-cmdk">` with `aria-labelledby`/`aria-label`; drag lists have a keyboard path.

## Walkthroughs (if the page explains a process)
- [ ] Representation chosen on purpose; stage list with durations written first (`walkthroughs.md` §2–3).
- [ ] Nothing auto-plays (except a small `data-vx-autoplay` diagram); controls disable by state; status ends with the result.
- [ ] Parallel / loop / branch / fail / skip are visible; payloads realistic; the page never scrolls by itself.

## Performance
- [ ] `--perf`: no `[warn]` lines (script during load < 250ms, < 120 layouts).
- [ ] Nothing with `backdrop-filter` is moved or scaled by your own code (fade it; move its content).
- [ ] No page-level `mousemove`/`scroll` handler that writes the DOM on every event — coalesce with `requestAnimationFrame`.
- [ ] No layout reads (`getBoundingClientRect`, `offsetWidth`) after writes inside loops.
- [ ] Live timers stop when `document.hidden`; long below-the-fold sections use `.vx-defer`.
- [ ] Don't set `data-vx-glass="full"` unless the page must always show live blur (it disables the slow-device fallback).

## Delivery
- [ ] Assets resolve from the output location (or the file was bundled with `scripts/bundle.py`).
- [ ] Told the user the theme + shell used and how to switch theme.
