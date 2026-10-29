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
WB_VERSION="$(cargo tree --target wasm32-unknown-unknown -i wasm-bindgen --depth 0 | sed -n 's/.*wasm-bindgen v\([0-9.]*\).*/\1/p' | head -n 1)"
if [[ -z "$WB_VERSION" ]]; then
  echo "Could not determine the wasm-bindgen version from the dependency graph." >&2
  exit 1
fi
cargo install wasm-bindgen-cli --version "$WB_VERSION" --locked
wasm-bindgen target/wasm32-unknown-unknown/release/wave_rider_nusantara.wasm --out-dir web --target web --no-typescript

cp index.html web/index.html
mkdir -p web/assets/audio
cp -r assets/images assets/fonts web/assets/
cp assets/audio/bg-sound.ogg web/assets/audio/
