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
- [ ] `prefers-reduced-motion` respected (built in — don't add custom infinite animations).

## Delivery
- [ ] Assets resolve from the output location (or the file was bundled with `scripts/bundle.py`).
- [ ] Told the user the theme + shell used and how to switch theme.
