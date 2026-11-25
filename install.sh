#!/usr/bin/env bash
# Install the vista-ui skill for different coding agents.
#
#   ./install.sh claude            # ~/.claude/skills/vista-ui          (Claude Code, all projects)
#   ./install.sh claude-project DIR # DIR/.claude/skills/vista-ui        (Claude Code, one project)
#   ./install.sh codex DIR          # DIR/.vista-ui + appends pointer to DIR/AGENTS.md (Codex, Jules, Amp, …)
#   ./install.sh cursor DIR         # DIR/.vista-ui + DIR/.cursor/rules/vista-ui.mdc
#   ./install.sh copilot DIR        # DIR/.vista-ui + appends to DIR/.github/copilot-instructions.md
#   ./install.sh windsurf DIR       # DIR/.vista-ui + DIR/.windsurf/rules/vista-ui.md
#   ./install.sh copy DIR           # just copy the skill folder to DIR/vista-ui
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)/skills/vista-ui"
target="${1:-}"; dir="${2:-.}"

copy_to() {  # $1 = destination folder
  mkdir -p "$(dirname "$1")"
  rm -rf "$1"
  cp -R "$SRC" "$1"
  echo "✓ skill copied to $1"
}

pointer() {  # $1 = path of the skill inside the project
  cat <<EOF
## UI: vista-ui skill
When asked for a dashboard, admin panel, CRM / analytics / finance screen or a "beautiful, modern, glass" UI,
read \`$1/SKILL.md\` and follow its workflow. Reuse \`$1/assets/\` (vista.css, vista-charts.js, icons),
start from \`$1/templates/\` or \`$1/examples/\`, and load \`$1/references/*.md\` only when needed.
EOF
}

append_once() {  # $1 = file
  mkdir -p "$(dirname "$1")"
  if [ -f "$1" ] && grep -q "vista-ui skill" "$1"; then echo "• $1 already mentions vista-ui"; return; fi
  { [ -s "$1" ] && echo; pointer ".vista-ui"; } >> "$1"
  echo "✓ updated $1"
}

case "$target" in
  claude)          copy_to "$HOME/.claude/skills/vista-ui" ;;
  claude-project)  copy_to "$dir/.claude/skills/vista-ui" ;;
  codex)           copy_to "$dir/.vista-ui"; append_once "$dir/AGENTS.md" ;;
  copilot)         copy_to "$dir/.vista-ui"; append_once "$dir/.github/copilot-instructions.md" ;;
  cursor)
    copy_to "$dir/.vista-ui"; mkdir -p "$dir/.cursor/rules"
    { printf -- '---\ndescription: Glassmorphism dashboard / admin UI generation (vista-ui)\nalwaysApply: false\n---\n\n'; pointer ".vista-ui"; } > "$dir/.cursor/rules/vista-ui.mdc"
    echo "✓ wrote $dir/.cursor/rules/vista-ui.mdc" ;;
  windsurf)
    copy_to "$dir/.vista-ui"; mkdir -p "$dir/.windsurf/rules"
    pointer ".vista-ui" > "$dir/.windsurf/rules/vista-ui.md"
    echo "✓ wrote $dir/.windsurf/rules/vista-ui.md" ;;
  copy)            copy_to "$dir/vista-ui" ;;
  *) sed -n '2,12p' "$0"; exit 1 ;;
esac
