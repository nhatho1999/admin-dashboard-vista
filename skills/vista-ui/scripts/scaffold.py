#!/usr/bin/env python3
"""Start a new Vista UI page from a template.

Usage:
    python3 scripts/scaffold.py --shell sidebar --theme indigo --title "Orders" --out ./ui/orders.html
    python3 scripts/scaffold.py --shell notch --out ./ui/crm.html --inline       # single self-contained file

Shells : sidebar (lagoon | indigo | graphite | lapis | orchid | marina) · notch (evergreen | terracotta)
         spatial (aurora | opaline) · topnav (marina | lapis | graphite | lagoon) · auth (indigo | opaline | lapis)
         — any theme works in any shell; these pairings look best.
Assets : by default the skill's assets/ folder is copied next to the page as  vista-assets/
         (skipped if it already exists unless --force-assets). --inline embeds everything instead.
"""
import argparse
import pathlib
import re
import shutil
import sys

SKILL = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_THEME = {"sidebar": "indigo", "notch": "evergreen", "spatial": "aurora", "topnav": "marina", "auth": "indigo"}
THEMES = ["lagoon", "indigo", "aurora", "evergreen", "graphite", "terracotta", "lapis", "orchid", "opaline", "marina"]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--shell", choices=list(DEFAULT_THEME), required=True)
    ap.add_argument("--theme", help="built-in: " + ", ".join(THEMES) + " (or your own data-theme name)")
    ap.add_argument("--title", default=None, help='page <title>, e.g. "Acme Admin — Orders"')
    ap.add_argument("--out", required=True)
    ap.add_argument("--inline", action="store_true", help="embed CSS/JS into the html")
    ap.add_argument("--force-assets", action="store_true", help="overwrite an existing vista-assets/ folder")
    a = ap.parse_args()

    theme = a.theme or DEFAULT_THEME[a.shell]
    out = pathlib.Path(a.out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    html = (SKILL / "templates" / f"{a.shell}.html").read_text(encoding="utf-8")
    html = re.sub(r'data-theme="[a-z]+"', f'data-theme="{theme}"', html, count=1)
    if a.title:
        html = re.sub(r"<title>.*?</title>", f"<title>{a.title}</title>", html, count=1)

    if a.inline:
        sys.path.insert(0, str(SKILL / "scripts"))
        from bundle import bundle  # noqa: E402
        tmp = SKILL / "templates" / f".tmp-{out.stem}.html"
        tmp.write_text(html, encoding="utf-8")
        try:
            html = bundle(tmp)
        finally:
            tmp.unlink(missing_ok=True)
    else:
        dest = out.parent / "vista-assets"
        if dest.exists() and a.force_assets:
            shutil.rmtree(dest)
        if not dest.exists():
            shutil.copytree(SKILL / "assets", dest)
            print(f"[ok] copied assets -> {dest}")
        html = html.replace('"../assets/', '"vista-assets/')

    out.write_text(html, encoding="utf-8")
    print(f"[ok] {out}  (shell={a.shell}, theme={theme})")
    print("next: replace every [[…]] placeholder, then run scripts/screenshot.py on the page")
    return 0


if __name__ == "__main__":
    sys.exit(main())
