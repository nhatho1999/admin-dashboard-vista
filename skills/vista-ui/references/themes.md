# Themes

Set the theme on the root element: `<html data-theme="…">` — 10 built-in themes below, or generate one
from any palette (53 curated ones in `palettes.md`) with `scripts/palette_theme.py`.
Live preview of all ten on one screen: `examples/theme-gallery.html`.
Live switch: any element with `data-vx-theme-switch="indigo"` (handled by `vista.js`; charts re-render).

| Theme | Backdrop | Chrome | Panel | Accent / CTA | Best shell |
|---|---|---|---|---|---|
| `lagoon` | deep teal → cyan glow | dark translucent glass, white text | pale aqua glass | cyan active nav, **black** CTA | sidebar |
| `indigo` | navy → royal blue | navy glass, white text | lavender glass | blue active nav, **blue** CTA, accent name in H1 | sidebar |
| `aurora` | warm room (beige/brown, window light) | light glass, dark text | warm smoky glass | teal + orange, **black** CTA, white active pills | spatial |
| `evergreen` | dark forest green, mint glow on top | transparent, pill items | **solid off-white** | green gradient CTA, mint charts | notch |
| `graphite` | charcoal, faint lime + teal haze | near-invisible dark glass | **dark smoked glass** (true dark mode) | electric-lime nav, CTA and accent; teal second series | sidebar |
| `terracotta` | ember brown, orange glow | warm dark glass, cream text | **solid cream** (notch-ready) | burnt-orange gradient CTA, sand + slate charts | notch / sidebar |
| `lapis` | midnight lapis with plum/magenta glow | navy glass | ivory glass | lapis CTA, magenta accent + nav, gold second series | sidebar |
| `orchid` | violet → pink with a sky glow | violet glass | lavender glass | violet gradient CTA, pink nav, lavender comparison | sidebar |
| `opaline` | pearl grey with coral + aqua haze | **light** glass, dark text | white glass | black CTA + nav, coral accent and charts | spatial / sidebar |
| `marina` | harbour navy, sky haze | navy glass | sand-cream glass | navy CTA, cream nav pill, brown accent | sidebar |

Which one?
| Product mood | Theme |
|---|---|
| Ops, B2B control centre, calm/techy | `lagoon` |
| E-commerce, SaaS analytics, energetic | `indigo` |
| Consumer finance, lifestyle, spatial demo | `aurora` |
| CRM, sales, health — clean & trustworthy | `evergreen` |
| Developer tools, monitoring, analytics at night, gaming | `graphite` |
| Restaurants, hospitality, crafts, interiors | `terracotta` |
| Wealth, luxury, legal, galleries | `lapis` |
| Creator tools, support desks, social, AI products | `orchid` |
| Settings, billing, minimal SaaS, design tools | `opaline` |
| Travel, maritime, logistics, real estate | `marina` |
| Brand colours given | generate with `palette_theme.py "#hex,#hex,…"` |

## Token reference

Semantic tokens (defined per theme in `assets/vista.css`):

| Token | Role |
|---|---|
| `--vx-page` | body backdrop (gradient stack) |
| `--vx-ink`, `--vx-ink-2`, `--vx-ink-3` | text: primary, secondary, muted (on panel/cards) |
| `--vx-on-dark`, `--vx-on-dark-2`, `--vx-on-dark-3` | text on chrome (sidebar/topbar) |
| `--vx-chrome-bg`, `--vx-chrome-border`, `--vx-chrome-hover` | sidebar/topbar glass |
| `--vx-panel-bg`, `--vx-panel-border`, `--vx-panel-shadow` | the big page sheet |
| `--vx-panel-solid` | (evergreen) solid color used by the notch corners — must equal the panel color |
| `--vx-card-bg`, `--vx-card-border`, `--vx-card-shadow` | cards |
| `--vx-sunken` | inset areas: table head, inputs, segmented track, chips |
| `--vx-line` | dividers |
| `--vx-primary`, `--vx-primary-ink`, `--vx-primary-soft` | accent fill, its text, tinted background |
| `--vx-cta`, `--vx-cta-ink` | main call-to-action button |
| `--vx-accent` | highlighted text (greeting name, bold counts, eyebrow) |
| `--vx-nav-active-bg`, `--vx-nav-active-ink` | active sidebar item |
| `--vx-chart-1 … --vx-chart-6` | chart palette (1 = primary series, 2 = comparison) |
| `--vx-chart-grid`, `--vx-chart-muted` | grid lines, tracks |
| `--vx-pos/neg/warn/info` (+ `-soft`) | semantic colors (shared) |

Primitive tokens (shared): radii `--vx-r-xs…2xl`, `--vx-gap`, `--vx-pad`, `--vx-panel-pad`,
`--vx-blur`, font sizes `--vx-fs-*`, `--vx-font`.

## Theme from a palette (generator)

```
python3 scripts/palette_theme.py --list                       # browse the 53 palettes (mood, mode, closest theme)
python3 scripts/palette_theme.py 21 --name fireside --out fireside.css
python3 scripts/palette_theme.py "#0F4C81,#F2E8DC,#E07A5F" --name acme --mode dark-chrome
python3 scripts/palette_theme.py 24 --preview out/check.html   # example page in that theme → screenshot.py it
```
It assigns roles (backdrop from the darkest colour, accent from the most vivid, comparison series from
the most different one), builds every `--vx-*` token for the chosen mode (`dark-chrome` · `light` ·
`dark`), adds the component fixes light/dark modes need, darkens accent/CTA until text passes 4.5:1, and
prints a contrast report in the CSS header. Paste the output in a `<style>` after `vista.css`.
`--primary "#hex"` forces the accent; `--cta dark|primary` picks the CTA style.

## Brand / custom theme by hand

Copy the closest theme block, rename it and change only what the brand needs — usually
backdrop, accent, CTA, nav-active and chart-1/2:

```html
<style>
[data-theme="acme"] {
  /* start from indigo */
  --vx-page: radial-gradient(900px 700px at 100% 100%, #ff7a45 0%, transparent 60%),
             linear-gradient(140deg, #2a0f3d 0%, #6b1f6e 55%, #c2410c 100%);
  --vx-primary: #f97316; --vx-primary-soft: rgba(249,115,22,.14);
  --vx-cta: #f97316; --vx-accent: #ea580c;
  --vx-nav-active-bg: linear-gradient(180deg,#fb923c,#ea580c);
  --vx-chart-1: #f97316; --vx-chart-2: #a8a29e;
}
</style>
<html data-theme="acme"> …
```
Tokens you don't set fall back to **lagoon** (it is the `:root` default). To build on another
theme (e.g. indigo's navy chrome and lavender panel), copy that theme's whole block (≈45 lines)
from `vista.css` into your `<style>` (loaded after `vista.css`), rename the selector and edit.

Rules when tuning:
- Text on cards must reach 4.5:1 contrast; check `--vx-ink-3` on `--vx-card-bg` over the darkest backdrop area.
- Keep `--vx-chart-1` and `--vx-chart-2` clearly different in lightness (not only hue).
- Backdrop needs variation (2–4 radial gradients) or the glass looks flat; plain solid colors kill the effect.
- For a photo backdrop: `html{background:url(photo.jpg) center/cover fixed}` and raise card opacity a little.

## Dark mode

Use `graphite` (or `palette_theme.py … --mode dark`): it is a complete dark theme — dark panel and
cards, light ink, inverted pills, brighter semantic colours, dimmed glass highlights. Its fix rules
at the end of the theme section of `vista.css` show what a dark panel needs. Manual override for
another theme:
`--vx-panel-bg: rgba(15,18,30,.72); --vx-card-bg: rgba(255,255,255,.06); --vx-card-border: rgba(255,255,255,.1);
--vx-ink:#f4f6fb; --vx-ink-2:#b8bfd3; --vx-ink-3:#8790a8; --vx-sunken: rgba(255,255,255,.06); --vx-line: rgba(255,255,255,.08);`
and set `.vx-seg .is-active`/`.vx-chip.is-active` to a light pill.
