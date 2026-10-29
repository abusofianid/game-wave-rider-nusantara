# Wave Rider Nusantara — Rust

A Rust implementation alongside the existing React and Python versions. Macroquad provides one gameplay codebase for desktop and WebAssembly.

## Included features

- Gatotkaca idle, hit, and collect animations.
- Four batik collectibles, bombs, collisions, score, and three lives.
- Menu, pause/resume, game over, and restart.
- English and Indonesian UI.
- Keyboard and mouse input, plus on-screen controls on narrow screens.
- Looping background music with a mute toggle.
- Reuses the web version's WebP background, character, bomb, and collectible artwork.
- Delta-time movement and frame-rate-scaled spawning.

## Desktop

Install stable Rust and run from this directory:

    cargo run --release

## WebAssembly

Install the WebAssembly target and wasm-bindgen CLI:

    rustup target add wasm32-unknown-unknown
    cargo install wasm-bindgen-cli
    cargo build --release --target wasm32-unknown-unknown
    wasm-bindgen target/wasm32-unknown-unknown/release/wave_rider_nusantara.wasm --out-dir web --target web --no-typescript

Serve this directory over HTTP (not as a file URL), for example:

    python3 -m http.server 8000

Open http://localhost:8000/index.html. The generated JS and WASM files are placed in web/.

## Controls

- Arrow keys or WASD: move.
- Space: start.
- P: pause or resume.
- M: mute or unmute.
- R: return to the menu after game over.
- Mouse/touch: use the on-screen buttons.

## Assets and audio compatibility

Artwork and OpenSans are reused from the existing web version and kept in WebP format where applicable. Macroquad's audio decoding is more compatible with WAV than browser-oriented WebM, so the Rust port uses the repository's existing WAV soundtrack from the Python version. The original React and Python directories are unchanged.

The repository includes MIT and Apache-2.0 license files at its root. Verify any third-party asset attribution requirements before redistributing builds.

## Validation

Native and WebAssembly builds should be run with the Rust toolchain installed. This branch does not configure deployment.
