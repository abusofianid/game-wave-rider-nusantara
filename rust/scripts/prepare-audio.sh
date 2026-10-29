#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$ROOT/assets/audio/bg-sound.webm"
OUTPUT="$ROOT/assets/audio/bg-sound.ogg"

if [[ ! -f "$SOURCE" ]]; then
  echo "Missing soundtrack source: $SOURCE" >&2
  exit 1
fi

if command -v ffmpeg >/dev/null 2>&1; then
  FFMPEG="$(command -v ffmpeg)"
else
  if ! command -v npm >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
    echo "Install ffmpeg (recommended), or Node.js/npm to fetch ffmpeg-static." >&2
    exit 1
  fi
  TOOL_DIR="${TMPDIR:-/tmp}/wave-rider-audio-tools"
  npm install --prefix "$TOOL_DIR" --no-save --no-package-lock ffmpeg-static
  FFMPEG="$(node -e 'process.stdout.write(require(process.argv[1]))' "$TOOL_DIR/node_modules/ffmpeg-static")"
fi

"$FFMPEG" -hide_banner -loglevel error -y -i "$SOURCE" -vn -c:a libvorbis -q:a 3 "$OUTPUT"
printf 'Compressed soundtrack created: %s (%s bytes)\n' "$OUTPUT" "$(wc -c < "$OUTPUT" | tr -d ' ')"
