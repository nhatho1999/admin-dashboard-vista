#!/usr/bin/env python3
"""Render one or more Vista UI HTML pages to PNG so an agent can look at its work.

Usage:
    python3 scripts/screenshot.py page.html [more.html ...] [--out DIR] [--width 1440] [--height 900] [--full]
    python3 scripts/screenshot.py page.html --frames 0,120,260,450,800      # entrance filmstrip
    python3 scripts/screenshot.py page.html --reduced-motion                # final state, no motion

Requires Playwright for Python (pip install playwright && python -m playwright install chromium).
Also prints browser console errors, which usually point at bad chart JSON or a missing asset.
The still screenshot is taken after VistaMotion.finish(), i.e. the end state of every entrance,
scroll-reveal and chart draw-in; anything still invisible after that is reported as an error.
--frames freezes every running animation at each timestamp (ms after load) and writes
page-<width>-f<ms>.png so you can check the choreography (order, overlap, nothing jumping).
Exit code 1 if any page logged an error.
"""
import argparse
import pathlib
import sys


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pages", nargs="+")
    ap.add_argument("--out", default=None, help="output dir (default: next to each page)")
    ap.add_argument("--width", type=int, default=1440)
    ap.add_argument("--height", type=int, default=900)
    ap.add_argument("--full", action="store_true", help="capture the full scrollable page")
    ap.add_argument("--wait", type=int, default=900, help="ms to wait for fonts/charts/animations")
    ap.add_argument("--frames", default=None, help="comma-separated ms, e.g. 0,150,300,600 — entrance filmstrip")
    ap.add_argument("--reduced-motion", action="store_true", help="emulate prefers-reduced-motion: reduce")
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright missing: pip install playwright && python -m playwright install chromium", file=sys.stderr)
        return 2

    failed = False
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": args.width, "height": args.height}, device_scale_factor=1,
                                  reduced_motion="reduce" if args.reduced_motion else "no-preference")
        for page_path in args.pages:
            src = pathlib.Path(page_path).resolve()
            out_dir = pathlib.Path(args.out).resolve() if args.out else src.parent
            out_dir.mkdir(parents=True, exist_ok=True)
            out = out_dir / (src.stem + f"-{args.width}.png")
            page = ctx.new_page()
            errors = []
            page.on("console", lambda m, e=errors: e.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda exc, e=errors: e.append(str(exc)))
            if args.frames:
                # freeze the entrance at each timestamp: every Web/CSS animation gets currentTime = t
                page.goto(src.as_uri(), wait_until="load")
                page.evaluate("document.fonts && document.fonts.ready")
                for t in [int(x) for x in args.frames.split(",") if x.strip()]:
                    page.evaluate("""t => document.getAnimations().forEach(a => {
                        try { a.pause(); a.currentTime = t; } catch (e) {} })""", t)
                    page.wait_for_timeout(60)  # let rAF-driven count-ups read the scrubbed time
                    f_out = out_dir / (src.stem + f"-{args.width}-f{t}.png")
                    page.screenshot(path=str(f_out))
                    print(f"[ok] {src.name} @ {t}ms -> {f_out}")
                page.evaluate("document.getAnimations().forEach(a => { try { a.play(); } catch (e) {} })")
            else:
                page.goto(src.as_uri(), wait_until="networkidle")
            page.wait_for_timeout(args.wait)
            # end state of all motion (entrance, scroll reveals below the fold, chart draw-in)
            page.evaluate("window.VistaMotion ? VistaMotion.finish() : (window.VistaCharts && VistaCharts.flush && VistaCharts.flush())")
            page.wait_for_timeout(120)
            page.screenshot(path=str(out), full_page=args.full)
            print(f"[ok] {src.name} -> {out}")
            hidden = page.evaluate("""[...document.querySelectorAll(
                '.vx-panel, .vx-sidebar, .vx-topbar, .vx-card, .vx-quick__item, .vx-insight, [data-vx-reveal], .vx-chart > svg')]
                .filter(e => e.getClientRects().length && parseFloat(getComputedStyle(e).opacity) < 0.05).length""")
            if hidden:
                errors.append(f"{hidden} element(s) still invisible after motion finished (stuck entrance / reveal)")
            # lucide replaces <i data-lucide> with <svg>; leftovers are unknown icon names
            unknown = page.evaluate(
                "[...new Set([...document.querySelectorAll('i[data-lucide]')].map(e => e.dataset.lucide))]")
            if unknown:
                errors.append("unknown/unrendered icons: " + ", ".join(unknown))
            empty = page.evaluate(
                "[...document.querySelectorAll('[data-vx-chart]')].filter(e => !e.querySelector('svg')).length")
            if empty:
                errors.append(f"{empty} chart(s) rendered nothing (check data-vx JSON)")
            leftovers = page.evaluate("document.body.innerText.match(/\\[\\[[^\\]]*\\]\\]/g) || []")
            if leftovers:
                print(f"  [note] {len(leftovers)} [[placeholder]] left, e.g. {leftovers[0]}")
            for e in errors:
                failed = True
                print(f"  [error] {e}")
            page.close()
        browser.close()
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
