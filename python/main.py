import pyglet
from pyglet import shapes
from pyglet.window import key
import random
import os
import sys

# perintah compile: pyinstaller --name WaveRiderNusantara --onefile --windowed --add-data "assets;assets" main.py

# --- pengaturan path


def resource_path_helper(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        # _MEIPASS tidak di-set, jadi kita dalam mode pengembangan (dev)
        base_path = os.path.abspath(os.path.dirname(__file__))
    return os.path.join(base_path, relative_path)


def load_resource(filename, shape_func=None, *args, **kwargs):
    # Buat path absolut ke file resource MENGGUNAKAN HELPER
    resource_path = resource_path_helper(filename)
    try:
        return pyglet.sprite.Sprite(pyglet.image.load(resource_path))
    except Exception as e:
        # Jika gagal (bukan gambar atau tidak ditemukan) dan ada fungsi fallback
        if shape_func:
            print(
                f"Warning: File '{filename}' not found or is not an image. Using fallback shape.")
            return shape_func(*args, **kwargs)
        # Jika hanya gagal memuat (misalnya, file audio)
        else:
            # Kembalikan path untuk pyglet.media.load
            return pyglet.media.load(resource_path)


def get_item_bbox(item):
    if isinstance(item, Player):
        return (item.x, item.x + item.player_width, item.y, item.y + item.player_height)

    # --- PERBAIKANNYA DI SINI ---
    elif isinstance(item, Obstacle):
        # Ganti item.radius menjadi item.width dan item.height
        return (item.x, item.x + item.width, item.y, item.y + item.height)
    # -----------------------------

    elif isinstance(item, Collectible):
        return (item.x, item.x + item.width, item.y, item.y + item.height)
    return (0, 0, 0, 0)


def boxes_overlap(box1, box2):
    l1, r1, b1, t1 = box1
    l2, r2, b2, t2 = box2
    return l1 < r2 and r1 > l2 and b1 < t2 and t1 > b2


# Pengaturan Window
window = pyglet.window.Window(800, 600, "Wave Rider Nusantara")
window.set_caption("Wave Rider Nusantara - Created by Abu Sofian")


# ubah cursor di tombol bahasa
hand_cursor = window.get_system_mouse_cursor(window.CURSOR_HAND)
default_cursor = window.get_system_mouse_cursor(window.CURSOR_DEFAULT)


# Game speed multiplier (increases over time)
game_speed_multiplier = 1.0
BASE_GAME_SPEED = 200  # Kecepatan dasar obstacle/collectible
PLAYER_BASE_SPEED = 5  # Kecepatan dasar player


# Status Game
MENU = 0
PLAYING = 1
PAUSED = 2
GAME_OVER = 3
state = MENU

# Penanganan status tombol manual
keys = {}
# Dictionary untuk menyimpan koordinat tombol yang bisa diklik
button_rects = {}


# Player class (Character: gatotkaca)
class Player:
    def __init__(self):
        self.x = 100
        self.y = 300
        self.player_width = 70  # Ukuran default
        self.player_height = 70  # Ukuran default

        # --- 1. Definisikan variabel di LUAR 'try' ---
        # Ini untuk menghindari AttributeError jika 'try' gagal
        self.normal_animation = None
        self.hit_image = None
        self.collect_image = None

        # --- 2. Variabel status untuk timer ---
        # Status apakah sedang (kena hit / dapat koin)
        self.is_changing_state = False
        self.state_timer = 0.0         # Timer untuk kembali normal

        try:
            # --- 3. Muat SEMUA gambar player ---
            img1_path = resource_path_helper('assets/images/gatot_1.png')
            img2_path = resource_path_helper('assets/images/gatot_2.png')
            img_hit_path = resource_path_helper('assets/images/gatot_hit.png')
            img_collect_path = resource_path_helper(
                'assets/images/gatot_collect.png')

            image_1 = pyglet.image.load(img1_path)
            image_2 = pyglet.image.load(img2_path)

            # --- 4. Simpan animasi & gambar ke variabel 'self' ---
            self.normal_animation = pyglet.image.Animation.from_image_sequence(
                [image_1, image_2], duration=0.1, loop=True
            )
            self.hit_image = pyglet.image.load(img_hit_path)
            self.collect_image = pyglet.image.load(img_collect_path)

            # Mulai dengan animasi normal
            self.sprite = pyglet.sprite.Sprite(
                self.normal_animation, x=self.x, y=self.y)

            # Skala (scaling)
            target_width = 70  # Target size
            scale_x = target_width / image_1.width
            scale_y = target_width / image_1.height
            self.sprite.scale = min(scale_x, scale_y)

            # Update hitbox
            self.player_width = self.sprite.width
            self.player_height = self.sprite.height

        except Exception as e:
            print(
                f"Gagal memuat animasi Player: {e}. Menggunakan kotak oranye.")
            self.sprite = shapes.Rectangle(
                self.x, self.y, self.player_width, self.player_height, color=(255, 200, 100))

        self.lives = 3
        self.score = 0

    # --- 5. Modifikasi 'update' dengan LOGIKA TIMER ---
    def update(self, dt):
        # Cek Timer dulu
        if self.is_changing_state:
            self.state_timer -= dt  # Hitung mundur
            if self.state_timer <= 0:
                self.is_changing_state = False
                self._reset_image()  # Kembalikan ke normal

        # Logika gerakan (movement)
        global game_speed_multiplier

        if keys.get(key.LEFT, False):
            self.x -= PLAYER_BASE_SPEED
        if keys.get(key.RIGHT, False):
            self.x += PLAYER_BASE_SPEED
        if keys.get(key.UP, False):
            self.y += PLAYER_BASE_SPEED
        if keys.get(key.DOWN, False):
            self.y -= PLAYER_BASE_SPEED

        # Batas layar
        if self.x < 0:
            self.x = 0
        if self.x > 800 - self.player_width:
            self.x = 800 - self.player_width
        if self.y < 0:
            self.y = 0
        if self.y > 600 - self.player_height:
            self.y = 600 - self.player_height

        # Selalu update posisi sprite
        self.sprite.x = self.x
        self.sprite.y = self.y

    def draw(self):
        self.sprite.draw()

    # --- 6. Tambahkan metode untuk MENGGANTI GAMBAR ---

    def show_hit_effect(self):
        # Cek dulu apakah gambarnya ada (tidak None) dan tidak sedang ganti state
        if self.hit_image and not self.is_changing_state:
            self.sprite.image = self.hit_image
            self.is_changing_state = True
            self.state_timer = 0.3  # Tampilkan selama 0.3 detik

    def show_collect_effect(self):
        if self.collect_image and not self.is_changing_state:
            self.sprite.image = self.collect_image
            self.is_changing_state = True
            self.state_timer = 0.3  # Tampilkan selama 0.3 detik

    def _reset_image(self):
        # Kembali ke animasi normal
        if self.normal_animation:
            self.sprite.image = self.normal_animation


# Obstacle class
class Obstacle:
    def __init__(self, x, y_pos=None, radius=None):
        self.x = x
        self.y = y_pos if y_pos is not None else (
            window.height / 2 + random.randint(-200, 200))

        # --- 1. GUNAKAN UKURAN ACAK (BUKAN RADIUS) ---
        target_size = random.randint(40, 85)  # Ukuran acak

        obstacle_color = (255, 0, 0)

        # --- 2. GANTI GAMBAR & PATH ---
        self.sprite = load_resource(
            'assets/images/bomb.png',  # <-- GAMBAR DIUBAH DI SINI
            # Fallback tetap lingkaran
            shapes.Circle, self.x, self.y, target_size / 2, color=obstacle_color)

        # --- 3. TAMBAHKAN LOGIKA SCALING & HITBOX ---
        if isinstance(self.sprite, pyglet.sprite.Sprite):
            # Jika 'bomb.png' berhasil dimuat
            original_width = self.sprite.image.width
            original_height = self.sprite.image.height

            scale_x = target_size / original_width
            scale_y = target_size / original_height
            self.sprite.scale = min(scale_x, scale_y)

            # Simpan ukuran baru untuk deteksi tabrakan
            self.width = self.sprite.width
            self.height = self.sprite.height
        else:
            # Jika fallback (Lingkaran Merah)
            self.width = target_size
            self.height = target_size
            # (self.radius dari kode lama tidak dipakai lagi)

        self.sprite.x = self.x
        self.sprite.y = self.y

    def update(self, dt):
        global game_speed_multiplier
        self.x -= (BASE_GAME_SPEED * game_speed_multiplier) * dt
        self.sprite.x = self.x

    def draw(self):
        self.sprite.draw()


# Collectible class
class Collectible:
    def __init__(self, x, y_pos=None, item_type=None):
        self.x = x
        self.y = y_pos if y_pos is not None else (
            window.height / 2 + random.randint(-200, 200))
        self.type = item_type if item_type is not None else random.choice(
            ['collect_1', 'collect_2', 'collect_3', 'collect_4'])

        # --- 1. Ukuran Acak ---
        # Ukuran acak antara 25 s/d 45 piksel
        target_size = random.randint(35, 70)
        # ---------------------------

        # Panggil load_resource seperti biasa
        self.sprite = load_resource(f'assets/images/{self.type}.png', shapes.Triangle, self.x, self.y, self.x +
                                    20, self.y, self.x + 10, self.y + 20, color=(0, 255, 0))

        # Cek apakah load_resource berhasil memuat GAMBAR (Sprite)
        if isinstance(self.sprite, pyglet.sprite.Sprite):

            # --- 2. LOGIKA MENGECILKAN GAMBAR ---
            original_width = self.sprite.image.width
            original_height = self.sprite.image.height

            scale_x = target_size / original_width
            scale_y = target_size / original_height

            self.sprite.scale = min(scale_x, scale_y)

            self.width = self.sprite.width
            self.height = self.sprite.height
        else:
            self.width = 20
            self.height = 20

        # Sinkronkan posisi sprite
        self.sprite.x = self.x
        self.sprite.y = self.y

    # --- METODE YANG HILANG SEBELUMNYA ---
    def update(self, dt):
        global game_speed_multiplier
        self.x -= (BASE_GAME_SPEED * game_speed_multiplier) * dt
        self.sprite.x = self.x

    def draw(self):
        self.sprite.draw()
    # -----------------------------------


# --- inisialisasi asset ---
# assets font
try:
    font_path = resource_path_helper('assets/fonts/OpenSans-SemiBold.ttf')
    pyglet.font.add_file(font_path)
    # Gunakan nama font yang dikonfirmasi
    CUSTOM_FONT_NAME = 'Open Sans'
except Exception as e:
    # Biarkan ini di sini agar label tetap berfungsi (menggunakan default)
    print(f"Gagal memuat font: {e}. Menggunakan font default.")
    CUSTOM_FONT_NAME = None
# asset background
player = Player()
obstacles = []
collectibles = []
background = load_resource(
    'assets/images/bg.png', shapes.Rectangle, 0, 0, 800, 600, color=(100, 150, 200))
# asset audio
try:
    music = load_resource('assets/audio/bg-sound.wav')
    music_player = pyglet.media.Player()
    music_player.queue(music)
    music_player.loop = True
    music_player.play()
    music_player.volume = 0.1
except FileNotFoundError:
    print("Audio file 'gamelan.wav' not found. Playing without music.")

#  --- inisialisasi labels ---
# data teks
language = 0
texts = {
    "title": ["Wave Rider Nusantara", "Penunggang Gelombang Nusantara"],
    "start": ["Please select a language", "Silakan pilih bahasa"],
    "score": ["Score: ", "Skor: "],
    "lives": ["Lives: ", "Nyawa: "],
    "game_over": ["Game Over! Press R to Restart", "Permainan Berakhir! Tekan R untuk Mulai Ulang"],
    "pause": ["Paused - Press P to Resume", "Jeda - Tekan P untuk Lanjut"],
    "instructions": ["Press SPACE to Start. Use ARROW KEYS to move. Press the P key to Pause", "Tekan SPASI untuk Mulai. Gunakan TOMBOL PANAH untuk bergerak. Tekan Tombol P untuk Jeda"],
    "capture_avoid_instructions": ["Help Gatotkaca catch Batik Patterns, Avoid BOMBS!", "Bantu Gatotkaca menangkap Pola Batik, Hindari BOM!"]
}
# pengaturan teks
title_label = pyglet.text.Label(
    texts["title"][language], font_name=CUSTOM_FONT_NAME, font_size=22, x=400, y=550, anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
start_label = pyglet.text.Label(
    texts["start"][language], font_name=CUSTOM_FONT_NAME, font_size=16, x=400, y=480, anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
score_label = pyglet.text.Label(
    "", font_size=18, font_name=CUSTOM_FONT_NAME, x=15, y=550, anchor_x='left', anchor_y='bottom', color=(0, 0, 0, 255))
lives_label = pyglet.text.Label(
    "", font_size=18, font_name=CUSTOM_FONT_NAME, x=15, y=500, anchor_x='left', anchor_y='bottom', color=(0, 0, 0, 255))
game_over_label = pyglet.text.Label(
    "", font_size=24, font_name=CUSTOM_FONT_NAME, x=400, y=300, anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
pause_label = pyglet.text.Label(
    "", font_size=24, font_name=CUSTOM_FONT_NAME, x=400, y=300, anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
instructions_label = pyglet.text.Label(
    texts["instructions"][language], font_size=12, font_name=CUSTOM_FONT_NAME, x=400, y=40, anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
capture_avoid_label = pyglet.text.Label(
    texts["capture_avoid_instructions"][language], font_name=CUSTOM_FONT_NAME, font_size=12, x=400, y=80, anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
lang_button_en = pyglet.text.Label(
    "English", font_size=12, font_name=CUSTOM_FONT_NAME, x=380, y=440,
    anchor_x='right', anchor_y='center', color=(0, 0, 0, 255)
)
lang_button_id = pyglet.text.Label(
    "Indonesia", font_size=12, font_name=CUSTOM_FONT_NAME, x=410, y=440,
    anchor_x='left', anchor_y='center', color=(0, 0, 0, 255)
)


BG_RECT_PADDING = 5
BG_RECT_COLOR = (255, 255, 255, 200)


# membuat shading teks
def draw_background_for_label(label, padding=BG_RECT_PADDING, color=BG_RECT_COLOR, radius=6, store_rect_as=None):
    global button_rects
    if not label.text:
        if store_rect_as and store_rect_as in button_rects:
            del button_rects[store_rect_as]
        return

    rect_width = label.content_width + (2 * padding)
    rect_height = label.content_height + (2 * padding)
    text_center_x = label.x
    if label.anchor_x == 'left':
        text_center_x += label.content_width / 2
    elif label.anchor_x == 'right':
        text_center_x -= label.content_width / 2
    text_center_y = label.y
    if label.anchor_y == 'bottom':
        text_center_y += label.content_height / 2
    elif label.anchor_y == 'top':
        text_center_y -= label.content_height / 2
    rect_x = text_center_x - (rect_width / 2)
    rect_y = text_center_y - (rect_height / 2)
    if store_rect_as:
        button_rects[store_rect_as] = (rect_x, rect_y, rect_width, rect_height)
    pyglet.shapes.RoundedRectangle(
        rect_x, rect_y, rect_width, rect_height, radius=radius, color=color).draw()


# membuat pergantian bahasa
def set_language(lang_id):
    global language
    language = lang_id
    title_label.text = texts["title"][language]
    start_label.text = texts["start"][language]
    instructions_label.text = texts["instructions"][language]
    capture_avoid_label.text = texts["capture_avoid_instructions"][language]


# function update didalam game
def update(dt):
    global state, obstacles, collectibles, game_speed_multiplier

    if state == PLAYING:
        game_speed_multiplier += 0.04 * dt
        player.update(dt)  # Jalankan update player (yang ada timernya)

        # --- Ambil BBox Player sekali saja di awal ---
        player_bbox = get_item_bbox(player)

        # Logika update Obstacle (SUDAH DIPERBAIKI)
        for obs in obstacles[:]:
            obs.update(dt)
            if obs.x < -50:
                obstacles.remove(obs)
            else:
                # Ambil BBox Obstacle
                obs_bbox = get_item_bbox(obs)

                # Cek tabrakan
                if boxes_overlap(player_bbox, obs_bbox):
                    player.lives -= 1
                    obstacles.remove(obs)

                    # --- INI PERBAIKANNYA ---
                    # Panggil fungsi efek dari class Player
                    player.show_hit_effect()

                    if player.lives <= 0:
                        state = GAME_OVER

        # Logika update Collectible (SUDAH DIPERBAIKI)
        for col in collectibles[:]:
            col.update(dt)
            if col.x < -50:
                collectibles.remove(col)
            else:
                # Ambil BBox Collectible
                col_bbox = get_item_bbox(col)

                # Cek tabrakan
                if boxes_overlap(player_bbox, col_bbox):
                    player.score += 10
                    collectibles.remove(col)

                    # --- INI PERBAIKANNYA ---
                    # Panggil fungsi efek dari class Player
                    player.show_collect_effect()

        # --- BAGIAN SPAWN TIDAK SAYA UBAH, SUDAH BENAR ---
        # (Saya biarkan kode spawn apa adanya)

        # Spawn obstacles
        if random.random() < 0.02:
            new_obstacle_x = 850
            new_obstacle_y = window.height / 2 + random.randint(-200, 200)
            # Walaupun class Obstacle tidak pakai radius,
            # ini tetap bisa dipakai untuk cek spawn overlap
            new_obstacle_radius = random.randint(15, 35)
            proposed_obs_bbox = (new_obstacle_x - new_obstacle_radius, new_obstacle_x + new_obstacle_radius,
                                 new_obstacle_y - new_obstacle_radius, new_obstacle_y + new_obstacle_radius)
            overlap_found = False
            for existing_item in obstacles + collectibles:
                if boxes_overlap(proposed_obs_bbox, get_item_bbox(existing_item)):
                    overlap_found = True
                    break
            if not overlap_found:
                obstacles.append(
                    Obstacle(new_obstacle_x, y_pos=new_obstacle_y, radius=new_obstacle_radius))

        # Spawn collectibles
        if random.random() < 0.01:
            new_collectible_x = 850
            new_collectible_y = window.height / 2 + random.randint(-200, 200)
            new_collectible_type = random.choice(
                ['collect_1', 'collect_2', 'collect_3', 'collect_4'])
            # Ukuran 20x20 ini juga untuk cek spawn overlap
            proposed_col_bbox = (new_collectible_x, new_collectible_x + 20,
                                 new_collectible_y, new_collectible_y + 20)
            overlap_found = False
            for existing_item in obstacles + collectibles:
                if boxes_overlap(proposed_col_bbox, get_item_bbox(existing_item)):
                    overlap_found = True
                    break
            if not overlap_found:
                collectibles.append(Collectible(
                    new_collectible_x, y_pos=new_collectible_y, item_type=new_collectible_type))


@window.event
def on_draw():
    window.clear()
    background.draw()

    if state == PLAYING:
        player.draw()
        score_label.text = texts["score"][language] + str(player.score)
        draw_background_for_label(score_label)
        score_label.draw()

        lives_label.text = texts["lives"][language] + str(player.lives)
        draw_background_for_label(lives_label)
        lives_label.draw()

    for obs in obstacles:
        obs.draw()
    for col in collectibles:
        col.draw()

    if state == MENU:
        draw_background_for_label(title_label)
        title_label.draw()
        draw_background_for_label(start_label)
        start_label.draw()

        # --- PERUBAHAN 4: Gambar dua tombol baru dengan warna kuning ---
        # Gambar tombol English
        draw_background_for_label(
            lang_button_en, store_rect_as='btn_en', color=BG_RECT_COLOR)
        lang_button_en.draw()

        # Gambar tombol Indonesia
        draw_background_for_label(
            lang_button_id, store_rect_as='btn_id', color=BG_RECT_COLOR)
        lang_button_id.draw()
        # ---

        draw_background_for_label(instructions_label)
        instructions_label.draw()
        draw_background_for_label(capture_avoid_label)
        capture_avoid_label.draw()
    elif state == PAUSED:
        pause_label.text = texts["pause"][language]
        draw_background_for_label(pause_label)
        pause_label.draw()
    elif state == GAME_OVER:
        game_over_label.text = texts["game_over"][language]
        draw_background_for_label(game_over_label)
        game_over_label.draw()

# Key handling


@window.event
def on_key_press(symbol, modifiers):
    global state, player, game_speed_multiplier, obstacles, collectibles
    keys[symbol] = True
    if symbol == key.SPACE:
        if state == MENU:
            state = PLAYING
    elif symbol == key.P:
        if state == PLAYING:
            state = PAUSED
        elif state == PAUSED:
            state = PLAYING
    elif symbol == key.R and state == GAME_OVER:
        player = Player()
        obstacles = []    # <-- Sekarang membersihkan list GLOBAL
        collectibles = []  # <-- Sekarang membersihkan list GLOBAL
        game_speed_multiplier = 1.0
        state = MENU


# --- PERUBAHAN 5: Modifikasi on_mouse_press untuk menangani dua tombol ---
@window.event
def on_mouse_press(x, y, button, modifiers):
    global state

    # Hanya deteksi klik saat di MENU
    if state == MENU:
        # Periksa apakah tombol 'btn_en' (English) diklik
        if 'btn_en' in button_rects:
            btn_x, btn_y, btn_w, btn_h = button_rects['btn_en']
            if (btn_x < x < btn_x + btn_w) and (btn_y < y < btn_y + btn_h):
                set_language(0)  # Atur bahasa ke English
                return  # Hentikan pengecekan lebih lanjut

        # Periksa apakah tombol 'btn_id' (Indonesia) diklik
        if 'btn_id' in button_rects:
            btn_x, btn_y, btn_w, btn_h = button_rects['btn_id']
            if (btn_x < x < btn_x + btn_w) and (btn_y < y < btn_y + btn_h):
                set_language(1)  # Atur bahasa ke Indonesian
                return
# ---


@window.event
def on_mouse_motion(x, y, dx, dy):
    global state

    # Kita hanya ingin mengubah kursor jika sedang di MENU
    if state == MENU:
        # Cek apakah mouse ada di atas salah satu tombol bahasa
        hovering_a_button = False

        # Periksa tombol 'btn_en' (English)
        if 'btn_en' in button_rects:
            btn_x, btn_y, btn_w, btn_h = button_rects['btn_en']
            if (btn_x < x < btn_x + btn_w) and (btn_y < y < btn_y + btn_h):
                hovering_a_button = True

        # Periksa tombol 'btn_id' (Indonesia)
        if not hovering_a_button and 'btn_id' in button_rects:
            btn_x, btn_y, btn_w, btn_h = button_rects['btn_id']
            if (btn_x < x < btn_x + btn_w) and (btn_y < y < btn_y + btn_h):
                hovering_a_button = True

        # Atur kursor berdasarkan hasil pengecekan
        if hovering_a_button:
            window.set_mouse_cursor(hand_cursor)
        else:
            window.set_mouse_cursor(default_cursor)

    # Jika tidak di MENU (misal sedang PLAYING), pastikan kursor kembali normal
    else:
        window.set_mouse_cursor(default_cursor)


@window.event
def on_key_release(symbol, modifiers):
    keys[symbol] = False


# Schedule updates
pyglet.clock.schedule_interval(update, 1/60)

# Run the game
pyglet.app.run()
