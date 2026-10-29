# Wave Rider Nusantara — Rust

The Rust implementation complements the React web game and Python version. It uses [Macroquad](https://macroquad.rs/) for gameplay and can run as a desktop application or compile to WebAssembly for browsers.

## Features

- Gatotkaca idle, hit, and collect animations.
- Four batik collectibles, bombs, collision detection, scoring, and three lives.
- Main menu, pause/resume, game-over, and restart flows.
- English and Indonesian in-game UI.
- Keyboard and mouse input, with on-screen movement controls on narrow screens.
- Looping background music with a mute toggle; music is paused when gameplay is paused or reset.
- Reuses optimized WebP backgrounds, character sprites, bombs, and collectible artwork.
- Delta-time movement and frame-rate-scaled spawning.

## Requirements

- Stable Rust toolchain and Cargo.
- For WebAssembly builds: the `wasm32-unknown-unknown` target (the build script installs it).
- Python 3, only if you want to serve the generated WebAssembly build locally.
- FFmpeg is only needed to regenerate the soundtrack from a WebM source; the committed OGG file is used by default.

## Run as a desktop application

From this directory:

```bash
cargo run --release
```

The game loads its assets from the `assets/` directory. The background soundtrack is `assets/audio/bg-sound.ogg`.

## Build and run WebAssembly locally

From this directory:

```bash
./scripts/build-wasm.sh
python3 -m http.server 8000
```

Open [http://localhost:8000/web/](http://localhost:8000/web/). Serve the files over HTTP rather than opening the HTML file directly. The build script generates `web/index.html`, the WebAssembly binary, the Macroquad JavaScript bundle, and the required assets.

The script copies the committed `assets/audio/bg-sound.ogg` into `web/assets/audio/`. It does not need a WebM source file when the OGG asset is already present.

## WebAssembly on Vercel

The intended Vercel build configuration for this Rust project uses `rust/` as the project root, runs `bash scripts/build-wasm.sh`, and publishes the generated `web/` directory. Confirm the Vercel project settings and latest deployment status before relying on a hosted build; a successful local build does not by itself confirm a successful deployment.

## Controls

- **Arrow keys or WASD:** move.
- **Space:** start.
- **P:** pause or resume.
- **M:** mute or unmute.
- **R:** return to the menu after game over.
- **Mouse or touch:** use the on-screen controls where available.

## Assets and audio

- Game artwork is stored as WebP in `assets/images/`.
- The committed background soundtrack is `assets/audio/bg-sound.ogg`, encoded with OGG Vorbis.
- The former `bg-sound.webm` source file has been removed from the repository. The WebAssembly build uses the committed OGG file directly.
- `scripts/prepare-audio.sh` keeps an existing OGG file and only attempts conversion when the OGG is missing and a WebM source is available. Regenerating the OGG requires FFmpeg or Node.js/npm to obtain `ffmpeg-static`.

## Validation

The repository's GitHub Actions workflows can validate Rust targets and tests and build a static WebAssembly artifact. Check the [Actions page](https://github.com/abusofianid/game-wave-rider-nusantara/actions) for the latest run results. Deployment status is separate from CI results.

## License and attribution

The repository contains MIT and Apache-2.0 license files at its root. Review those files and any third-party asset attribution requirements before redistributing source code or builds.
