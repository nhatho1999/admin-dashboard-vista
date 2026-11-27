#!/usr/bin/env python3
"""Render one or more Vista UI HTML pages to PNG so an agent can look at its work.

Usage:
    python3 scripts/screenshot.py page.html [more.html ...] [--out DIR] [--width 1440] [--height 900] [--full]
    python3 scripts/screenshot.py page.html --frames 0,120,260,450,800      # entrance filmstrip
    python3 scripts/screenshot.py page.html --reduced-motion                # final state, no motion
    python3 scripts/screenshot.py page.html --perf                          # smoothness report

Requires Playwright for Python (pip install playwright && python -m playwright install chromium).
Also prints browser console errors, which usually point at bad chart JSON or a missing asset.
The still screenshot is taken after VistaMotion.finish(), i.e. the end state of every entrance,
scroll-reveal and chart draw-in; anything still invisible after that is reported as an error.
--frames freezes every running animation at each timestamp (ms after load) and writes
page-<width>-f<ms>.png so you can check the choreography (order, overlap, nothing jumping).
--perf loads the page again and measures the entrance (first 2s) and a scroll pass: frame times,
main-thread script/layout time, layout and style-recalc counts — once with live blur and once with
lite glass (html[data-vx-glass=lite]) so you can see what the blur itself costs on this machine.
Headless Chromium usually renders blur in software, so treat absolute fps as a worst case; the
script/layout numbers are hardware-independent and should stay under the [warn] thresholds.
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
    ap.add_argument("--perf", action="store_true", help="print a smoothness report (frames, script, layout)")
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
                page.goto(src.as_uri(), wait_until="load", timeout=90000)
                try:  # fonts / lazy iframes; heavy pages (galleries) may never go fully idle in headless
                    page.wait_for_load_state("networkidle", timeout=15000)
                except Exception:
                    print(f"  [note] {src.name}: network not idle after 15s, capturing anyway")
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
            if args.perf:
                perf(browser, src, args)
        browser.close()
    return 1 if failed else 0


FRAMES_JS = """ms => new Promise(res => { const f = []; let last = 0, t0 = 0;
  function tick(t) { if (t0) f.push(t - last); else t0 = t; last = t;
    if (t - t0 < ms) requestAnimationFrame(tick); else res(f); }
  requestAnimationFrame(tick); })"""
SCROLL_JS = """() => new Promise(res => { const f = []; let last = 0, y = 0;
  const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  function tick(t) { if (last) f.push(t - last); last = t; y += 24; scrollTo(0, Math.min(y, max));
    if (y < Math.min(max, 2400) && f.length < 200) requestAnimationFrame(tick); else res(f); }
  if (!max) return res([]); requestAnimationFrame(tick); })"""


def _stats(frames):
    if not frames:
        return "n/a"
    f = sorted(frames)
    jank = sum(1 for x in f if x > 25) * 100 // len(f)
    return f"{len(f):3d} frames  p50 {f[len(f) // 2]:5.1f}ms  p95 {f[int(len(f) * .95)]:5.1f}ms  >25ms {jank:3d}%"


def perf(browser, src, args):
    """Entrance + scroll smoothness with live blur vs lite glass, plus main-thread cost."""
    for mode in ("full", "lite"):
        ctx = browser.new_context(viewport={"width": args.width, "height": args.height}, device_scale_factor=1)
        ctx.add_init_script("document.addEventListener('readystatechange', () => document.documentElement"
                            f".setAttribute('data-vx-glass', '{mode}'), {{ once: true }})")
        page = ctx.new_page()
        cdp = ctx.new_cdp_session(page)
        cdp.send("Performance.enable")
        page.goto(src.as_uri(), wait_until="commit")
        entrance = page.evaluate(FRAMES_JS, 2000)
        m = {x["name"]: x["value"] for x in cdp.send("Performance.getMetrics")["metrics"]}
        page.evaluate("window.VistaMotion && VistaMotion.finish()")
        scroll = page.evaluate(SCROLL_JS)
        print(f"  [perf] {mode:4s} entrance  {_stats(entrance)}")
        print(f"  [perf] {mode:4s} scroll    {_stats(scroll)}")
        if mode == "full":
            script, layout = m["ScriptDuration"] * 1000, m["LayoutDuration"] * 1000
            print(f"  [perf] main thread (load+entrance): script {script:.0f}ms · layout {layout:.0f}ms · "
                  f"{m['LayoutCount']:.0f} layouts · {m['RecalcStyleCount']:.0f} style recalcs")
            if script > 250:
                print("  [warn] heavy script during load — move work off the entrance, batch DOM writes")
            if m["LayoutCount"] > 120:
                print("  [warn] many layouts — look for reads (getBoundingClientRect/offsetWidth) after writes in loops")
        ctx.close()


if __name__ == "__main__":
    sys.exit(main())
