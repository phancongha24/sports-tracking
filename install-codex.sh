#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$ROOT/skills/xbet-odds-analyst"
DEST="${CODEX_HOME:-$HOME/.codex}/skills/xbet-odds-analyst"

if [ ! -f "$SRC/SKILL.md" ]; then
  echo "Missing skill source: $SRC/SKILL.md" >&2
  exit 1
fi

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$SRC/." "$DEST/"
chmod +x "$DEST/scripts/xbet-odds-onefile.js" 2>/dev/null || true

echo "Installed xbet-odds-analyst for Codex: $DEST"
