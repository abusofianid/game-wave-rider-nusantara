# Wave Rider Nusantara — Native Rust Desktop

A desktop-native Rust application using [GPUI](https://gpui.rs/), based on the Wave Rider Nusantara cultural endless-runner concept.

## Stack

- Rust (Edition 2024)
- GPUI from the GPUI Unofficial crate distribution
- Native platform windowing and GPU-backed UI

## Run

Install a recent stable Rust toolchain (Rust 1.95+ recommended by the current GPUI docs), then from this directory:

```sh
cargo run
```

Run unit tests:

```sh
cargo test
```

## Current native port

This branch replaces the Macroquad/WASM startup and rendering entrypoint with a GPUI desktop window and a native UI interaction layer. The currently implemented prototype includes:

- English and Indonesian language selection
- Menu / playing / paused / game-over state
- Score and three-life state
- Player-position controls
- Batik collection score and bomb/life actions
- Audio mute state toggle
- Unit tests for score, life loss, and movement bounds

## Migration status and known gaps

This is an in-progress framework migration, not yet feature-parity with the original game. The current GPUI view uses an illustrative scene and button-driven mechanics. The original continuous scrolling runner, sprite animations, collision/spawn loop, original artwork rendering, and background music have not yet been reimplemented in GPUI. These are explicit follow-up items before calling the native port complete.

The previous Macroquad browser entrypoint, HTML shell, WASM build script, and audio preparation script were removed from this Rust subproject. This native desktop target is not intended to build to WebAssembly.

## License

The repository contains MIT and Apache-2.0 license files at its root. Review those files and any third-party asset attribution requirements before redistributing source code or builds.
