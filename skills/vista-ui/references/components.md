# Components

Copy-paste HTML. All classes live in `assets/vista.css`. Icons: `<i data-lucide="name"></i>`
(names at lucide.dev). Interactive groups need `data-vx-group` on the parent to toggle `.is-active`.

## Contents
Surfaces · Page head · Stat/KPI cards · Buttons · Segmented & tabs · Chips, badges, status ·
Inputs · Avatars & people · Tables · Lists · Progress & meters · Quick actions · Insights strip ·
Media cards · Feature & dark cards · Chat · Toggles · Add tile · Dialogs (modal, drawer, sheet) ·
Command palette · Board (kanban) · Calendar · Auth form · Walkthroughs · Motion & feedback · Utilities

---

## Surfaces
```html
<main class="vx-panel">…</main>                       <!-- the big page sheet, one per page -->
<section class="vx-card">…</section>                  <!-- standard card -->
<section class="vx-card vx-card--sunken">…</section>  <!-- inset box inside a card / quiet card -->
<section class="vx-card vx-card--flush">…</section>   <!-- no padding (images, maps) -->
<section class="vx-card vx-card--hover">…</section>   <!-- lifts on hover (clickable cards) -->
<div class="vx-chrome">…</div>                         <!-- blurred chrome glass (bars, rails) -->
```
Card header pattern:
```html
<div class="vx-card__head">
  <div class="vx-card__title"><h2 class="vx-h2">Agency commission</h2><div class="vx-caption">$236,700 from 37 deals</div></div>
  <div class="vx-seg" data-vx-group><button>3M</button><button class="is-active">6M</button></div>
  <button class="vx-btn vx-btn--sm vx-btn--cta"><i data-lucide="plus"></i>Record a deal</button>
</div>
```
Footer: `<div class="vx-card__foot"><span class="vx-caption">Updated 2 min ago</span><a class="vx-h3" href="#">View all</a></div>`

## Page head
```html
<div class="vx-page-head">
  <div class="vx-page-head__text">
    <div class="vx-eyebrow">Grow <span class="sep">/</span> Analytics</div>      <!-- or: Sunday, Nov 22 <span class="pill">● Store open</span> -->
    <h1 class="vx-h1">Good afternoon, <em>Nora</em></h1>                         <!-- add vx-h1--hero for 40px -->
    <p class="vx-sub"><b>11 orders</b> waiting to ship, <b>6 tickets</b> need a reply.</p>
  </div>
  <div class="vx-page-head__actions">
    <div class="vx-seg vx-seg--light" data-vx-group><button>7D</button><button class="is-active">30D</button><button>90D</button></div>
    <button class="vx-btn"><i data-lucide="download"></i>Export</button>
    <button class="vx-btn vx-btn--cta"><i data-lucide="plus"></i>New goal</button>
  </div>
</div>
```

## Stat / KPI cards
Basic (label row + value + caption):
```html
<div class="vx-card vx-stat">
  <div class="vx-stat__top">
    <span class="vx-iconchip"><i data-lucide="wallet"></i></span>
    <span class="vx-stat__label">Revenue</span>
    <span class="vx-delta vx-delta--up"><i data-lucide="trending-up"></i>2.7%</span>
  </div>
  <div class="vx-stat__value vx-num">$16,477<small>this month</small></div>
  <div class="vx-caption">vs $16,044 the 30 days before</div>
</div>
```
With edge-to-edge sparkline at the bottom: add
`<div class="vx-stat__spark" data-vx-chart="sparkline" data-vx='{"data":[3,4,3,5,6]}'></div>` as the last child.

Number-first (big number, title under it — lagoon style):
```html
<div class="vx-card vx-stat">
  <div class="vx-stat__top"><span class="vx-iconchip vx-iconchip--round"><i data-lucide="users"></i></span></div>
  <div class="vx-stat__value vx-num">11</div>
  <div class="vx-h3">Active people</div><div class="vx-caption">2 joined this month</div>
</div>
```
Split (value left, small sparkline right — evergreen style):
```html
<div class="vx-card vx-card--sunken vx-stat">
  <div class="vx-stat__top"><span class="vx-iconchip"><i data-lucide="target"></i></span><span class="vx-stat__label">Win rate</span></div>
  <div class="vx-stat--split">
    <div><div class="vx-stat__value vx-num">32.4<small>%</small></div>
         <div class="vx-stat__meta"><span class="vx-delta vx-delta--up"><i data-lucide="trending-up"></i>3.2 pts</span></div></div>
    <div class="vx-chart" style="--h:34px" data-vx-chart="sparkline" data-vx='{"data":[27,28,29,31,32],"area":false}'></div>
  </div>
</div>
```
Icon chip variants: `vx-iconchip--primary|pos|neg|warn|info|round|lg`.
Delta variants: `vx-delta--up|down|flat`.

## Buttons
```html
<button class="vx-btn vx-btn--cta"><i data-lucide="plus"></i>Invite</button>   <!-- main action (one per area) -->
<button class="vx-btn vx-btn--primary">Publish</button>                         <!-- accent filled -->
<button class="vx-btn">Activity log</button>                                     <!-- glass secondary -->
<button class="vx-btn vx-btn--light">Request</button>                            <!-- solid white -->
<button class="vx-btn vx-btn--ghost">Customize</button>                          <!-- text only -->
<!-- sizes: vx-btn--sm | vx-btn--lg ; vx-btn--block for full width -->
<button class="vx-iconbtn" aria-label="Help"><i data-lucide="life-buoy"></i></button>           <!-- on chrome -->
<button class="vx-iconbtn vx-iconbtn--light"><i data-lucide="bell"></i><span class="vx-ping"></span></button>
<button class="vx-iconbtn vx-iconbtn--ink vx-iconbtn--sm"><i data-lucide="more-horizontal"></i></button> <!-- on cards -->
<!-- also: vx-iconbtn--primary | --cta | --rainbow (assistant orb) -->
```

Also: `vx-btn--danger` (destructive confirm), `:disabled` / `aria-disabled="true"` dims and blocks a button; `vx-table--nowrap` keeps cells on one line (table scrolls).

## Segmented & tabs
```html
<div class="vx-seg" data-vx-group><button class="is-active">In review <span class="vx-count">6</span></button><button>Approved <span class="vx-count">24</span></button></div>
<div class="vx-seg vx-seg--light" data-vx-group>…</div>   <!-- white active pill instead of dark -->
<div class="vx-seg vx-seg--block" data-vx-group>…</div>   <!-- full width, equal segments -->
<div class="vx-tabs" data-vx-group><button class="is-active">Overview</button><button>Products</button></div>  <!-- underline tabs -->
```

## Chips, badges, status
```html
<div class="vx-chips" data-vx-group>
  <span class="vx-chip is-active">Everyone <span class="n">6</span></span><span class="vx-chip">Admin <span class="n">1</span></span>
</div>
<span class="vx-status vx-status--success">Active</span>   <!-- success | warn | danger | info | neutral ; add vx-status--plain for dot+text only -->
<span class="vx-tag vx-tag--warn"><i data-lucide="image-off"></i>More photos</span>  <!-- small square-ish label: --pos --neg --warn --primary -->
<span class="vx-live">Live</span>                          <!-- pulsing green dot -->
<span class="vx-count">7</span>                            <!-- tiny count pill -->
<span class="vx-flag" style="--c:#2f5bd8">$</span>         <!-- currency dot instead of emoji flags -->
```

## Inputs
```html
<label class="vx-search"><i data-lucide="search"></i><input placeholder="Search…"><span class="vx-kbd">⌘K</span></label>
<div class="vx-field"><label>Priority</label><div class="vx-select">Urgent <i data-lucide="chevron-down"></i></div></div>
<label class="vx-input"><i data-lucide="mail"></i><input placeholder="name@company.com"></label>
```

## Avatars & people
```html
<span class="vx-avatar vx-avatar--rose">SN</span>   <!-- rose | amber | lime | mint | sky | violet | peach | ink ; sizes --sm --lg -->
<span class="vx-avatar"><img src="…" alt=""></span>
<div class="vx-avatars"><span class="vx-avatar vx-avatar--sm vx-avatar--sky">A</span><span class="vx-avatar vx-avatar--sm vx-avatar--rose">B</span></div>
<div class="vx-person"><span class="vx-avatar vx-avatar--mint">AO</span><div><div class="vx-person__name">Amara Okafor</div><div class="vx-person__sub">Manager · amara@grove.io</div></div></div>
```

## Tables
```html
<div class="vx-table-wrap">
  <table class="vx-table">
    <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th class="r">Total</th></tr></thead>
    <tbody>
      <tr><td class="id">#11198</td>
          <td><div class="vx-person"><span class="vx-avatar vx-avatar--sm vx-avatar--rose">SN</span><div class="vx-person__name">Sofia Navarro</div></div></td>
          <td><span class="vx-status vx-status--danger">Late · 3d</span></td>
          <td class="r vx-num vx-strong">$212.40</td></tr>
    </tbody>
  </table>
</div>
```
Right-align numbers (`.r`), muted IDs (`.id`), bold totals, last column often a `vx-btn--sm` action.

## Lists
```html
<div class="vx-list">                     <!-- add vx-list--boxed for separate rounded rows -->
  <div class="vx-list__item">
    <span class="vx-iconchip"><i data-lucide="shopping-bag"></i></span>
    <div class="vx-list__body"><div class="vx-list__title">#11214 · Noah Larsen</div><div class="vx-list__sub">Cedar candle · 2 min ago</div></div>
    <div class="vx-list__end">$43.22</div>
  </div>
</div>
```

## Progress & meters
```html
<div class="vx-progress"><i style="--v:62%"></i></div>                                  <!-- --c to recolor; vx-progress--lg -->
<div class="vx-meter"><span><i class="vx-dot" style="color:var(--vx-chart-1)"></i>Travel</span>
  <div class="vx-progress"><i style="--v:36%;--c:var(--vx-chart-1)"></i></div><span>36%</span></div>
```
Rating spread = stack of `vx-meter` rows labelled 5★…1★.

## Quick actions
```html
<div class="vx-quick">
  <a class="vx-quick__item" href="#"><span class="vx-iconchip vx-iconchip--primary"><i data-lucide="truck"></i></span><div><b>Ship orders</b><span>11 waiting</span></div></a>
  …5 more
</div>
```

## Insights strip
```html
<div class="vx-insights">
  <div class="vx-insights__badge"><span class="vx-iconbtn vx-iconbtn--cta vx-iconbtn--sm"><i data-lucide="sparkles"></i></span>INSIGHTS</div>
  <div class="vx-insight"><span class="vx-iconchip vx-iconchip--warn"><i data-lucide="flame"></i></span>
    <div><b>4 deals</b> worth <b>$191K</b> close in 7 days<br><a href="#">Review <i data-lucide="arrow-right"></i></a></div></div>
  …3 more
</div>
```

## Media cards (listings, products, posts)
```html
<article class="vx-card vx-media vx-card--hover">
  <div class="vx-media__img"><img src="…" alt="…">
    <span class="vx-media__badge vx-glass-tag"><i data-lucide="clock"></i>In review</span>
    <span class="vx-media__badge-r vx-glass-tag"><i data-lucide="image"></i>14</span></div>
  <div class="vx-media__body">
    <div class="vx-media__price vx-num">$420,000</div><div class="vx-h3">4-bed penthouse over the bay</div>
    <div class="vx-row" style="margin-top:12px"><button class="vx-btn vx-btn--sm" style="flex:1">Review</button><button class="vx-btn vx-btn--sm vx-btn--cta" style="flex:1">Approve</button></div>
  </div>
</article>
```
Put them in `vx-grid-4` / `vx-grid-auto` (`style="--min:240px"`). Images: the user's own, or
Unsplash `https://images.unsplash.com/photo-<id>?w=600&q=70&auto=format&fit=crop`.

## Feature & dark cards
```html
<div class="vx-card vx-card--feature vx-stat">…</div>  <!-- gradient of --vx-chart-1, white text: highlight one KPI -->
<div class="vx-card vx-card--dark">…</div>             <!-- live feed, "up next", payment card -->
```
Use at most one feature card and one dark card per screen.

## Chat (support / inbox)
```html
<div class="vx-chat">
  <div class="vx-bubble">The mug has a small chip on the rim. Can I get a replacement?<div class="vx-bubble__meta">Ethan · 3 h ago</div></div>
  <div class="vx-bubble vx-bubble--me">So sorry about that! Could you confirm the colour?<div class="vx-bubble__meta">You · 2 h ago</div></div>
</div>
```

## Toggles
```html
<button class="vx-switch is-on" role="switch" aria-checked="true" aria-label="Round-ups"></button>
<button class="vx-check is-on" aria-label="Done"><i data-lucide="check" style="width:12px;height:12px"></i></button>
```

## Add tile
```html
<div class="vx-add-tile"><span class="vx-iconbtn vx-iconbtn--light"><i data-lucide="plus"></i></span>New goal<span class="vx-caption">Set a target and a date</span></div>
```

## Motion & feedback (needs `vista-motion.js`; full guide in `motion.md`)
```html
<div class="vx-card vx-stat vx-glow">…</div>                 <!-- cursor spotlight + lit border (KPI, hero cards) -->
<section class="vx-card vx-card--dark vx-tilt vx-glow" data-vx-tilt="5">…</section>   <!-- 3D tilt, 1–2 per screen -->
<div class="vx-stat__value vx-num" data-vx-count="off">Q4 2026</div>                  <!-- opt out of count-up -->
<div class="vx-seg" data-vx-group data-vx-swap="#revenue-chart">…</div>              <!-- replay chart on change -->
<button class="vx-btn vx-btn--cta" data-vx-loading="900" data-vx-toast="Report exported"
        data-vx-toast-sub="q3-report.pdf · 412 KB"><i data-lucide="download"></i>Export</button>
<button class="vx-btn" data-vx-toast="Link copied" data-vx-toast-tone="info">Share</button>   <!-- tones: success info warn danger -->
<section data-vx-reveal>…</section>                         <!-- scroll-reveal for non-card blocks -->
```
Skeletons (loading > ~1s), swapped for content with `VistaMotion.swap(box, update)`:
```html
<span class="vx-skeleton vx-skeleton--title"></span>                    <!-- --w to set width -->
<span class="vx-skeleton vx-skeleton--value" style="--w:60%"></span>
<span class="vx-skeleton vx-skeleton--text" style="--w:85%"></span>
<span class="vx-skeleton vx-skeleton--circle" style="--s:34px"></span>
<span class="vx-skeleton vx-skeleton--block" style="--h:160px"></span>    <!-- chart / image placeholder -->
```
Button busy state: `btn.classList.add("is-loading")` (or `VistaMotion.loading(btn, promise)`).
Toast from JS: `VistaMotion.toast("Invoice archived", {tone:"success", sub:"INV-0042", action:{label:"Undo", onClick}})`.
Gliders (the sliding active pill) are automatic on `.vx-seg`, `.vx-tabs`, sidebar / topnav `.vx-nav`, dock, rail and the command list.
```html
<div class="vx-stat__value vx-num" data-vx-odometer>48,212</div>      <!-- digits roll (count-up + countTo) -->
<button class="vx-btn vx-btn--cta vx-magnetic vx-ripple">Deploy</button>  <!-- leans toward cursor · ink ripple -->
<div class="vx-seg" data-vx-group data-vx-swap="#latency">               <!-- chart morphs to each option's data -->
  <button data-vx-patch='{"series":[{"name":"p95","data":[180,176,190,201]}]}'>1H</button> …
</div>
<section class="vx-card vx-defer">…long table below the fold…</section>  <!-- skip rendering until near -->
```

## Dialogs: modal · drawer · sheet (native `<dialog>`, opened by `vista-motion.js`)
```html
<button class="vx-btn" data-vx-open="#member">Edit member</button>
<dialog class="vx-modal" id="member" aria-labelledby="member-t">      <!-- or vx-drawer (right), vx-drawer vx-drawer--left, vx-sheet (bottom), vx-modal--lg -->
  <div class="vx-sheet__grip"></div>                                  <!-- sheets only -->
  <div class="vx-dialog__head">
    <div><div class="vx-eyebrow">Team</div><h2 class="vx-h2" id="member-t">Noah Larsen</h2></div>
    <button class="vx-iconbtn vx-iconbtn--sm" data-vx-close aria-label="Close"><i data-lucide="x"></i></button>
  </div>
  <div class="vx-dialog__body vx-stack">…fields, lists, cards…</div>
  <div class="vx-dialog__foot">
    <button class="vx-btn vx-btn--ghost" data-vx-close>Cancel</button>
    <button class="vx-btn vx-btn--cta" data-vx-close data-vx-toast="Member updated">Save</button>
  </div>
</dialog>
```
Esc and a backdrop click close with the exit animation. A `data-vx-open` inside an open dialog closes it
first (drawer → confirm modal). `<form method="dialog">` also animates out. JS: `VistaMotion.open("#member")`.

## Command palette (⌘K / Ctrl+K)
```html
<button class="vx-search" data-vx-open="#cmdk"><i data-lucide="search"></i><span>Search or jump to…</span><span class="vx-kbd">⌘K</span></button>
<dialog class="vx-cmdk" id="cmdk" data-vx-cmdk aria-label="Command palette">
  <div class="vx-cmdk__search"><i data-lucide="search"></i><input placeholder="Type a command or search…" aria-label="Search commands"></div>
  <div class="vx-cmdk__list" role="listbox">
    <div class="vx-cmdk__group">Jump to</div>
    <button class="vx-cmdk__item" role="option" data-keywords="money revenue"><span class="vx-iconchip"><i data-lucide="wallet"></i></span><span>Payouts<small>Balances and transfers</small></span><span class="vx-kbd">G P</span></button>
    <button class="vx-cmdk__item" role="option" data-vx-open="#invite"><span class="vx-iconchip"><i data-lucide="user-plus"></i></span><span>Invite teammate</span></button>
  </div>
  <div class="vx-cmdk__empty" hidden>No results — try another word.</div>
  <div class="vx-cmdk__foot"><span><span class="vx-kbd">↑↓</span>navigate</span><span><span class="vx-kbd">↵</span>open</span><span><span class="vx-kbd">esc</span>close</span></div>
</dialog>
```
Typing filters items by text + `data-keywords`; ↑↓ move the gliding highlight; Enter clicks the item; picking an
item closes the palette (add `data-vx-keep` to keep it open). Put links (`<a class="vx-cmdk__item" href>`) or buttons with
`data-vx-open` / `data-vx-toast` / your own click handlers in it.

## Board (kanban, drag & drop)
```html
<div class="vx-board">
  <section class="vx-card vx-board__col">
    <div class="vx-board__head"><span class="vx-dot" style="--c:var(--vx-chart-2)"></span>In progress<span class="vx-board__count">3</span></div>
    <div class="vx-board__list" data-vx-sortable="sprint">       <!-- same group name = cards can move between these lists -->
      <article class="vx-kcard" tabindex="0" data-id="HB-231">
        <div class="vx-kcard__tags"><span class="vx-tag">Billing</span><span class="vx-status vx-status--warn">High</span></div>
        <div class="vx-kcard__title">Migrate billing settings to the new form kit</div>
        <div class="vx-progress"><i style="--v:60%"></i></div>
        <div class="vx-kcard__meta"><span><i data-lucide="calendar"></i>Nov 29</span><span><i data-lucide="message-square"></i>4</span>
          <div class="vx-avatars"><span class="vx-avatar vx-avatar--sm vx-avatar--sky">NL</span></div></div>
      </article>
      <button class="vx-board__add" data-vx-fixed><i data-lucide="plus"></i>Add card</button>   <!-- data-vx-fixed: not draggable, stays last -->
    </div>
  </section>
</div>
```
Mouse/pen drag anywhere on the card (buttons/links/inputs inside are not grab areas); add a `[data-vx-handle]`
element to limit the grab area and to enable touch dragging. Keyboard: focus a card, Alt+↑↓ / Alt+←→. Esc cancels
a drag. Listen to `vx:sort` (`detail: {item, from, to, index}`) to update counts and save.

## Calendar (week view)
```html
<div class="vx-cal-wrap"><div class="vx-cal" style="--from:8;--hours:10">   <!-- 08:00–18:00; --hour sets the row height (52px) -->
  <div></div>                                                            <!-- corner -->
  <div class="vx-cal__day">Mon <b>24</b></div> … <div class="vx-cal__day is-today">Thu <b>27</b></div> …
  <div class="vx-cal__times"><span>08:00</span><span>09:00</span>…</div>
  <div class="vx-cal__col">
    <button class="vx-event vx-event--3" style="--s:9.5;--l:1.5" data-vx-open="#event"><b>Portfolio review</b><span>09:30 – 11:00 · Room 2</span></button>
  </div>
  <div class="vx-cal__col is-today"><div class="vx-cal__now" style="--t:14.33"></div>…</div>
  …7 columns…
</div></div>
```
`--s` = start hour (decimals: 9.5 = 09:30), `--l` = length in hours, `vx-event--2…6` = chart colours. `--days:5` for a
work week. Mini month picker: `<div class="vx-minical"><span>M</span>…<button class="is-muted">30</button><button class="is-active">27</button>…</div>`.

## Auth form
See `templates/auth.html`: `.vx-shell--auth` → `.vx-auth__side.vx-chrome` (brand, quote, proof numbers) +
`.vx-panel.vx-auth__main` → `.vx-auth__form` (H1, SSO buttons, `.vx-auth__divider`, `.vx-input--lg` fields, CTA).
Large inputs get a focus ring from `:focus-within`.

## Walkthroughs (run trace, sequence diagram, stepper, screens)
Full markup, timings and rules: `walkthroughs.md`. In short:
```html
<section class="vx-card" data-vx-sequence data-vx-done="Deployed">
  <div class="vx-player">…[data-vx-run="play|pause|step|reset"] · [data-vx-run-speed] seg · <span class="vx-run__status" data-vx-run-status></span></div>
  <ol class="vx-stepper"><li>Build</li><li>Test</li><li>Ship</li></ol>
  <ol class="vx-steps">
    <li class="vx-step" data-vx-step data-ms="700" data-vx-stage="0"><span class="vx-step__ico"><i data-lucide="package"></i></span>
      <details class="vx-step__body"><summary><span class="vx-step__name">Build image</span><span class="vx-step__sub">412 MB · cache hit 86%</span></summary><pre class="vx-code">…</pre></details>
      <span class="vx-step__meta"></span></li>
  </ol>
</section>
<div class="vx-seq"><div class="vx-seq__lanes"><span>App</span><span>API</span></div>
  <ol class="vx-seq__msgs"><li class="vx-seq__msg" data-vx-step data-from="1" data-to="2"><b>POST /login</b>email=…</li></ol></div>
<span class="vx-dots"><i></i><i></i><i></i></span>       <!-- inline "working" dots -->
```

## Theme swatches & palette strips
```html
<div class="vx-swatches" data-vx-group>   <!-- theme picker: live switch via vista.js -->
  <button class="vx-swatch is-active" data-vx-theme-switch="lapis"
          style="--sw:linear-gradient(140deg,#081849,#893172);--sw-panel:rgba(247,240,233,.94);--sw-accent:#893172">
    <div class="vx-swatch__view"></div><span>Lapis</span></button>
  …
</div>
<div class="vx-palette"><i style="--c:#213885"></i><i style="--c:#ECDFD2"></i><i style="--c:#893172"></i></div>
```
Swatch preview colours are the one place inline colours are fine (like flags). Copy the 10 built-in
swatches from `examples/opaline-workspace-settings.html`.

## Utilities
`vx-row` (flex, gap 10) · `vx-row--between` · `vx-stack` (column, gap 16) · `vx-grid-2/3/4/5` ·
`vx-grid-auto` (`--min`) · `vx-split` (2:1) · `vx-split--rev` (1:2) · `vx-split--even` · `vx-span-2` ·
`vx-span-all` · `vx-section` (top margin 16) · `vx-animate` (CSS-only staggered rise-in; superseded by `vista-motion.js`) ·
text: `vx-h1 vx-h2 vx-h3 vx-sub vx-caption vx-muted vx-soft vx-strong vx-accent vx-num` · `vx-dot` (colored dot via `color`).
