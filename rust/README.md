# Wave Rider Nusantara — Native GPUI Desktop

A native Rust desktop endless runner. This edition rebuilds the gameplay model from the Python/Pyglet implementation and uses GPUI for the desktop window, keyboard input, layout, and GPU-backed scene rendering.

## Technology

- Rust (Edition 2024)
- GPUI Unofficial distribution and platform layer
- Rodio for looping Ogg background music
- Native desktop builds for Linux, Windows, and macOS (built on each platform's native runner)

## Requirements

- Stable Rust toolchain with Rust 2024 edition support.
- Linux: GPUI development libraries such as X11, XKB, Wayland, Fontconfig, ALSA, and XCB development packages. On Debian/Ubuntu, install the package list in the repository root README.
- Windows: Visual Studio C++ Build Tools and the Windows SDK.
- macOS: Xcode Command Line Tools.

## Run locally

From this directory:

```sh
cargo run
```

Build and validate:

```sh
cargo fmt --all -- --check
cargo check
cargo test
cargo build --release
```

## Gameplay

- Menu, playing, paused, and game-over states.
- Gatotkaca movement with arrow keys or W/A/S/D.
- Continuous side-scrolling bombs and four Batik collectible types.
- Dynamic spawning, randomized entity sizes, overlap prevention, and progressive game speed.
- AABB collision detection and a three-life system.
- Each collected Batik adds 10 points; bomb collisions remove one life.
- Two-frame running animation and temporary hit/collection feedback.
- English and Indonesian interface language choices.
- Original background, Gatotkaca, bomb, and Batik artwork.
- Looping Ogg soundtrack, volume set to 10%; M and the Sound control toggle mute.

### Controls

| Input | Action |
| --- | --- |
| Arrow keys or W / A / S / D | Move |
| Space | Start from menu |
| P | Pause / resume |
| R | Restart after Game Over |
| M | Mute / unmute music |

## Assets and runtime behavior

Image assets and background music are embedded at compile time. The executable can therefore run without the repository checkout, a `rust/assets` directory beside it, a browser, or a WebAssembly runtime.

If the system has no audio output device or the soundtrack cannot be decoded, the game continues without music and writes a diagnostic message to standard error. Missing image resources use the renderer's vector fallback where available.

## Build distribution packages

The repository workflow builds native release binaries on Linux, Windows, and macOS runners. Pull requests and manual workflow runs validate the platform builds and upload short-lived artifacts. A tag named `rust-v*` also creates a GitHub Release containing the platform archives.

See [GitHub Releases](https://github.com/abusofianid/game-wave-rider-nusantara/releases) for published packages.

## Project structure

```text
rust/
├── Cargo.toml
├── README.md
├── assets/
│   ├── audio/
│   └── images/
└── src/
    ├── main.rs       # GPUI application bootstrap and embedded asset source
    ├── app.rs        # GPUI UI, rendering, input, and audio integration
    └── game/
        └── mod.rs    # Gameplay state, simulation, collisions, and tests
```

## CI

The checks workflow verifies formatting, native compilation, gameplay unit tests, release compilation, and a Linux/Xvfb startup smoke test with menu and gameplay screenshots. A separate build workflow compiles release binaries on all three desktop operating systems.

## License

The repository contains MIT and Apache-2.0 license files at its root. Review those files and any third-party asset attribution requirements before redistributing source code or binaries.
