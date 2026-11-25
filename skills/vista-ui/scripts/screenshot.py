#!/usr/bin/env python3
"""Render one or more Vista UI HTML pages to PNG so an agent can look at its work.

Usage:
    python3 scripts/screenshot.py page.html [more.html ...] [--out DIR] [--width 1440] [--height 900] [--full]

Requires Playwright for Python (pip install playwright && python -m playwright install chromium).
Also prints browser console errors, which usually point at bad chart JSON or a missing asset.
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
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright missing: pip install playwright && python -m playwright install chromium", file=sys.stderr)
        return 2

    failed = False
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": args.width, "height": args.height}, device_scale_factor=1)
        for page_path in args.pages:
            src = pathlib.Path(page_path).resolve()
            out_dir = pathlib.Path(args.out).resolve() if args.out else src.parent
            out_dir.mkdir(parents=True, exist_ok=True)
            out = out_dir / (src.stem + f"-{args.width}.png")
            page = ctx.new_page()
            errors = []
            page.on("console", lambda m, e=errors: e.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda exc, e=errors: e.append(str(exc)))
            page.goto(src.as_uri(), wait_until="networkidle")
            page.wait_for_timeout(args.wait)
            page.screenshot(path=str(out), full_page=args.full)
            print(f"[ok] {src.name} -> {out}")
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
