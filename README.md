# Wave Rider Nusantara

![React](https://img.shields.io/badge/React-web-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Rust](https://img.shields.io/badge/Rust-native%20desktop-orange?style=for-the-badge&logo=rust&logoColor=white)
![Python](https://img.shields.io/badge/Python-desktop-3776AB?style=for-the-badge&logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT%20%26%20Apache%202.0-blue?style=for-the-badge)

**Wave Rider Nusantara** is an arcade-style endless runner inspired by the culture and visual identity of the Indonesian archipelago. Collect Batik patterns, avoid bombs, and help Gatotkaca survive for as long as possible.

This repository contains three implementations:

| Version | Description | Technology |
| --- | --- | --- |
| [Web](./react/) | Browser-based game | React, JavaScript |
| [Rust](./rust/) | Native desktop application | Rust, GPUI, Rodio |
| [Python](./python/) | Desktop implementation | Python, Pyglet |

The web version is deployed at [waveridernusantara.web.id](https://waveridernusantara.web.id/).

## Rust desktop application

The Rust edition is a native desktop application. It does not require WebAssembly, a browser, or a local web server. Game sprites and background music are embedded into the executable so packaged builds do not depend on the source checkout or the build machine's asset paths.

### Requirements

- Stable Rust toolchain (Rust 2024 edition support) and Cargo.
- A supported desktop development environment for GPUI.
- Linux: the GPUI development libraries listed below.
- Windows: Visual Studio C++ Build Tools with the Windows SDK.
- macOS: Xcode Command Line Tools.

Linux build dependencies (Debian/Ubuntu):

```bash
sudo apt-get update
sudo apt-get install --yes \
  pkg-config libfontconfig1-dev libasound2-dev \
  libx11-dev libxkbcommon-dev libxkbcommon-x11-dev \
  libwayland-dev libxcb1-dev libxcb-render0-dev \
  libxcb-shape0-dev libxcb-xfixes0-dev
```

### Run from source

```bash
git clone https://github.com/abusofianid/game-wave-rider-nusantara.git
cd game-wave-rider-nusantara/rust
cargo run
```

Build an optimized binary:

```bash
cargo build --release
```

Run the test suite:

```bash
cargo fmt --all -- --check
cargo check
cargo test
cargo build --release
```

### Download desktop builds

Native packages for Linux, Windows, and macOS are built by GitHub Actions. Published packages will be attached to tagged Rust releases. See [GitHub Releases](https://github.com/abusofianid/game-wave-rider-nusantara/releases) for available downloads.

To create a Rust release, publish a tag using the `rust-v*` naming convention (for example, `rust-v0.3.0`). The release workflow builds on each platform's native GitHub Actions runner and attaches the resulting archives.

### Gameplay controls

| Input | Action |
| --- | --- |
| Arrow keys or W / A / S / D | Move Gatotkaca |
| Space | Start the game from the menu |
| P | Pause or resume |
| R | Restart after Game Over |
| M | Mute or unmute background music |

Collect each Batik item for 10 points. Avoid bombs: each collision costs one life. The run ends when all three lives are lost.

See the [Rust project README](./rust/README.md) for implementation details and build notes.

## Run the web version

```bash
cd react
npm install
npm run dev
```

Follow the terminal output to open the local development URL.

## Run the Python version

The Python implementation uses Pyglet. Its entry point is `python/main.py`, and dependencies are listed in `python/requirements.txt`.

Create a virtual environment from the repository root:

**Windows (PowerShell):**

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
```

**Linux / macOS:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies and launch:

```bash
python -m pip install --upgrade pip
python -m pip install -r python/requirements.txt
python python/main.py
```

Run from the repository root so relative asset paths resolve correctly. For packaging details, see [Python README](./python/README.md).

## License

This project is licensed under the [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) and [MIT](https://opensource.org/license/mit) licenses.

## Contact

- **Author:** Abu Sofian
- **Email:** abusofian.id@gmail.com
- **LinkedIn:** [linkedin.com/in/abusofianid](https://www.linkedin.com/in/abusofianid)

**[⬆ Back to Top](#wave-rider-nusantara)**
