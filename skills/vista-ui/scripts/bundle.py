#!/usr/bin/env python3
"""Inline local CSS/JS into one self-contained HTML file (handy for artifacts, email, previews).

Usage:
    python3 scripts/bundle.py page.html -o page.single.html [--no-icons]

- <link rel="stylesheet" href="local.css">  -> <style>…</style>
- <script src="local.js"></script>           -> <script>…</script>
Remote URLs (Google Fonts, CDNs, images) are left untouched.
--no-icons drops lucide.min.js (≈350 KB). Only use it when the page has no <i data-lucide> icons
           (e.g. you replaced them with inline SVG), otherwise icons disappear.
"""
import argparse
import pathlib
import re
import sys

LINK_RE = re.compile(r'<link\b[^>]*rel=["\']stylesheet["\'][^>]*>', re.I)
SCRIPT_RE = re.compile(r'<script\b([^>]*)\bsrc=["\']([^"\']+)["\']([^>]*)>\s*</script>', re.I)
HREF_RE = re.compile(r'href=["\']([^"\']+)["\']', re.I)


def is_remote(url: str) -> bool:
    return bool(re.match(r'^(https?:)?//', url)) or url.startswith("data:")


def bundle(src: pathlib.Path, drop_icons: bool = False) -> str:
    html = src.read_text(encoding="utf-8")
    base = src.parent

    def inline_css(m: re.Match) -> str:
        tag = m.group(0)
        href = HREF_RE.search(tag)
        if not href or is_remote(href.group(1)):
            return tag
        path = (base / href.group(1)).resolve()
        if not path.exists():
            print(f"[warn] missing stylesheet {path}", file=sys.stderr)
            return tag
        return f"<style>/* {path.name} */\n{path.read_text(encoding='utf-8')}\n</style>"

    def inline_js(m: re.Match) -> str:
        url = m.group(2)
        if is_remote(url):
            return m.group(0)
        path = (base / url).resolve()
        if drop_icons and path.name.startswith("lucide"):
            return ""
        if not path.exists():
            print(f"[warn] missing script {path}", file=sys.stderr)
            return m.group(0)
        code = path.read_text(encoding="utf-8").replace("</script", "<\\/script")
        return f"<script>/* {path.name} */\n{code}\n</script>"

    html = LINK_RE.sub(inline_css, html)
    html = SCRIPT_RE.sub(inline_js, html)
    return html


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("page")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--no-icons", action="store_true")
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    out.write_text(bundle(pathlib.Path(a.page).resolve(), a.no_icons), encoding="utf-8")
    print(f"[ok] {out} ({out.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
