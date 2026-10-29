# Wave Rider Nusantara — Rust

A Rust implementation alongside the existing React and Python versions. Macroquad provides one gameplay codebase for desktop and WebAssembly.

## Included features

- Gatotkaca idle, hit, and collect animations.
- Four batik collectibles, bombs, collisions, score, and three lives.
- Menu, pause/resume, game over, and restart.
- English and Indonesian UI.
- Keyboard and mouse input, plus on-screen controls on narrow screens.
- Looping background music with a mute toggle; music is silenced outside gameplay.
- Reuses the web version's WebP background, character, bomb, and collectible artwork.
- Delta-time movement and frame-rate-scaled spawning.

## Desktop

Install stable Rust and FFmpeg, then run from this directory:

    ./scripts/prepare-audio.sh
    cargo run --release

The preparation script converts the existing WebM soundtrack to OGG Vorbis at a compact quality setting. If FFmpeg is not installed, it can download the `ffmpeg-static` npm package when Node.js/npm are available.

## WebAssembly locally

Install stable Rust, the WebAssembly target, and FFmpeg. Then run:

    ./scripts/build-wasm.sh
    python3 -m http.server 8000

Open http://localhost:8000/web/. Serve over HTTP rather than opening the HTML as a local file. The build script generates `web/index.html`, the wasm-bindgen JavaScript/WASM files, and the assets directory.

## WebAssembly on Vercel

The dedicated Vercel project uses `rust/` as its root directory, runs `bash scripts/build-wasm.sh`, and serves the generated `web/` output. It builds the `rust` branch as a preview so the existing web version and production deployment remain untouched.

## Controls

- Arrow keys or WASD: move.
- Space: start.
- P: pause or resume.
- M: mute or unmute.
- R: return to the menu after game over.
- Mouse/touch: use the on-screen buttons.

## Assets and audio

Images stay in WebP format. The original web soundtrack is WebM (about 2.28 MB) and the original Python soundtrack is WAV (about 3.70 MB). Macroquad does not decode WebM directly, so the build converts WebM to OGG Vorbis, which is supported by the game runtime and generally smaller than uncompressed WAV. The generated OGG is a build artifact and is not committed.

The original React and Python directories are unchanged. The repository includes MIT and Apache-2.0 license files at its root; verify any third-party asset attribution requirements before redistributing builds.

## Validation

GitHub Actions checks the desktop target, unit tests, and WebAssembly target, then builds a downloadable static WebAssembly artifact. The Vercel preview is built independently from the same branch.
