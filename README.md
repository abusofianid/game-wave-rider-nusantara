[Read the Indonesian version here: **README-id.md**]

---

## 🌊 WAVE RIDER NUSANTARA: CULTURAL ENDLESS RUNNER

A simple 2D endless runner game built using the **Pyglet** library in Python. The project serves as a practical demonstration of **Game State Management**, dynamic **Entity/Sprite Handling**, and robust resource loading for compiled applications.

---

### 📊 Project Overview
- **Engine**: Pyglet (Python library)
- **Character**: Gatotkaca (with a 2-frame running animation)
- **Gameplay**: Endless runner (side-scrolling)
- **Objective**: Collect cultural items (like Batik patterns) and avoid bombs.
- **Technical Focus**: Implementing reliable state flow, custom AABB **Collision Detection**, and a dynamic scaling system for entities.

This project demonstrates core game development principles, transforming static Python code into an **interactive, fast-paced cultural experience**.

---

### ⚙️ Methodology (Game Dev Principles)
1.  **Resource Handling & Deployment**: Custom helper functions (`resource_path_helper`) to ensure image and audio assets are loaded correctly, both in development mode and after compilation via **PyInstaller** (`.exe`).
2.  **Game State Management**: Implementing reliable state switching (MENU, PLAYING, PAUSED, GAME_OVER) to control user flow and rendering.
3.  **Entity Management**: Implementing custom classes (`Player`, `Obstacle`, `Collectible`) for object tracking and movement.
4.  **Collision & Feedback**: Utilizing Axis-Aligned Bounding Box (AABB) checks (`boxes_overlap`) for accurate collision detection and implementing temporary player sprite changes for visual feedback (hit/collect).
5.  **Dynamic Scaling**: Implementing logic to dynamically resize obstacles and collectibles based on random `target_size`, ensuring visual variety while maintaining correct collision hitboxes.

---

### 🛠️ Tools Used
- **Python**: Core programming language.
- **Pyglet** → Used for graphics rendering, window management, audio playback, and handling sprite animations.
- **PyInstaller** → Used for packaging the Python script and all assets (images, fonts, audio) into a single executable file (`.exe`).
- **Visual Studio Code** → Primary IDE used for development, debugging, and file management.
- **Custom Font/Assets** → Integrated custom font (`Open Sans SemiBold`) and Indonesian cultural sprite assets (`gatot-hit.png`, `bomb.png`, etc.).

---

### 🔑 Key Implementations
- **Character Animation**: Gatotkaca uses a seamless 2-frame running animation (`gatot-1.png` / `gatot-2.png`).
- **Multi-Language UI**: Dynamic label rendering based on language selection (`texts` dictionary) and interactive hover/click behavior for language buttons.
- **Hit Feedback Loop**: The Player sprite temporarily switches to `gatot-hit.png` or `gatot-colect.png` upon impact/collection, controlled by a specific **timer logic** (`self.state_timer`) inside the `Player.update()` method.
- **Refactored Collision**: Refactoring the main `update()` loop to rely entirely on the robust `get_item_bbox()` and function calls (e.g., `player.show_hit_effect()`) rather than complex inline collision math.

---

### 💡 Future Scope
- **Advanced Collision**: Implementing pixel-perfect collision detection instead of simple AABB boxes for more precise gameplay.
- **Score Persistence**: Adding logic to save the high score locally using simple file I/O (e.g., JSON).
- **Sound Effects**: Integrating sound effects for collision and collection events.
- **Difficulty Scaling**: Refine the `game_speed_multiplier` to follow a smoother, non-linear curve.

---

### 🛠️ Deployment & Execution

| Mode | File Location | Command | Notes |
| :--- | :--- | :--- | :--- |
| **Development** (Script) | Project folder (`main.py`) | `python main.py` | Install dependencies using: `pip install -r requirements.txt`. |
| **Deployment** (Compiled) | `dist/` folder | **Double-click** the `WaveRiderNusantara.exe` file | Requires prior compilation with PyInstaller. |

---

### 📌 How to Run

1.  **Environment Setup:** Install necessary Python dependencies (listed in **requirements.txt**):
    `pip install -r requirements.txt`
2.  **Compilation (One-time):** Use the complete PyInstaller command to create the `.exe` (ensure the terminal is in the main project folder):
    `pyinstaller --name WaveRiderNusantara --onefile --windowed --add-data "assets;assets" main.py`

You can now **run the ready `.exe`** from the **`dist/`** folder or run the **`main.py`** file directly.

---

### 📧 Contact
- **Author**: Abu Sofian
- **Email**: abusofian.id@gmail.com
- **LinkedIn**: [linkedin.com/in/abusofianid](https://www.linkedin.com/in/abusofianid)