# Wave Rider Nusantara — Native GPUI Desktop

A native Rust desktop rebuild of the Python/Pyglet edition of Wave Rider Nusantara. The gameplay model is ported from `python/main.py`; GPUI provides the native application window, keyboard input, and GPU-backed custom scene painting.

## Stack

- Rust (Edition 2024)
- GPUI (GPUI Unofficial distribution)
- Native desktop application (Linux, macOS, Windows supported by GPUI platform layer)

## Run locally

Install a stable Rust toolchain and the native platform dependencies required by GPUI. From this directory:

```sh
cargo run
```

Run gameplay model tests and check the code:

```sh
cargo fmt --all -- --check
cargo check
cargo test
cargo build --release
```

## Gameplay port

- Menu, playing, paused, and game-over state flow.
- Gatotkaca player movement with arrow keys or WASD and window-bound clamping.
- Continuous side-scrolling entities, dynamic bomb and batik spawn, and increasing game speed.
- AABB collision checks and spawn-overlap prevention.
- Bomb collision reduces three lives; game-over is reached at zero lives.
- Batik collection adds 10 points.
- Temporary hit/collect feedback and a two-frame run-state animation counter.
- English and Indonesian UI language choice.
- Space starts, P pauses/resumes, R restarts after game-over, M toggles the mute preference.
- GPUI canvas scene painted with vector primitives.

## Current port scope

The core game model and scene loop are newly implemented from the Python source. The current rendering uses vector-drawn approximations rather than the original PNG sprites. The Python source assets remain in the sibling `python/assets/` directory and are not yet wired into the GPUI renderer. The mute toggle is UI state only; background audio playback has not yet been ported. These are remaining polish tasks for visual/audio parity.

## CI

GitHub Actions runs formatting checks, `cargo check`, gameplay tests, and an optimized native release build on Linux.

## License

The repository contains MIT and Apache-2.0 license files at its root. Review those files and any third-party asset attribution requirements before redistributing source code or builds.
