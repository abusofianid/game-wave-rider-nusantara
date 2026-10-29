#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v rustup >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
  # shellcheck disable=SC1091
  source "$HOME/.cargo/env"
fi

rustup target add wasm32-unknown-unknown
bash scripts/prepare-audio.sh
cargo build --release --target wasm32-unknown-unknown
mkdir -p web
cp target/wasm32-unknown-unknown/release/wave-rider-nusantara.wasm web/wave_rider_nusantara.wasm
curl --proto '=https' --tlsv1.2 -fsSL https://not-fl3.github.io/miniquad-samples/mq_js_bundle.js -o web/mq_js_bundle.js

sed 's#./web/#./#g' index.html > web/index.html
mkdir -p web/assets/audio
cp -r assets/images assets/fonts web/assets/
cp assets/audio/bg-sound.ogg assets/audio/bg-sound.webm web/assets/audio/
