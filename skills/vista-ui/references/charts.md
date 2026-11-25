# Charts (`assets/vista-charts.js`)

Zero dependencies, SVG, theme-aware, responsive (re-renders on resize), hover tooltips.

```html
<div class="vx-chart" style="--h:240px" data-vx-chart="TYPE" data-vx='{ JSON CONFIG }'></div>
```
- Height comes from `--h` (default 240px); width fills the container.
- JSON must be valid (double quotes, no trailing commas). Long configs can go in a child
  `<script type="application/json">{…}</script>` instead of `data-vx`.
- JS API: `VistaCharts.render(el, "bar", cfg)`, `VistaCharts.renderAll(rootEl)` (call after injecting HTML).
- Colors: omit for palette order, or `"color": "chart-3"` (theme token), `"--my-var"`, or any CSS color.

## Common options (bar / line / area)
| Option | Default | Meaning |
|---|---|---|
| `labels` | — | x-axis labels; use `""` to skip a label (they are also auto-thinned to avoid overlap) |
| `series` | — | `[{ "name", "data": [..], "color"? }]` — `null` in data leaves a gap (line) |
| `yFormat` | `{}` | `{ "prefix":"$", "suffix":"K", "decimals":1, "compact":true }` — compact turns 12500 → 12.5K |
| `ticks` | 4 | horizontal grid lines |
| `max` / `min` | auto | y-range (auto max is rounded to a nice number) |
| `xAxis` / `yAxis` / `grid` | true | set `false` to hide |
| `padLeft` | 40 | room for y labels |
| `tooltip` | true | hover tooltip + guide line |

## bar
Extra: `stacked` (bool), `barRatio` (0–1 of slot, default .56), `radius`, `barWidth` (max px),
`highlight` (`"last"` or index — dims the others for single-series), `highlightColor`,
`highlightLabel` (`true` or text — pill above the bar), `refLine` (y value) + `refLabel` (pill text, e.g. `"Avg $553"`).
```json
{"labels":["Jun","Jul","Aug","Sep","Oct","Nov"],
 "series":[{"name":"Commission","data":[34800,33100,40200,37600,42900,41734]}],
 "yFormat":{"prefix":"$"},"barRatio":0.36,"highlight":"last","highlightLabel":"$41,734"}
```
Grouped = several series; stacked profit/loss:
`{"series":[{"name":"Loss","data":[…],"color":"chart-2"},{"name":"Profit","data":[…],"color":"chart-1"}],"stacked":true}`

## line / area
Series extra: `area` (gradient fill), `dashed`, `width`, `opacity`, `areaOpacity`. Chart extra:
`smooth` (default true — monotone curve, no overshoot), `endDot` (white dot on last point), `points` (force x-count).
`area` type = every series filled.
```json
{"labels":["Jan","Feb","Mar","Apr","May","Jun"],
 "series":[{"name":"Revenue","data":[92,104,98,126,133,148],"area":true},
           {"name":"Target","data":[100,108,116,124,132,140],"dashed":true,"color":"chart-2"}],
 "yFormat":{"prefix":"$","suffix":"K"}}
```
Projection: a third dashed series with `null`s until the last actual point.

## donut
`data: [{label, value, color?}]`, `center: {value, label}`, `thickness`, `gap` (degrees, default 3),
`round` (rounded caps, default true), `track` (grey ring, default true), `format` (tooltip value format; default %).
```json
{"data":[{"label":"Travel","value":36},{"label":"Shopping","value":26,"color":"chart-2"},{"label":"Software","value":20,"color":"chart-4"}],
 "center":{"value":"$209.7K","label":"Total spent"}}
```
Pair it with a legend list or `vx-meter` rows — the donut alone doesn't say which color is what.

## gauge (semicircle)
`max`, `segments: [{value, color}]` (stacked from the left), `thickness`, `center`.
```json
{"max":250,"segments":[{"value":171,"color":"chart-3"},{"value":45,"color":"chart-2"}],"center":{"value":"69%","label":"of quota closed"}}
```
Give it `--h` ≈ half its width (e.g. 130px in a 300px card).

## ring (progress circle)
`value`, `max` (100), `color`, `trackColor`, `thickness`, `label`, `center` (`{"value":""}` for none).
```json
{"value":74,"color":"chart-3","label":"saved","thickness":9}
```

## sparkline
`data`, `color`, `area` (default true), `width`, `smooth`. No axes/tooltip. Use inside
`.vx-stat__spark` (bleeds to card edges) or a small `.vx-chart` with `--h:34px`.

## Legend markup
```html
<div class="vx-legend"><span><i style="--c:var(--vx-chart-1)"></i>This period</span>
  <span><i class="dash" style="--c:var(--vx-chart-2)"></i>Target</span></div>
```

## Using another chart library
If the project already uses Recharts/Chart.js/ECharts, keep it, but read colors from CSS:
`getComputedStyle(document.documentElement).getPropertyValue('--vx-chart-1')`, use rounded bar
corners (6–8px), dashed light grid, no chart borders, 10.5px muted axis text, and a dark rounded tooltip.
