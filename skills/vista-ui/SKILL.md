---
name: vista-ui
description: Build polished glassmorphism dashboards and web-app UIs (frosted-glass panels, floating sidebar, KPI cards, SVG charts, pill controls) with smooth, GPU-friendly motion (choreographed entrance, chart draw-in and data morphing, odometer numbers, sliding active pills, glass light, modals/drawers/sheets, ⌘K command palette, drag-and-drop kanban, toasts, skeletons) plus animated walkthroughs that explain how a process works (run traces with play/pause/step, sequence diagrams, stage steppers, product-screen tours with spotlights) and adaptive glass that drops live blur on slow devices, in five shells (sidebar, notch, spatial, topnav, auth) and ten ready themes — lagoon (teal glass), indigo (royal-blue), aurora (warm spatial window), evergreen (green frame + white panel), graphite (true dark mode, lime accent), terracotta (ember + cream), lapis (midnight jewel tones), orchid (vivid violet), opaline (light minimal) and marina (navy + sand) — plus 53 curated palettes and a generator that turns any palette or brand colours into a full theme. Use when the user asks for an admin dashboard, back-office, CRM, analytics, finance, e-commerce or SaaS screen, project board / kanban, calendar / scheduling, live ops or deploy console, sign-in / onboarding screen, or asks to "show / animate / walk me through how X works" (pipelines, API handshakes, AI agent runs, checkout flows), or for a "beautiful / modern / glass / Apple-like" interface, or wants an existing page restyled that way. Ships a CSS design system, a zero-dependency chart library, a motion engine, page templates, full examples and a screenshot self-check.
---

# Vista UI

A design system + workflow for producing dashboards that look like premium Dribbble shots:
layered frosted glass on a rich gradient (or photo) backdrop, generous radii, big confident
numbers, pill-shaped controls and quiet, data-dense cards — and that *feel* premium in motion:
the page settles in one choreographed sequence, charts draw themselves, numbers roll up, the
active pill glides, light follows the cursor across the glass.

Everything is plain HTML + one CSS file + three small JS files, so it works in any stack and for any
agent. Paths below are relative to this skill's folder.

## What's in the box

| Path | What it is |
|---|---|
| `assets/vista.css` | The design system: tokens (incl. motion tokens), 10 themes, 5 shells, ~60 components (`vx-` prefix), lite-glass mode |
| `assets/vista-charts.js` | SVG charts: bar, line, area, donut, gauge, ring, sparkline (theme colors, draw-in on view, morph on data change) |
| `assets/vista-motion.js` | Motion engine: entrance, scroll reveal, count-up + odometer, glider, glow/tilt/magnetic/ripple, swap, FLIP insert/remove, dialogs, ⌘K palette, drag & drop, toasts, loading, adaptive glass, walkthrough sequences |
| `assets/vista.js` | Icons bootstrap + toggles for segmented controls, chips, tabs, switches; theme switch |
| `assets/vendor/lucide.min.js` | Lucide icon set (ISC), used as `<i data-lucide="name"></i>` |
| `templates/{sidebar,notch,spatial,topnav,auth}.html` | Page skeletons with `[[placeholders]]` (topnav ships the ⌘K palette + a drawer) |
| `examples/*.html` | Fourteen finished pages across all 10 themes and page types (overview, analytics, CRM, finance, live ops, reservations, support inbox, settings, kanban board, calendar, deploy console, sign-in, agent walkthrough) — the quality bar; `theme-gallery.html` = all themes + palette library |
| `scripts/scaffold.py` | New page from a template (copies or inlines assets) |
| `scripts/bundle.py` | Inline local CSS/JS → one self-contained `.html` |
| `scripts/screenshot.py` | Render pages to PNG + report console errors; `--frames` filmstrip of the motion; `--perf` smoothness report (Playwright) |
| `scripts/palette_theme.py` | Palette (id / name / hex list) → complete `[data-theme]` token block with contrast report; `--list`, `--preview` |
| `references/*.md` | Deep docs — read only what the task needs (see below) |

## Workflow

### 1. Decide theme + shell (don't ask unless the user cares)

| If the product feels… | Theme | Shell |
|---|---|---|
| Ops / admin / real-estate / B2B control center, calm & techy | `lagoon` | `sidebar` |
| E-commerce, analytics, SaaS — vivid, energetic | `indigo` | `sidebar` |
| Personal finance, lifestyle, consumer, "Apple Vision" demo | `aurora` | `spatial` |
| CRM, sales, productivity, health — clean & trustworthy | `evergreen` | `notch` |
| Dev tools, monitoring, product analytics, anything asked "dark mode" | `graphite` | `sidebar` |
| Restaurants, hospitality, crafts, interiors — warm | `terracotta` | `notch` |
| Wealth, luxury, legal, galleries — premium | `lapis` | `sidebar` |
| Creator tools, support desks, social, AI products — playful | `orchid` | `sidebar` |
| Settings, billing, minimal SaaS, light UI requested | `opaline` | `spatial` or `sidebar` |
| Travel, maritime, logistics, property | `marina` | `sidebar` |
| Boards, calendars, wide tables, ≤ 6 top-level areas (any theme) | `marina` / `lapis` / `graphite` | `topnav` |
| Sign in, sign up, 2FA, invite, onboarding (any theme) | match the app | `auth` |

Brand colours given? Run `python3 scripts/palette_theme.py "#hex,#hex,…" --name brand` and paste the CSS
(see `references/themes.md`). Only a mood given (“warm”, “calm”, “bold”…)? Pick from the 53 palettes in
`references/palettes.md` when no built-in theme fits, and generate.

Page types with their own recipe + example (`references/layouts.md`): overview, analytics, list/table, card gallery,
inbox, goals, settings, feed, **board (kanban)**, **calendar**, **live console**, **sign-in**, **walkthrough**.

Explaining *how something works* rather than showing data? Read `references/walkthroughs.md` first: pick the
picture (run trace, sequence diagram, product screens, stages, story cards), write the stage list with durations,
then drive it with one `[data-vx-sequence]` and a player (Run · Pause · Step · speed · Reset). Nothing auto-plays.

### 2. Start from a file, never from a blank page

- Look at the matching `examples/*.html` first — copy its structure and density.
- New page: `python3 scripts/scaffold.py --shell sidebar --theme indigo --title "Acme — Orders" --out <path>`
  (no Python? copy `templates/<shell>.html` and the `assets/` folder next to it, fix the `../assets/` paths).
- Inside an existing React/Vue/Svelte/Next app: read `references/framework-port.md` — import
  `vista.css` once and keep the same class names.

### 3. Compose the page with the standard anatomy

```
page-head   eyebrow/breadcrumb · H1 (greeting or page name) · one-line summary · actions (seg + ghost + CTA)
KPI row     4 stat cards (5 max) — icon chip, label, big number, delta badge, caption or sparkline
main split  2fr chart card  +  1fr side card (donut / gauge / live feed / insights)
detail      table, card grid, list or inbox — the thing the user actually works on
```

Recipes for overview, analytics, list/table, card gallery, inbox/support, goals, settings and team
pages are in `references/layouts.md`. Component HTML is in `references/components.md`.

### 4. Write real content

- Realistic, specific data: `$16,477`, `2.32%`, `#11214 · Noah Larsen`, `Closed Oct 28` — never "Lorem", "Item 1", `$XXX`.
- Greeting H1 on home pages ("Good afternoon, <em>Nora</em>"); summary line with **bold counts** of what needs attention.
- Every number gets context: a delta badge (`vx-delta--up/down`) and/or a caption ("vs $16,044 last period").
- Status = colored pill (`vx-status--success|warn|danger|info|neutral`), people = initials avatar with a pastel tint.
- Icons from Lucide names (`house`, `shopping-bag`, `chart-no-axes-column`, `users`, `settings`…). No emoji (they render as boxes in many environments).

### 5. Charts

Declarative: `<div class="vx-chart" style="--h:240px" data-vx-chart="bar" data-vx='{…json…}'></div>`.
Colors come from `--vx-chart-1..6` of the active theme. Full options: `references/charts.md`.

### 6. Motion

Keep `<script src="…/vista-motion.js"></script>` in `<head>` (templates already do). That alone gives the
choreographed entrance, scroll reveal, count-up, chart draw-in and sliding active pills. Then add
motion **where it explains something** (`references/motion.md`):

- pick the level on `<html data-vx-motion="subtle|standard|expressive">` — calm products (finance, health,
  data entry) → `subtle`; demos / consumer → `expressive`; default `standard`.
- `vx-glow` on the KPI cards and hero cards (light follows the cursor); `vx-tilt` on at most one or two hero cards.
- every async action gets feedback: `data-vx-loading` / `VistaMotion.loading` → `data-vx-toast` / `VistaMotion.toast`.
- period/metric switches: `data-vx-swap="#chart-id"` on the segmented control (chart replays).
- live data: `VistaMotion.insert` / `remove` / `countTo` — never re-render a whole list.
- slow loads: `vx-skeleton--*` then `VistaMotion.swap` to the content.
- new data in a chart: `VistaCharts.update(el, {series})` or `data-vx-patch` on the period options → shapes morph.
- live numbers: `data-vx-odometer` (digits roll on the compositor) + `countTo`.
- details / edit forms: `<dialog class="vx-drawer|vx-modal|vx-sheet">` + `data-vx-open="#id"`; global search: ⌘K
  palette (`dialog.vx-cmdk[data-vx-cmdk]`); reorderable things: `data-vx-sortable="group"` + `vx:sort`.
- touch / tactile: `vx-ripple` on big buttons and tiles; `vx-magnetic` on the one hero CTA.

### 7. Verify visually — mandatory when you can run code

```
python3 scripts/screenshot.py path/to/page.html --full      # writes page-1440.png (end state of all motion)
python3 scripts/screenshot.py path/to/page.html --frames 0,150,300,500,900   # entrance filmstrip
python3 scripts/screenshot.py path/to/page.html --perf     # frames (live blur vs lite glass), script & layout cost
```
Open the PNG and compare with the example of the same theme. Fix anything on
`references/checklist.md` (overflowing text, empty charts, cramped cards, console errors).
Also check at `--width 1100` and `--width 390` when the page will be used on smaller screens.
If Playwright is missing: `pip install playwright && python -m playwright install chromium`
(Linux without root and Chromium fails on a missing `libnspr4.so`/`libnss3.so`/…: `apt-get download` those
packages, `dpkg -x` them into a folder and export `LD_LIBRARY_PATH=<folder>/usr/lib/x86_64-linux-gnu`).
If it cannot run at all, re-read the checklist line by line instead.

### 8. Deliver

- Multi-file project: page + `vista-assets/` folder (scaffold does this).
- Single file (chat artifact, email, preview): `python3 scripts/bundle.py page.html -o page.single.html`.
- Tell the user which theme/shell you used and how to switch (`<html data-theme="…">`), and the motion
  level (`<html data-vx-motion="…">`).

## Non-negotiables (what makes the style work)

1. **Layering**: backdrop → chrome (sidebar/topbar, blurred) → one big panel (radius 36) → cards (radius 22). Never put cards directly on the backdrop.
2. **Glass is subtle**: translucent white fills + 1px light border + soft long shadow. Don't add extra blur/opacity hacks on cards; tokens already handle it.
3. **One dark CTA** per area (`vx-btn--cta`), secondary actions are light pills. Segmented controls for period switches.
4. **Typography**: Plus Jakarta Sans; H1 34–40px/700/-0.03em; stat values 28–34px/700 tabular; labels 12.5px/600; captions 12px muted. Uppercase micro-labels with letter-spacing for eyebrows, table heads and nav sections.
5. **Rhythm**: 16px gaps between cards, 20px card padding, 36px panel padding. Align card heights in a row (grid does it).
6. **Color discipline**: neutral glass + one accent (theme primary) + semantic green/red/amber only for meaning.
7. **Use classes and tokens, not inline colors.** If something is missing, add a small class in a `<style>` block that uses `var(--vx-…)` tokens.
8. **Motion has meaning and one rhythm.** Only transform/opacity, durations and easings from the `--vx-dur-*` / `--vx-ease-*` tokens, arrive with ease-out and leave faster, springs for things the user moves. No decorative loops. `prefers-reduced-motion` must still show every final state.
9. **Smooth on weak hardware.** Never move, scale or animate anything that has `backdrop-filter` (fade it, move its content); keep `data-vx-glass` on `auto` so slow devices get lite glass; coalesce pointer/scroll handlers to one write per frame; read layout before writing it. Details: `references/motion.md` §7.

## Reference map (load on demand)

| Need | Read |
|---|---|
| Why it looks this way, do/don't | `references/design-language.md` |
| Theme tokens, choosing a theme, brand themes, generator, dark mode | `references/themes.md` |
| 53 palettes by mood (minimal, warm, cool, vivid, modern) | `references/palettes.md` (+ `palettes.json`) |
| HTML for every component | `references/components.md` |
| Shells + page recipes | `references/layouts.md` |
| Chart types & options | `references/charts.md` |
| Motion: tokens, entrance, patterns, recipes, performance, a11y | `references/motion.md` |
| Walkthroughs: explain a process step by step (traces, handshakes, tours, timings) | `references/walkthroughs.md` |
| React / Next / Vue / Tailwind | `references/framework-port.md` |
| Final QA | `references/checklist.md` |
