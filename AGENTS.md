# Agent instructions

This repository ships one skill: **vista-ui** — glassmorphism dashboard UI generation.

When a task asks for a dashboard, admin panel, CRM/analytics/finance screen or a
"beautiful / modern / glass" web UI:

1. Read `skills/vista-ui/SKILL.md` and follow its workflow.
2. Load files from `skills/vista-ui/references/` only when the step needs them.
3. Reuse `skills/vista-ui/assets/` (CSS, charts, icons) instead of writing styles from scratch.
4. Verify with `python3 skills/vista-ui/scripts/screenshot.py <page.html> --full` when you can run code.

Working on the skill itself:
- Keep every class prefixed `vx-` and every token `--vx-`.
- After changing `assets/`, re-render all `skills/vista-ui/examples/*.html` with the screenshot script and
  make sure it prints no `[error]` lines.
