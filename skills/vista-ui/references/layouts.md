# Layouts

## Shells

### Sidebar shell (`lagoon`, `indigo`) — `templates/sidebar.html`
```
┌──────────┐ ┌──────────────── topbar (pill: search ⌘K · icon buttons · user) ─┐
│ brand    │ └──────────────────────────────────────────────────────────────────┘
│ SECTION  │ ┌──────────────── panel ───────────────────────────────────────────┐
│ • item   │ │ page head                                                         │
│ • item 3 │ │ KPI row                                                           │
│ SECTION  │ │ split                                                             │
│ …        │ │ detail                                                            │
│ plan bar │ │                                                                   │
└──────────┘ └───────────────────────────────────────────────────────────────────┘
```
`<div class="vx-shell--sidebar"> <aside class="vx-sidebar vx-chrome"> <header class="vx-topbar vx-chrome"> <main class="vx-panel">`
- 3–4 nav sections, 3–5 items each, uppercase section labels, count badges on items with pending work.
- Sidebar foot: a usage/plan card with a progress bar.
- ≤1100px collapses to an icon rail; ≤760px hides the sidebar.

### Notch shell (`evergreen`) — `templates/notch.html`
Dark frame with a solid white panel; nav items are separate pills; the active one widens and
merges into the panel. The top bar lives *inside* the panel (`vx-panel__bar`: date chip · search · bell · + button).
Sidebar foot: quota ring card, Settings / Help pills, user row.

### Spatial shell (`aurora`) — `templates/spatial.html`
Floating window over a scene. Top pill (avatar · "Welcome, Kai" · assistant prompt with orb · mic),
left vertical icon rail, bottom tab dock with a `+` button. No sidebar: navigation = dock tabs.
Use `.vx-scene` for a CSS-only room, or a real photo on `html`.

### Topnav shell (`marina`, `lapis`, `graphite`) — `templates/topnav.html`
```
┌ brand · Overview · Board · Calendar · Docs (sliding pill) ········ [Search ⌘K] (bell) (avatar) ┐  sticky glass bar
┌──────────────────────────── panel (full width) ─────────────────────────────────────────────────┐
│ page head · KPI row · wide content (board, calendar, big table, timeline)                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```
`<div class="vx-shell--topnav"> <header class="vx-topnav vx-chrome"> … <main class="vx-panel">`. Use when content needs
width (kanban, week calendar, wide tables) or the app has ≤ 6 top-level areas. The search pill opens the ⌘K palette.
≤1100px hides the search pill; ≤760px nav items become icons.

### Auth shell (any theme) — `templates/auth.html`
Two columns: glass brand side (logo, one strong customer quote, 2–3 proof numbers or a tiny chart) + the panel
with the form (H1, sub, SSO buttons, divider, fields, remember/forgot, one CTA, sign-up link). ≤1100px the side hides.
Multi-step flows (2FA, onboarding): swap the form content with `VistaMotion.swap(form, update)`.

## Page recipes

Each recipe lists sections top → bottom. `split` = `vx-split` (2:1).

### Home / overview
1. Page head: eyebrow date + status pill, greeting H1 with accent name, summary with bold counts, period seg + Customize.
2. Quick actions (`vx-quick`, 6 items) **or** insights strip.
3. split: main chart card (value + delta + legend + bar/line) | dark live-feed card or donut breakdown.
4. KPI row (4, with sparklines).
5. split: "to do" table (orders to ship, approvals) | breakdown card (donut + meters).

### Analytics / reports
1. Page head with breadcrumb eyebrow (`Grow / Analytics`), date-range subtitle, `7D | 30D | 90D` seg + Export.
2. KPI row of 5 (`vx-grid-5`) each with full-width sparkline.
3. Underline tabs (`vx-tabs`): Overview · Products · Channels.
4. split: line chart "this period vs before" (dashed comparison) | "What stands out" list of 4–5 insights with icon chips.
5. split--even: category donut + meters | conversion funnel (stack of `vx-progress--lg` with labels) or leaderboard list.

### List / table (orders, payouts, members)
1. Page head with count summary + CTA.
2. KPI row (4 small stats: Open · Urgent · Waiting · First reply).
3. Card with toolbar: search + chips filter (`Everyone 6 · Owner 1 · Admin 1…`) + seg + select.
4. `vx-table` with person cells, status pills, right-aligned amounts, row action buttons.
5. Optional right column (split): seats/usage card + roles list.

### Card gallery (moderation, products, listings)
1. Page head + "Review rules" secondary + "Approve ready ones" CTA.
2. Toolbar row: search input · seg with counts (In review 6 / Approved / Rejected) · seg (All / Sale / Rent).
3. `vx-grid-4` of media cards; end with a `vx-add-tile` if users can create.

### Inbox / support
1. KPI row (Open · Urgent & high · Waiting on customer · First reply time).
2. split--rev (1:2): left card = underline tabs with counts + search + `vx-list--boxed` of tickets (avatar, subject, preview, priority tag, time);
   right card = ticket header (status tag, ID, title, `Mark solved` CTA) + fields row (Priority select, Assignee) + customer summary box + `vx-chat` + reply input.

### Goals / targets
1. KPI row of status counts (On track · At risk · Behind · Done) with tinted icon chips.
2. Chips filter row.
3. `vx-grid-3` goal cards: ring/gauge on the left, `NOW / TARGET` stacked values on the right, status tag, footer with days left + projection.
   (aurora variant: `vx-grid-5` of compact ring cards + add tile.)

### Settings
1. Page head.
2. Card "Appearance": theme swatches (`data-vx-theme-switch`) as selectable cards; a slider/progress row.
3. split--even of form cards: `vx-field` label + `vx-select` / `vx-input`; toggle rows (`vx-list__item` + `vx-switch`).
4. Danger zone card with a red ghost button.

### Announcements / feed
1. Page head + CTA. 2. `vx-seg vx-seg--block` filter with counts.
3. Stack of cards: title + status tag right, body text, footer row with audience tag, date, read-progress bar, actions (Pin, Send now, delete icon).

### Board / sprint (kanban)
1. Page head: sprint name + dates, summary with bold counts, seg (Board / List / Timeline), filter, CTA "New task" (opens a drawer).
2. KPI row with `data-vx-odometer` values (open, done points, cycle time, blocked).
3. `vx-board` with 3–5 columns (`.vx-card.vx-board__col`), 3–6 cards each, `+ Add card` (`data-vx-fixed`) last.
4. split: burndown line (ideal dashed vs actual) | activity list or workload meters.
Example: `examples/marina-project-board.html`.

### Calendar / scheduling
1. Page head: "This week", bold counts (meetings, hours, conflicts), Day/Week/Month seg, prev/next, CTA "New meeting" (sheet).
2. `vx-split--rev`: left stack (mini month, today's agenda, time breakdown donut) | week `vx-cal` with now-line.
3. Event click → modal with details; KPI row under or above.
Example: `examples/lapis-team-calendar.html`.

### Live console (deploys, incidents, trading, logistics)
1. Page head with `vx-live` pill; period seg whose options carry `data-vx-patch` (chart morphs).
2. KPI row with odometers updated by `countTo` every few seconds (pause when the tab is hidden).
3. split: morphing area chart | live feed (`VistaMotion.insert` / `remove`).
4. Table with row actions → confirm modal → toast with Undo.
Example: `examples/graphite-deploy-console.html`.

### Sign in / sign up / 2FA
Auth shell; after the CTA's loading state, swap to the next step (OTP inputs) instead of navigating.
Example: `examples/indigo-sign-in.html`.

### Walkthrough / "how it works"
1. Page head that names the process and its headline numbers (median time, success rate).
2. One `[data-vx-sequence]` spanning a split: run trace with player + stepper | device mockup with `.vx-screens` (or a
   `.vx-seq` handshake). Steps switch screens (`data-vx-screen`) and spotlight the control that acts next.
3. Optional second, smaller sequence (handshake diagram) with `data-vx-autoplay`.
Example: `examples/orchid-agent-walkthrough.html`. Planning and timings: `walkthroughs.md`.

## Responsive rules (built in)
- `vx-grid-4/5` → 2/3 columns at ≤1100–1280px, 1 column at ≤760px.
- `vx-split*` → single column at ≤1100px.
- Sidebar → icon rail (≤1100px) → hidden (≤760px). Spatial rail + prompt hidden on mobile; dock scrolls.
- Topnav: search pill hidden ≤1100px, icon-only nav ≤760px. Auth: brand side hidden ≤1100px.
- Board scrolls horizontally; calendar keeps a 720px minimum inside `.vx-cal-wrap` (scrolls on phones);
  drawers become full-screen ≤760px.
- For mobile-first apps, also add a bottom dock (`vx-spatial__dock` works in any shell).
