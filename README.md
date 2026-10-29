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

The Python version is a desktop game built with **Python and Pyglet**. The entry point is `python/main.py`, and its dependencies are listed in `python/requirements.txt`.

### 1. Install Python

Install a supported Python 3 version from [python.org](https://www.python.org/downloads/). On Windows, enable the option to add Python to PATH if the installer offers it.

### 2. Clone the repository

If you have not cloned the repository yet:

```bash
git clone https://github.com/abusofianid/game-wave-rider-nusantara.git
cd game-wave-rider-nusantara
```

### 3. Create a virtual environment

Run these commands from the repository root:

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

### 4. Install dependencies and launch the game

```bash
python -m pip install --upgrade pip
python -m pip install -r python/requirements.txt
python python/main.py
```

Run the game from the repository root as shown above so the relative asset paths resolve as expected. If you prefer to work inside the Python project directory, use `cd python`, then install with `python -m pip install -r requirements.txt` and launch with `python main.py`.

### 5. (Optional) Package a Windows executable

The project includes PyInstaller in its requirements. From the `python` directory on Windows, run:

```powershell
pyinstaller --name WaveRiderNusantara --onefile --windowed --add-data "assets;assets" main.py
```

The executable is generated in `python/dist/`. Packaging is optional; you can play directly with `python main.py`.

For the full Python project overview and implementation details, see the [Python README](./python/README.md).

## Assets and licensing

The Rust implementation reuses optimized WebP game artwork and a committed OGG Vorbis soundtrack. See the relevant source directories and license files before redistributing the game or its assets. The repository includes MIT and Apache-2.0 license files; check third-party asset attribution requirements separately.

## Contact

- **Author:** Abu Sofian
- **Email:** abusofian.id@gmail.com
- **LinkedIn:** [linkedin.com/in/abusofianid](https://www.linkedin.com/in/abusofianid)
