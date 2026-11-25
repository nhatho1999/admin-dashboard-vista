#!/usr/bin/env python3
"""Turn a colour palette into a complete Vista UI theme (all --vx-* tokens), with contrast checks.

Usage:
    python3 scripts/palette_theme.py --list                          # the 53 palettes in references/palettes.json
    python3 scripts/palette_theme.py 21                              # by id      -> CSS on stdout
    python3 scripts/palette_theme.py "rose quartz evening"           # by name
    python3 scripts/palette_theme.py "#213885,#ECDFD2,#893172" --name brand
    python3 scripts/palette_theme.py 24 --mode light --primary "#893172" --out brand.css
    python3 scripts/palette_theme.py 21 --preview out/fireside.html  # example page restyled with the theme
    python3 scripts/palette_theme.py --gallery                       # rebuild the library in examples/theme-gallery.html

Modes (default = the palette's suggested mode, or auto from the colours):
    dark-chrome  dark gradient backdrop, dark glass chrome, light glass panel   (lagoon/indigo look)
    light        light backdrop, light chrome, white glass, black CTA          (opaline look)
    dark         dark backdrop AND dark panel, glowing accent                  (graphite look)
Options: --primary HEX (force the accent), --cta dark|primary, --name SLUG (data-theme value).
Put the CSS in a <style> after vista.css and set <html data-theme="SLUG">. Read the contrast report
at the top of the output: anything marked LOW needs a manual tweak (usually --vx-accent or --vx-ink-3).
"""
import argparse
import colorsys
import json
import pathlib
import re
import sys

SKILL = pathlib.Path(__file__).resolve().parent.parent
PALETTES = SKILL / "references" / "palettes.json"


# ---------- colour helpers ------------------------------------------------------------------
def hex_rgb(h):
    h = h.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def rgb_hex(rgb):
    return "#" + "".join(f"{round(max(0, min(1, c)) * 255):02x}" for c in rgb)


def hls(h):
    return colorsys.rgb_to_hls(*hex_rgb(h))


def from_hls(hh, l, s):
    return rgb_hex(colorsys.hls_to_rgb(hh % 1, max(0, min(1, l)), max(0, min(1, s))))


def with_l(h, l, s=None):
    hh, _, ss = hls(h)
    return from_hls(hh, l, ss if s is None else s)


def lum(h):
    def ch(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in hex_rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def rgba(h, a):
    r, g, b = (round(c * 255) for c in hex_rgb(h))
    return f"rgba({r}, {g}, {b}, {a})"


def mix(a, b, t):
    return rgb_hex(tuple(x * (1 - t) + y * t for x, y in zip(hex_rgb(a), hex_rgb(b))))


def darken_until(h, bg, target):
    hh, l, s = hls(h)
    while contrast(from_hls(hh, l, s), bg) < target and l > 0.05:
        l -= 0.02
    return from_hls(hh, l, s)


def vividness(h):
    _, l, s = hls(h)
    return s * (1 - abs(l - 0.5) * 1.4)


def hue_dist(a, b):
    d = abs(hls(a)[0] - hls(b)[0])
    return min(d, 1 - d)


# ---------- palette lookup ------------------------------------------------------------------
def load():
    return json.loads(PALETTES.read_text(encoding="utf-8"))


def find(key):
    data = load()
    pals = [p for g in data["groups"] for p in g["palettes"]]
    if re.fullmatch(r"\d+", key):
        hit = [p for p in pals if p["id"] == int(key)]
    elif "#" in key:
        return {"id": None, "name": "custom", "colors": [c.strip() for c in key.split(",") if c.strip()], "mode": None}
    else:
        k = key.lower().strip()
        hit = [p for p in pals if p["name"].lower() == k] or [p for p in pals if k in p["name"].lower()]
    if not hit:
        sys.exit(f"palette not found: {key!r} (try --list)")
    return hit[0]


# ---------- theme builder -------------------------------------------------------------------
def build(pal, mode=None, primary=None, cta_style=None, name=None):
    cols = [c.upper() for c in pal["colors"]]
    by_l = sorted(cols, key=lambda c: hls(c)[1])
    darkest, lightest = by_l[0], by_l[-1]
    if not mode:
        mode = pal.get("mode") or ("dark-chrome" if hls(darkest)[1] < 0.42 else "light")

    # accent = most vivid colour (or forced); comparison = most different remaining colour
    acc = (primary or max(cols, key=vividness)).upper()
    rest = [c for c in cols if c != acc]
    if vividness(acc) < 0.12:                       # monochrome palette → keep a calm blue-grey accent
        acc = with_l(acc, 0.45, 0.25)
    hue = hls(acc)[0]
    base_h = hls(darkest)[0] if hls(darkest)[2] > 0.08 else hue
    base_s = min(0.55, max(0.18, hls(darkest)[2]))

    comp = max(rest, key=lambda c: hue_dist(c, acc) + abs(hls(c)[1] - hls(acc)[1]) * 0.6) if rest else with_l(acc, 0.75, 0.2)
    extras = sorted([c for c in rest if c != comp], key=vividness, reverse=True)

    def chart_tone(c):
        _, l, s = hls(c)
        return with_l(c, min(0.62, max(0.36, l)), max(s, 0.35))

    charts = [acc, comp]
    for c in extras:
        t = chart_tone(c)
        if all(hue_dist(t, x) > 0.04 or abs(hls(t)[1] - hls(x)[1]) > 0.18 for x in charts):
            charts.append(t)
    for d in ["#F5A524", "#22B573", "#E5574A", "#8B8FE8", "#2BB3C0", "#B27CF0"]:
        if len(charts) >= 6:
            break
        if all(hue_dist(d, x) > 0.06 for x in charts):
            charts.append(d)
    charts = (charts + ["#9AA2B6"] * 6)[:6]

    t = {}
    if mode == "dark":
        bg = from_hls(base_h, 0.06, base_s * 0.4)
        panel = from_hls(base_h, 0.15, base_s * 0.3)
        ink = from_hls(hue, 0.95, 0.06)
        t.update({
            "page": f"radial-gradient(900px 600px at 85% 110%, {rgba(acc, .16)} 0%, transparent 60%),\n    radial-gradient(700px 500px at 0% 0%, {from_hls(base_h, .18, base_s * .3)} 0%, transparent 70%),\n    linear-gradient(150deg, {bg} 0%, {from_hls(base_h, .09, base_s * .35)} 50%, {from_hls(base_h, .13, base_s * .35)} 100%)",
            "ink": ink, "ink-2": from_hls(hue, .74, .06), "ink-3": from_hls(hue, .58, .05),
            "on-dark": ink, "on-dark-2": rgba(ink, .62), "on-dark-3": rgba(ink, .38),
            "chrome-bg": "rgba(255, 255, 255, .04)", "chrome-border": "rgba(255, 255, 255, .09)", "chrome-hover": "rgba(255, 255, 255, .07)",
            "panel-bg": f"linear-gradient(165deg, {rgba(panel, .82)} 0%, {rgba(with_l(panel, .10), .76)} 100%)",
            "panel-border": "rgba(255, 255, 255, .08)", "panel-shadow": "0 40px 90px -30px rgba(0, 0, 0, .85)",
            "card-bg": "linear-gradient(180deg, rgba(255, 255, 255, .065), rgba(255, 255, 255, .03))",
            "card-border": "rgba(255, 255, 255, .08)",
            "card-shadow": "0 12px 30px -16px rgba(0, 0, 0, .6), inset 0 1px 0 rgba(255, 255, 255, .06)",
            "sunken": "rgba(255, 255, 255, .05)", "line": "rgba(255, 255, 255, .07)",
            "chart-grid": "rgba(255, 255, 255, .06)", "chart-muted": "rgba(255, 255, 255, .10)",
        })
        surface = panel
        acc_fill = acc if contrast(acc, bg) >= 3 else with_l(acc, 0.6)
        t["accent"] = acc_fill if contrast(acc_fill, surface) >= 4.5 else with_l(acc_fill, 0.7)
        charts[1] = from_hls(hls(comp)[0], .42, min(.25, hls(comp)[2]))
    else:
        if mode == "light":
            tint = lightest if hls(lightest)[1] > 0.88 else from_hls(hue, 0.96, 0.15)
            ink = from_hls(base_h if hls(darkest)[1] < .4 else hue, 0.11, 0.12)
            t.update({
                "page": f"radial-gradient(700px 500px at 90% 0%, {rgba(acc, .22)} 0%, transparent 65%),\n    radial-gradient(700px 600px at 0% 100%, {rgba(comp, .22)} 0%, transparent 65%),\n    linear-gradient(160deg, {with_l(tint, .97)} 0%, {with_l(tint, .91)} 55%, {with_l(tint, .86)} 100%)",
                "on-dark": ink, "on-dark-2": rgba(ink, .66), "on-dark-3": rgba(ink, .44),
                "chrome-bg": "rgba(255, 255, 255, .55)", "chrome-border": "rgba(255, 255, 255, .95)", "chrome-hover": "rgba(0, 0, 0, .05)",
                "panel-bg": "linear-gradient(170deg, rgba(255, 255, 255, .74), rgba(250, 250, 251, .56))",
                "panel-border": "rgba(255, 255, 255, .95)", "panel-shadow": f"0 30px 80px -30px {rgba(ink, .28)}",
                "card-bg": "rgba(255, 255, 255, .92)", "card-border": with_l(tint, .93),
                "card-shadow": f"0 1px 2px {rgba(ink, .04)}, 0 12px 28px -20px {rgba(ink, .22)}",
                "sunken": with_l(tint, .955), "line": with_l(tint, .925),
                "chart-grid": with_l(tint, .94), "chart-muted": with_l(tint, .91),
            })
            surface = "#F7F7F8"
        else:  # dark-chrome
            tint = lightest if hls(lightest)[1] > 0.86 else from_hls(hue, 0.95, 0.35)
            tint = with_l(tint, max(hls(tint)[1], .93))
            ink = from_hls(base_h, 0.13, min(.4, base_s))
            dark = from_hls(base_h, 0.11, base_s)
            t.update({
                "page": f"radial-gradient(1000px 700px at 90% 110%, {rgba(with_l(acc, .55), .62)} 0%, transparent 60%),\n    radial-gradient(800px 600px at 0% 0%, {from_hls(base_h, .06, base_s)} 0%, transparent 70%),\n    radial-gradient(600px 500px at 60% 35%, {rgba(with_l(comp, .4), .35)} 0%, transparent 70%),\n    linear-gradient(145deg, {dark} 0%, {from_hls(base_h, .2, base_s)} 50%, {mix(from_hls(base_h, .28, base_s), with_l(acc, .4), .45)} 100%)",
                "on-dark": with_l(tint, .97), "on-dark-2": rgba(with_l(tint, .94), .68), "on-dark-3": rgba(with_l(tint, .94), .42),
                "chrome-bg": rgba(dark, .38), "chrome-border": rgba(tint, .16), "chrome-hover": "rgba(255, 255, 255, .08)",
                "panel-bg": f"linear-gradient(165deg, {rgba(with_l(tint, .955), .92)} 0%, {rgba(with_l(tint, .92), .84)} 60%, {rgba(with_l(tint, .89), .78)} 100%)",
                "panel-border": "rgba(255, 255, 255, .6)", "panel-shadow": f"0 40px 90px -25px {rgba(from_hls(base_h, .05, base_s), .72)}",
                "card-bg": "linear-gradient(180deg, rgba(255, 255, 255, .74), rgba(255, 255, 255, .52))",
                "card-border": "rgba(255, 255, 255, .85)",
                "card-shadow": f"0 12px 30px -16px {rgba(ink, .32)}, inset 0 1px 0 rgba(255, 255, 255, .9)",
                "sunken": "rgba(255, 255, 255, .55)", "line": rgba(ink, .10),
                "chart-grid": rgba(ink, .09), "chart-muted": rgba(ink, .16),
            })
            surface = mix(with_l(tint, .94), "#FFFFFF", .35)
            t["_dark_card"] = f"linear-gradient(170deg, {from_hls(base_h, .2, base_s)} 0%, {from_hls(base_h, .1, base_s)} 100%)"
        t.update({"ink": ink, "ink-2": from_hls(hls(ink)[0], .33, min(.25, hls(ink)[2])),
                  "ink-3": darken_until(from_hls(hls(ink)[0], .52, min(.18, hls(ink)[2])), surface, 4.5)})
        t["accent"] = darken_until(acc, surface, 4.5)
        acc_fill = darken_until(acc, "#FFFFFF", 3.0)

    on_acc = "#FFFFFF" if contrast(acc_fill, "#FFFFFF") >= contrast(acc_fill, "#141414") else "#141414"
    t.update({
        "primary": acc_fill, "primary-ink": on_acc, "primary-soft": rgba(acc_fill, .12),
        "nav-active-bg": acc_fill if mode == "dark" else f"linear-gradient(180deg, {with_l(acc_fill, min(.8, hls(acc_fill)[1] + .08))}, {acc_fill})",
        "nav-active-ink": on_acc,
    })
    if mode == "light":
        t.update({"nav-active-bg": t["ink"], "nav-active-ink": "#FFFFFF"})
    style = cta_style or ("dark" if mode == "light" else "primary")
    if style == "dark" and mode != "dark":
        t.update({"cta": from_hls(hls(t["ink"])[0], .1, min(.3, hls(t["ink"])[2])), "cta-ink": "#FFFFFF"})
    else:   # the CTA carries body-size text → needs 4.5:1, stricter than the 3:1 accent fill
        if on_acc == "#141414" and contrast(acc_fill, on_acc) >= 4.6:
            t.update({"cta": acc_fill, "cta-ink": on_acc})
        else:
            t.update({"cta": darken_until(acc_fill, "#FFFFFF", 4.6), "cta-ink": "#FFFFFF"})
    # primary vs comparison series must differ in lightness, not only hue
    l1, l2 = hls(charts[0])[1], hls(charts[1])[1]
    if abs(l1 - l2) < .12:
        charts[1] = with_l(charts[1], min(.85, l1 + .26) if l1 < .55 else max(.3, l1 - .26))
    t["brand-mark"] = f"linear-gradient(140deg, {with_l(acc_fill, min(.78, hls(acc_fill)[1] + .12))}, {acc_fill})"
    for i, c in enumerate(charts, 1):
        t[f"chart-{i}"] = c

    slug = name or re.sub(r"[^a-z0-9]+", "-", pal["name"].lower()).strip("-")
    report = [
        ("ink on panel", contrast(t["ink"], surface), 7),
        ("ink-3 (muted) on panel", contrast(t["ink-3"], surface), 4.5),
        ("accent text on panel", contrast(t["accent"], surface), 4.5),
        ("CTA text on CTA", contrast(t["cta-ink"], t["cta"]), 4.5),
        ("chart-1 vs chart-2 (lightness gap)", abs(hls(charts[0])[1] - hls(charts[1])[1]) * 10, 1.2),
    ]
    return slug, mode, t, report


ORDER = ["page", "ink", "ink-2", "ink-3", "on-dark", "on-dark-2", "on-dark-3", "chrome-bg", "chrome-border",
         "chrome-hover", "panel-bg", "panel-border", "panel-shadow", "card-bg", "card-border", "card-shadow", "sunken",
         "line", "primary", "primary-ink", "primary-soft", "cta", "cta-ink", "accent", "nav-active-bg", "nav-active-ink",
         "brand-mark", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-grid", "chart-muted"]

DARK_FIXES = """[data-theme="{s}"] {{ --vx-pos: #4ade80; --vx-pos-soft: rgba(74, 222, 128, .14); --vx-neg: #f87171; --vx-neg-soft: rgba(248, 113, 113, .14);
  --vx-warn: #fbbf24; --vx-warn-soft: rgba(251, 191, 36, .14); --vx-info: #60a5fa; --vx-info-soft: rgba(96, 165, 250, .14); }}
[data-theme="{s}"] .vx-panel {{ box-shadow: var(--vx-panel-shadow), inset 0 1px 0 rgba(255, 255, 255, .08); }}
[data-theme="{s}"] :is(.vx-seg .is-active, .vx-chip.is-active, .vx-seg--light .is-active, .vx-btn--light, .vx-chart-pill--light) {{ color: #141414; }}
[data-theme="{s}"] .vx-chip.is-active {{ background: var(--vx-ink); }}
[data-theme="{s}"] .vx-btn {{ box-shadow: inset 0 1px 0 rgba(255, 255, 255, .07), 0 4px 12px -8px rgba(0, 0, 0, .6); }}
[data-theme="{s}"] :is(.vx-count, .vx-kbd) {{ background: rgba(255, 255, 255, .1); }}
[data-theme="{s}"] .vx-table tbody tr:hover {{ background: rgba(255, 255, 255, .04); }}
[data-theme="{s}"] .vx-switch {{ background: rgba(255, 255, 255, .16); }}
[data-theme="{s}"] .vx-add-tile {{ border-color: rgba(255, 255, 255, .18); background: rgba(255, 255, 255, .03); }}
[data-theme="{s}"] .vx-tooltip {{ background: #2a2a2a; border: 1px solid rgba(255, 255, 255, .1); }}
[data-theme="{s}"] .vx-card--dark {{ background: linear-gradient(170deg, rgba(255, 255, 255, .1), rgba(255, 255, 255, .02)); }}
[data-theme="{s}"] .vx-skeleton::after {{ background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .08), transparent); }}
"""
LIGHT_FIXES = """[data-theme="{s}"] .vx-plan {{ background: rgba(255, 255, 255, .6); }}
[data-theme="{s}"] .vx-plan .vx-progress {{ background: rgba(0, 0, 0, .08); }}
[data-theme="{s}"] .vx-plan .vx-progress > i {{ background: var(--vx-ink); }}
[data-theme="{s}"] .vx-nav__badge {{ background: rgba(0, 0, 0, .06); }}
[data-theme="{s}"] .vx-nav__item.is-active .vx-nav__badge {{ background: rgba(255, 255, 255, .2); }}
[data-theme="{s}"] .vx-iconbtn:hover {{ background: rgba(0, 0, 0, .05); }}
[data-theme="{s}"] :is(.vx-topbar, .vx-spatial__top) .vx-search {{ background: rgba(255, 255, 255, .7); }}
[data-theme="{s}"] .vx-card--dark {{ background: linear-gradient(170deg, #27272b 0%, #121214 100%); }}
[data-theme="{s}"] :is(.vx-spatial__dock, .vx-spatial__rail) .vx-glider {{ background: var(--vx-ink); }}
[data-theme="{s}"] :is(.vx-spatial__dock, .vx-spatial__rail).vx-glide > .is-active {{ color: #fff; }}
"""


def css(pal, slug, mode, t, report):
    lines = [f"/* Vista theme \"{slug}\" — palette: {pal['name']} ({', '.join(pal['colors'])}) · mode: {mode}",
             "   contrast check:"]
    for label, val, need in report:
        lines.append(f"     {'ok ' if val >= need else 'LOW'} {label}: {val:.2f} (need {need})")
    lines.append("*/")
    lines.append(f'[data-theme="{slug}"] {{')
    for k in ORDER:
        lines.append(f"  --vx-{k}: {t[k]};")
    lines.append("}")
    if mode == "dark":
        lines.append(DARK_FIXES.format(s=slug).rstrip())
    if mode == "light":
        lines.append(LIGHT_FIXES.format(s=slug).rstrip())
    if "_dark_card" in t:
        lines.append(f'[data-theme="{slug}"] .vx-card--dark {{ background: {t["_dark_card"]}; }}')
    return "\n".join(lines) + "\n"


def preview(theme_css, slug, out):
    src = SKILL / "examples" / "indigo-store-overview.html"
    html = src.read_text(encoding="utf-8")
    assets = (SKILL / "assets").resolve().as_uri() + "/"
    html = html.replace('"../assets/', '"' + assets)
    html = re.sub(r'data-theme="[a-z-]+"', f'data-theme="{slug}"', html, count=1)
    html = html.replace("</head>", f"<style>\n{theme_css}</style>\n</head>", 1)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")


def gallery():
    """Regenerate the palette section of examples/theme-gallery.html from palettes.json."""
    page = SKILL / "examples" / "theme-gallery.html"
    html = page.read_text(encoding="utf-8")
    esc = lambda x: x.replace("&", "&amp;").replace("<", "&lt;")
    out = []
    for g in load()["groups"]:
        out.append(f'    <div class="pal-group"><div class="vx-row"><h3 class="vx-h3">{esc(g["name"])}</h3>'
                   f'<span class="vx-count">{len(g["palettes"])}</span></div>')
        out.append('      <div class="vx-grid-auto" style="--min:230px">')
        for p in g["palettes"]:
            strip = "".join(f'<i style="--c:{c}" title="{c}"></i>' for c in p["colors"])
            out.append(
                f'        <article class="vx-card pal-card"><div class="vx-palette">{strip}</div>'
                f'<div class="vx-row vx-row--between"><b class="vx-h3">{esc(p["name"])}</b><span class="vx-tag">{p["mode"]}</span></div>'
                f'<div class="vx-caption" style="margin:4px 0 10px">{esc(p["use_for"])}</div>'
                f'<div class="vx-row vx-row--between"><code>palette_theme.py {p["id"]}</code>'
                f'<button class="vx-btn vx-btn--sm vx-btn--ghost" data-vx-theme-switch="{p["closest_theme"]}">closest: {p["closest_theme"]}</button></div></article>')
        out.append("      </div></div>")
    block = "<!-- palettes:start -->\n" + "\n".join(out) + "\n    <!-- palettes:end -->"
    html, n = re.subn(r"<!-- palettes:start -->.*?<!-- palettes:end -->", lambda m: block, html, flags=re.S)
    if not n:
        sys.exit("markers <!-- palettes:start/end --> not found in theme-gallery.html")
    page.write_text(html, encoding="utf-8")
    print(f"[ok] {page}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("palette", nargs="?", help="id, name or comma-separated hex list")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--gallery", action="store_true", help="rebuild the palette library in examples/theme-gallery.html")
    ap.add_argument("--mode", choices=["dark-chrome", "light", "dark"])
    ap.add_argument("--primary", help="force the accent colour, e.g. #893172")
    ap.add_argument("--cta", choices=["dark", "primary"], help="CTA style (default: dark for light mode, else primary)")
    ap.add_argument("--name", help="data-theme slug (default: palette name)")
    ap.add_argument("--out", help="write CSS here instead of stdout")
    ap.add_argument("--preview", help="also write an example page using the theme (then run screenshot.py on it)")
    a = ap.parse_args()

    if a.list:
        for g in load()["groups"]:
            print(f"\n{g['name']}")
            for p in g["palettes"]:
                print(f"  {p['id']:>2}  {p['name']:<30} {p['mode']:<11} {' '.join(p['colors'])}\n      → {p['use_for']} (closest built-in: {p['closest_theme']})")
        return 0
    if a.gallery:
        gallery()
        return 0
    if not a.palette:
        ap.error("give a palette id/name/hex list, or --list")
    pal = find(a.palette)
    slug, mode, t, report = build(pal, a.mode, a.primary, a.cta, a.name)
    out_css = css(pal, slug, mode, t, report)
    if a.out:
        pathlib.Path(a.out).write_text(out_css, encoding="utf-8")
        print(f"[ok] {a.out}  (data-theme=\"{slug}\", mode={mode})", file=sys.stderr)
    else:
        sys.stdout.write(out_css)
    if a.preview:
        preview(out_css, slug, pathlib.Path(a.preview).resolve())
        print(f"[ok] preview {a.preview}", file=sys.stderr)
    for label, val, need in report:
        if val < need:
            print(f"[warn] {label}: {val:.2f} < {need}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
