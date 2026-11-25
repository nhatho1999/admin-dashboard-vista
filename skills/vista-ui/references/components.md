# Components

Copy-paste HTML. All classes live in `assets/vista.css`. Icons: `<i data-lucide="name"></i>`
(names at lucide.dev). Interactive groups need `data-vx-group` on the parent to toggle `.is-active`.

## Contents
Surfaces · Page head · Stat/KPI cards · Buttons · Segmented & tabs · Chips, badges, status ·
Inputs · Avatars & people · Tables · Lists · Progress & meters · Quick actions · Insights strip ·
Media cards · Feature & dark cards · Chat · Toggles · Add tile · Utilities

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
Gliders (the sliding active pill) are automatic on `.vx-seg`, `.vx-tabs`, sidebar `.vx-nav`, dock and rail.

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
