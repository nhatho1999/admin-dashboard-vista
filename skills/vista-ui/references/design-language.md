# Design language

The style in one page. Use this when making a judgment call the
components don't cover.

## The five layers

```
┌ 0 BACKDROP ─ rich gradient (lagoon/indigo/evergreen) or a soft-focus room photo (aurora)
│ ┌ 1 CHROME ─ sidebar, topbar, rail, dock: blurred glass, light text on dark themes
│ │ ┌ 2 PANEL ─ one large rounded sheet (radius 36–40) that holds the page; lighter glass or solid white
│ │ │ ┌ 3 CARDS ─ radius 22, translucent white, 1px bright border, soft long shadow, inset top highlight
│ │ │ │ ┌ 4 CONTROLS ─ pills (radius 999): buttons, chips, segmented, badges, search
```

Each layer is lighter and more opaque than the one beneath it. Depth comes from that ladder,
not from heavy drop shadows.

## Shape
- Everything rounded, nothing sharp: panel 36, card 22, inner box 16, icon chip 10–13, controls fully pill.
- Nested radius rule: inner radius = outer radius − padding (e.g. image inside a card with 8px padding → 14px).
- Circles for avatars, icon buttons, rings, donut and gauges.

## Type
- One family (Plus Jakarta Sans, fallback Inter/system). Weights 500/600/700 only (800 for donut centers).
- Big numbers carry the page: 30px stat values, 40px hero H1 with tight tracking (-0.03em).
- Microcopy is small and muted (11–12.5px). Uppercase tracking-wide labels for: nav sections, eyebrow, table headers, form labels.
- Numbers are tabular (`.vx-num`), currency always formatted with separators.

## Color
- **Neutral glass first.** 80% of the surface is white-ish translucency or the panel tint.
- **One accent** per theme (cyan / blue / teal+orange / green) for active nav, highlights, primary chart series.
- **Dark CTA** (near-black pill) is the signature button in lagoon & aurora; indigo uses the blue primary; evergreen a green gradient pill.
- **Semantic colors only for meaning:** green up/success, red down/danger, amber pending/at-risk, blue info.
- Pastel avatar tints (rose, amber, lime, mint, sky, violet) bring warmth to tables and lists.
- Charts: primary series in accent, comparison series in a muted tone (grey-blue/black/mint).

## Density & rhythm
- 16px between cards, 20px card padding, 36px panel padding, 24px under the page head.
- KPI row of 4 equal cards → content split 2:1 → detail section. Repeat the split if needed.
- Cards in one row share height. Keep 1–3 lines of text per list row.
- A card has: title (15px/700) + caption, optional actions on the right, then content. Never a lone chart without a title.

## Signature details worth reproducing
- Greeting H1 with the name in the accent color + a sentence that counts what needs attention.
- Delta badges (`↗ 2.7%`) beside or under numbers.
- Pill segmented control for periods (`7 days | 30 days | 90 days`), active state = dark or white pill.
- Count pills inside segmented tabs (`In review 6`).
- Live/dark card for real-time feed beside a light chart card.
- Insights strip: 4 small cards with an icon chip, one bolded fact and a "Review →" link.
- Media cards with glass tags floating on the image (`In review`, `📷 14` → use `image` icon).
- Empty "add" tile with a dashed border at the end of a card grid.
- Bottom dock + left rail + top prompt bar for spatial (aurora) layouts.
- The notch: active sidebar pill flows into the white panel with concave corners (evergreen).

## Don't
- Don't put text directly on the backdrop except in chrome (sidebar/topbar/dock).
- Don't mix themes on one page or add new random colors; extend tokens instead.
- Don't use more than one filled CTA per toolbar.
- Don't use pure black text on glass (#0d1b22-ish ink is defined per theme).
- Don't use emoji as icons or flags; use Lucide or the `.vx-flag` currency dot.
- Don't make charts without axes context or legends when there are 2+ series.
- Don't stack more than ~3 levels of glass (panel → card → sunken box is the max).
