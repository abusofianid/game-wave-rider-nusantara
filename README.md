# Wave Rider Nusantara

![React](https://img.shields.io/badge/React-web-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Rust](https://img.shields.io/badge/Rust-WebAssembly-orange?style=for-the-badge&logo=rust&logoColor=white)
![Python](https://img.shields.io/badge/Python-desktop-3776AB?style=for-the-badge&logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT%20%26%20Apache%202.0-blue?style=for-the-badge)

**Wave Rider Nusantara** is an arcade-style game inspired by the culture and visual identity of the Indonesian archipelago. This repository contains multiple implementations of the game.

## Game versions

| Version | Description | Technology |
| --- | --- | --- |
| [Web](./react/) | Browser-based game | React, JavaScript |
| [Rust](./rust/) | Rust game that can run as a desktop application or compile to WebAssembly for browsers | Rust, Macroquad, WebAssembly |
| [Python](./python/) | Python desktop implementation | Python |

The React version has a separate deployment at [waveridernusantara.vercel.app](https://waveridernusantara.vercel.app/). Availability of other hosted builds depends on their respective deployment configuration.

## Requirements

Install the tools for the version you want to run:

- **Web:** Node.js and npm.
- **Rust desktop / WebAssembly:** stable Rust and Cargo. Building WebAssembly also requires the `wasm32-unknown-unknown` target; the build script installs it. FFmpeg is optional when the committed OGG soundtrack is present.
- **Python:** Python and the dependency manager or packages described by the Python project.

## Run the web version

```bash
git clone https://github.com/abusofianid/game-wave-rider-nusantara.git
cd game-wave-rider-nusantara/react
npm install
npm run dev
```

Follow the terminal output to open the local development URL.

## Run the Rust version

For desktop play:

```bash
cd rust
cargo run --release
```

For a local WebAssembly build:

```bash
cd rust
./scripts/build-wasm.sh
python3 -m http.server 8000
```

Then open [http://localhost:8000/web/](http://localhost:8000/web/). Serve the generated files over HTTP; do not open the HTML file directly from the filesystem.

See the [Rust README](./rust/README.md) for controls, build requirements, audio details, and deployment configuration.

## Run the Python version

See the [Python project directory](./python/) for its entry point and dependency instructions.

## Assets and licensing

The Rust implementation reuses optimized WebP game artwork and a committed OGG Vorbis soundtrack. See the relevant source directories and license files before redistributing the game or its assets. The repository includes MIT and Apache-2.0 license files; check third-party asset attribution requirements separately.

## Contact

- **Author:** Abu Sofian
- **Email:** abusofian.id@gmail.com
- **LinkedIn:** [linkedin.com/in/abusofianid](https://www.linkedin.com/in/abusofianid)
