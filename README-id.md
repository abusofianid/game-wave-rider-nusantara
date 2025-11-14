[Read the English version here: **README.md**]

---

## 🌊 WAVE RIDER NUSANTARA: GAME LARI TANPA HENTI BERTEMA BUDAYA

Sebuah game lari tanpa henti (*endless runner*) 2D sederhana yang dibangun menggunakan *library* **Pyglet** di Python. Proyek ini berfokus pada demonstrasi manajemen status game, animasi sprite, penanganan *resource* untuk kompilasi (`pyinstaller`), dan *spawning* objek dinamis sambil merayakan motif dan tokoh budaya Indonesia.

---

### 📊 Ikhtisar Proyek
- **Engine**: Pyglet (*library* Python)
- **Karakter**: Gatotkaca (dengan animasi lari 2-frame)
- **Gameplay**: *Endless runner* (berjalan horizontal)
- **Tujuan**: Mengumpulkan item budaya (seperti Pola Batik) dan menghindari bom.
- **Fokus Teknis**: Implementasi kontrol aliran status yang andal, **Deteksi Tabrakan** *Axis-Aligned Bounding Box* (AABB), dan sistem *scaling* dinamis untuk entitas.

Proyek ini mendemonstrasikan prinsip-prinsip pengembangan game inti, mengubah kode Python statis menjadi **pengalaman budaya interaktif yang serba cepat**.

---

### ⚙️ Metodologi (Prinsip Pengembangan Game)
1.  **Penanganan Resource & Deployment**: Fungsi pembantu khusus (*custom helper*) memastikan aset (*images*, *audio*) dimuat dengan benar, baik dalam mode pengembangan maupun setelah kompilasi via **PyInstaller** (`.exe`).
2.  **Manajemen Status Game**: Menerapkan peralihan status yang andal (MENU, PLAYING, PAUSED, GAME_OVER) untuk mengontrol alur pengguna dan *rendering*.
3.  **Manajemen Entitas**: Mengimplementasikan *class* khusus (`Player`, `Obstacle`, `Collectible`) untuk pelacakan objek dan pergerakan.
4.  **Tabrakan & Umpan Balik**: Memanfaatkan pemeriksaan *Axis-Aligned Bounding Box* (AABB) (`boxes_overlap`) untuk deteksi tabrakan yang akurat dan menerapkan pergantian sprite player sementara untuk umpan balik visual (*hit*/koleksi).
5.  **Scaling Dinamis**: Menerapkan logika untuk mengubah ukuran rintangan dan koleksi secara dinamis berdasarkan `target_size` acak, memastikan variasi visual sambil mempertahankan *hitbox* tabrakan yang benar.

---

### 🛠️ Alat yang Digunakan
- **Python**: Bahasa pemrograman inti.
- **Pyglet** → Digunakan untuk *rendering* grafis, manajemen *window*, pemutaran audio, dan penanganan animasi sprite.
- **PyInstaller** → Digunakan untuk mengemas *skrip* Python dan semua aset (*images*, *fonts*, *audio*) menjadi satu file yang dapat dieksekusi (`.exe`).
- **Visual Studio Code** → IDE utama yang digunakan untuk pengembangan, *debugging*, dan manajemen file.
- **Font Kustom/Aset** → Mengintegrasikan font kustom (`Open Sans SemiBold`) dan aset sprite budaya Indonesia (`gatot-hit.png`, `bomb.png`, dll.).

---

### 🔑 Implementasi Inti
- **Animasi Karakter**: Gatotkaca menggunakan animasi lari 2-frame yang mulus (`gatot-1.png` / `gatot-2.png`).
- **UI Multi-Bahasa**: *Rendering* label dinamis berdasarkan pilihan bahasa (Indonesia/Inggris) dan perilaku *hover*/klik interaktif untuk tombol bahasa.
- **Loop Umpan Balik Hit**: Sprite Player untuk sementara beralih ke `gatot-hit.png` atau `gatot-colect.png` saat terjadi benturan/koleksi, dikendalikan oleh **logika *timer*** spesifik (`self.state_timer`) di dalam metode `Player.update()`.
- **Refactoring Tabrakan**: Memperbaiki *loop* `update()` utama agar bergantung sepenuhnya pada fungsi pembantu yang kuat (`get_item_bbox()`) dan panggilan fungsi (misalnya `player.show_hit_effect()`) alih-alih perhitungan tabrakan *inline* yang kompleks.

---

### 💡 Ruang Lingkup Masa Depan
- **Tabrakan Lanjutan**: Mengimplementasikan deteksi tabrakan *pixel-perfect* alih-alih kotak AABB sederhana untuk *gameplay* yang lebih presisi.
- **Persistensi Skor**: Menambahkan logika untuk menyimpan skor tertinggi secara lokal menggunakan *file I/O* sederhana (misalnya JSON).
- **Efek Suara**: Mengintegrasikan efek suara untuk benturan dan *event* koleksi.
- **Scaling Kesulitan**: Menyempurnakan `game_speed_multiplier` agar mengikuti kurva yang lebih mulus dan non-linear.

---

### 🛠️ Deployment & Eksekusi

| Mode | Lokasi File | Perintah | Catatan |
| :--- | :--- | :--- | :--- |
| **Pengembangan** (Skrip) | Folder proyek (`main.py`) | `python main.py` | Membutuhkan instalasi Pyglet (`pip install pyglet`). |
| **Deployment** (Hasil Kompilasi) | Folder `dist/` | **Klik dua kali** file `WaveRiderNusantara.exe` | Membutuhkan kompilasi awal dengan PyInstaller. |

---

### 📌 Cara Menjalankan

1.  **Penyiapan Lingkungan:** Pastikan Anda telah menginstal Pyglet:
    `pip install pyglet`
2.  **Kompilasi (Sekali Saja):** Gunakan perintah lengkap PyInstaller untuk membuat `.exe` (pastikan terminal berada di folder utama proyek):
    `pyinstaller --name WaveRiderNusantara --onefile --windowed --add-data "assets;assets" main.py`

Anda sekarang dapat **menjalankan `.exe` yang sudah jadi** dari folder **`dist/`** atau menjalankan langsung file **`main.py`** Anda.

---

### 📧 Kontak
- **Penulis**: Abu Sofian
- **Email**: abusofian.id@gmail.com
- **LinkedIn**: [linkedin.com/in/abusofianid](https://www.linkedin.com/in/abusofianid)