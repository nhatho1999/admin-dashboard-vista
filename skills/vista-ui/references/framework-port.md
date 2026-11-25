# Using Vista UI inside a framework

The CSS is framework-agnostic: keep the `vx-` class names and import the stylesheet once.

## React / Next.js
1. Copy `assets/vista.css`, `assets/vista-charts.js` into the project (e.g. `src/styles/vista.css`, `src/lib/vista-charts.js`).
2. Import CSS globally (`app/layout.tsx` or `main.tsx`): `import "@/styles/vista.css";`
3. Set theme on `<html data-theme="indigo">` in the root layout.
4. Icons: `npm i lucide-react` → `<Search size={16} />` instead of `<i data-lucide>` (drop `lucide.min.js` and `vista.js`).
5. Fonts: `next/font/google` → `Plus_Jakarta_Sans` and set `--vx-font` on `<html>`, or keep the `<link>`.
6. Use `className` everywhere, e.g. `<section className="vx-card">`.

Chart wrapper (SSR-safe — the library touches `window`, so load it inside the effect):
```tsx
"use client";
import { useEffect, useRef } from "react";

type Props = { type: "bar"|"line"|"area"|"donut"|"gauge"|"ring"|"sparkline"; config: any; height?: number; className?: string };
export function VxChart({ type, config, height = 240, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(config);
  useEffect(() => {
    let alive = true;
    import("@/lib/vista-charts.js").then(() => {          // attaches window.VistaCharts once
      if (alive && ref.current) (window as any).VistaCharts.render(ref.current, type, config);
    });
    return () => { alive = false; };
  }, [type, key]);
  return <div ref={ref} className={`vx-chart ${className}`} style={{ ["--h" as any]: `${height}px` }} />;
}
```
Toggle groups: manage `is-active` with state instead of `vista.js`:
```tsx
<div className="vx-seg">{["7D","30D","90D"].map(p =>
  <button key={p} className={p === period ? "is-active" : ""} onClick={() => setPeriod(p)}>{p}</button>)}</div>
```
Reusable pieces worth extracting: `<Shell>`, `<PageHead>`, `<StatCard>`, `<Card title caption actions>`, `<StatusPill>`, `<Avatar>`.

## Vue / Nuxt
Same CSS import; chart wrapper with `onMounted(() => VistaCharts.render(el.value, type, config))`
and `watch(() => config, …, { deep: true })`. Icons: `lucide-vue-next`.

## Svelte / SvelteKit
`use:` action: `export function vxChart(node, {type, config}) { VistaCharts.render(node, type, config); return { update: p => VistaCharts.render(node, p.type, p.config) }; }`

## Tailwind projects
Keep `vista.css` for components and expose tokens to Tailwind (v3 `tailwind.config.js`):
```js
theme: { extend: {
  colors: { ink: "var(--vx-ink)", "ink-2": "var(--vx-ink-2)", "ink-3": "var(--vx-ink-3)",
            primary: "var(--vx-primary)", accent: "var(--vx-accent)", line: "var(--vx-line)",
            pos: "var(--vx-pos)", neg: "var(--vx-neg)", warn: "var(--vx-warn)" },
  borderRadius: { card: "22px", panel: "36px" },
  fontFamily: { sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"] } } }
```
Tailwind v4: put the same under `@theme { --color-ink: var(--vx-ink); … }`.
Use utilities for layout/spacing and `vx-*` classes for surfaces (glass effects are hard to
reproduce with utilities alone). If the project forbids global CSS, translate the needed classes
1:1 into `@layer components { .vx-card { … } }`.

## shadcn/ui projects
Map shadcn variables to Vista tokens in `globals.css` so existing components match:
```css
:root { --background: transparent; --foreground: var(--vx-ink); --card: rgba(255,255,255,.55);
        --primary: var(--vx-primary); --muted-foreground: var(--vx-ink-3); --border: var(--vx-line); --radius: 1.1rem; }
```
Older shadcn versions store colors as bare HSL channels (`222 47% 11%`) — there, convert the token values to HSL instead of using `var()`.
