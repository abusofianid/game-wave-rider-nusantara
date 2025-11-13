import pyglet
from pyglet import shapes
from pyglet.window import key
import random
import os
import sys

# perintah compile: pyinstaller --name WaveRiderNusantara --windowed --add-data "bima.png;."  --add-data "batik.png;." main.py

# --- Tambahkan ini untuk menemukan direktori skrip ---
# script_dir = os.path.dirname(os.path.abspath(__file__))

# Helper function to load image or fallback to shape


def resource_path_helper(relative_path):
    """ Mendapatkan path absolut ke resource, berfungsi untuk mode dev dan PyInstaller """
    try:
        # PyInstaller membuat folder temp dan menyimpan path di _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        # _MEIPASS tidak di-set, jadi kita dalam mode pengembangan (dev)
        base_path = os.path.abspath(os.path.dirname(__file__))

    return os.path.join(base_path, relative_path)

# batas


def load_resource(filename, shape_func=None, *args, **kwargs):
    # Buat path absolut ke file resource MENGGUNAKAN HELPER
    resource_path = resource_path_helper(filename)
    try:
        # Coba muat sebagai gambar terlebih dahulu
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

# Helper to get bounding box for any game object (Player, Obstacle, Collectible)


def get_item_bbox(item):
    if isinstance(item, Player):
        return (item.x, item.x + item.player_width, item.y, item.y + item.player_height)
    elif isinstance(item, Obstacle):
        # Untuk obstacle (lingkaran), bbox dihitung dari pusat dan radius
        return (item.x - item.radius, item.x + item.radius, item.y - item.radius, item.y + item.radius)
    elif isinstance(item, Collectible):
        # Untuk collectible, bbox dihitung dari x,y dan width/height yang disimpan
        return (item.x, item.x + item.width, item.y, item.y + item.height)
    return (0, 0, 0, 0)  # Should not happen for game objects

# Helper to check if two bounding boxes overlap


def boxes_overlap(box1, box2):
    l1, r1, b1, t1 = box1
    l2, r2, b2, t2 = box2
    return l1 < r2 and r1 > l2 and b1 < t2 and t1 > b2

# --- Inisialisasi Variabel Global ---


# Pengaturan Window
window = pyglet.window.Window(800, 600, "Wave Rider Nusantara")
window.set_caption(
    "Wave Rider Nusantara - Ride the Cultural Waves of Indonesia")

# Penanganan status tombol manual
keys = {}

# Game speed multiplier (increases over time)
game_speed_multiplier = 1.0
BASE_GAME_SPEED = 200  # Kecepatan dasar obstacle/collectible
PLAYER_BASE_SPEED = 5  # Kecepatan dasar player

# Pilihan Bahasa (0: English, 1: Indonesian)
language = 0
texts = {
    "title": ["Wave Rider Nusantara", "Penunggang Gelombang Nusantara"],
    "start": ["Press SPACE to Start", "Tekan SPASI untuk Mulai"],
    # "lang_select" dihapus karena kita menggunakan tombol terpisah
    "score": ["Score: ", "Skor: "],
    "lives": ["Lives: ", "Nyawa: "],
    "game_over": ["Game Over! Press R to Restart", "Permainan Berakhir! Tekan R untuk Mulai Ulang"],
    "pause": ["Paused - Press P to Resume", "Jeda - Tekan P untuk Lanjut"],
    "instructions": ["Use ARROW KEYS to move. Collect cultural items!", "Gunakan TOMBOL PANAH untuk bergerak. Kumpulkan item budaya!"],
    "capture_avoid_instructions": ["Catch GREEN triangles, Avoid RED circles!", "Tangkap segitiga HIJAU, Hindari lingkaran MERAH!"]
}

# Status Game
MENU = 0
PLAYING = 1
PAUSED = 2
GAME_OVER = 3
state = MENU

# Dictionary untuk menyimpan koordinat tombol yang bisa diklik
button_rects = {}

# Player class (Character: Bima from Java, with Batik-inspired design)


class Player:
    def __init__(self):
        self.x = 100
        self.y = 300
        target_width = 70
        target_height = 70
        self.sprite = load_resource(
            'bima.png', shapes.Rectangle, self.x, self.y, target_width, target_height, color=(255, 200, 100))
        if isinstance(self.sprite, pyglet.sprite.Sprite):
            original_width = self.sprite.image.width
            original_height = self.sprite.image.height
            scale_x = target_width / original_width
            scale_y = target_height / original_height
            self.sprite.scale = min(scale_x, scale_y)
            self.player_width = self.sprite.width
            self.player_height = self.sprite.height
        else:
            self.player_width = target_width
            self.player_height = target_height
        self.lives = 3
        self.score = 0

    def update(self, dt):
        global game_speed_multiplier
        current_player_speed = PLAYER_BASE_SPEED * game_speed_multiplier
        if keys.get(key.LEFT, False):
            self.x -= current_player_speed
        if keys.get(key.RIGHT, False):
            self.x += current_player_speed
        if keys.get(key.UP, False):
            self.y += current_player_speed
        if keys.get(key.DOWN, False):
            self.y -= current_player_speed
        if self.x < 0:
            self.x = 0
        if self.x > 800 - self.player_width:
            self.x = 800 - self.player_width
        if self.y < 0:
            self.y = 0
        if self.y > 600 - self.player_height:
            self.y = 600 - self.player_height
        self.sprite.x = self.x
        self.sprite.y = self.y

    def draw(self):
        self.sprite.draw()

# Obstacle class


class Obstacle:
    def __init__(self, x, y_pos=None, radius=None):
        self.x = x
        self.y = y_pos if y_pos is not None else (
            window.height / 2 + random.randint(-200, 200))
        self.radius = radius if radius is not None else random.randint(15, 35)
        obstacle_color = (255, 0, 0)
        self.sprite = load_resource(
            'coral.png', shapes.Circle, self.x, self.y, self.radius, color=obstacle_color)
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
            ['wayang', 'gamelan'])
        self.sprite = load_resource(f'{self.type}.png', shapes.Triangle, self.x, self.y, self.x +
                                    20, self.y, self.x + 10, self.y + 20, color=(0, 255, 0))
        self.width = 20
        self.height = 20
        if isinstance(self.sprite, pyglet.sprite.Sprite):
            self.width = self.sprite.width
            self.height = self.sprite.height
        self.sprite.x = self.x
        self.sprite.y = self.y

    def update(self, dt):
        global game_speed_multiplier
        self.x -= (BASE_GAME_SPEED * game_speed_multiplier) * dt
        self.sprite.x = self.x

    def draw(self):
        self.sprite.draw()


# Game objects
player = Player()
obstacles = []
collectibles = []
background = load_resource('batik.png', shapes.Rectangle, 0, 0, 800, 600, color=(
    100, 150, 200))

# Audio
try:
    music = load_resource('gamelan.wav')
    music_player = pyglet.media.Player()
    music_player.queue(music)
    music_player.loop = True
    music_player.play()
except FileNotFoundError:
    print("Audio file 'gamelan.wav' not found. Playing without music.")

# Labels
title_label = pyglet.text.Label(
    texts["title"][language], font_size=28, x=400, y=460, anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
start_label = pyglet.text.Label(
    texts["start"][language], font_size=20, x=400, y=400, anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
score_label = pyglet.text.Label(
    "", font_size=18, x=15, y=550, anchor_x='left', anchor_y='bottom', color=(0, 0, 0, 255))
lives_label = pyglet.text.Label(
    "", font_size=18, x=15, y=500, anchor_x='left', anchor_y='bottom', color=(0, 0, 0, 255))
game_over_label = pyglet.text.Label(
    "", font_size=24, x=400, y=300, anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
pause_label = pyglet.text.Label(
    "", font_size=24, x=400, y=300, anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
instructions_label = pyglet.text.Label(
    texts["instructions"][language], font_size=16, x=400, y=100, anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
capture_avoid_label = pyglet.text.Label(
    texts["capture_avoid_instructions"][language], font_size=16, x=400, y=200, anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))

# --- PERUBAHAN 1: Buat dua label tombol baru ---
# Posisikan di y=350, sedikit berjarak dari pusat (x=400)
lang_button_en = pyglet.text.Label(
    "English", font_size=18, x=380, y=350,
    anchor_x='right', anchor_y='center', color=(0, 0, 0, 255)
)
lang_button_id = pyglet.text.Label(
    "Indonesia", font_size=18, x=420, y=350,
    anchor_x='left', anchor_y='center', color=(0, 0, 0, 255)
)
# ---

# Constants for background rectangles
BG_RECT_PADDING = 5
BG_RECT_COLOR = (255, 255, 255, 200)
# --- PERUBAHAN 2: Tentukan warna tombol kuning ---
BUTTON_COLOR = (255, 255, 0, 200)  # Kuning dengan transparansi
# ---


# Helper function untuk menggambar latar belakang (sudah bisa menerima warna)
def draw_background_for_label(label, padding=BG_RECT_PADDING, color=BG_RECT_COLOR, radius=10, store_rect_as=None):
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


# --- PERUBAHAN 3: Buat helper function untuk mengubah bahasa ---
def set_language(lang_id):
    global language
    language = lang_id
    title_label.text = texts["title"][language]
    start_label.text = texts["start"][language]
    instructions_label.text = texts["instructions"][language]
    capture_avoid_label.text = texts["capture_avoid_instructions"][language]
# ---


# Update function
def update(dt):
    global state, obstacles, collectibles, game_speed_multiplier

    if state == PLAYING:
        game_speed_multiplier += 0.04 * dt
        player.update(dt)

        # Logika update Obstacle
        for obs in obstacles[:]:
            obs.update(dt)
            if obs.x < -50:
                obstacles.remove(obs)
            else:
                p_left = player.x
                p_right = player.x + player.player_width
                p_bottom = player.y
                p_top = player.y + player.player_height
                if isinstance(obs.sprite, pyglet.sprite.Sprite):
                    o_left = obs.sprite.x
                    o_right = obs.sprite.x + obs.sprite.width
                    o_bottom = obs.sprite.y
                    o_top = obs.sprite.y + obs.sprite.height
                else:
                    o_center_x = obs.sprite.x
                    o_center_y = obs.sprite.y
                    o_radius = obs.sprite.radius
                    o_left = o_center_x - o_radius
                    o_right = o_center_x + o_radius
                    o_bottom = o_center_y - o_radius
                    o_top = o_center_y + o_radius
                if p_left < o_right and p_right > o_left and p_bottom < o_top and p_top > o_bottom:
                    player.lives -= 1
                    obstacles.remove(obs)
                    if player.lives <= 0:
                        state = GAME_OVER

        # Logika update Collectible
        for col in collectibles[:]:
            col.update(dt)
            if col.x < -50:
                collectibles.remove(col)
            else:
                p_left = player.x
                p_right = player.x + player.player_width
                p_bottom = player.y
                p_top = player.y + player.player_height
                if isinstance(col.sprite, pyglet.sprite.Sprite):
                    c_left = col.sprite.x
                    c_right = col.sprite.x + col.sprite.width
                    c_bottom = col.sprite.y
                    c_top = col.sprite.y + col.sprite.height
                else:
                    c_left = col.x
                    c_right = col.x + 20
                    c_bottom = col.y
                    c_top = col.y + 20
                if p_left < c_right and p_right > c_left and p_bottom < c_top and p_top > c_bottom:
                    player.score += 10
                    collectibles.remove(col)

        # Spawn obstacles
        if random.random() < 0.02:
            new_obstacle_x = 850
            new_obstacle_y = window.height / 2 + random.randint(-200, 200)
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
            new_collectible_type = random.choice(['wayang', 'gamelan'])
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

# Draw function


@window.event
def on_draw():
    window.clear()
    background.draw()

    if state == PLAYING:
        player.draw()

    for obs in obstacles:
        obs.draw()
    for col in collectibles:
        col.draw()

    score_label.text = texts["score"][language] + str(player.score)
    draw_background_for_label(score_label)
    score_label.draw()

    lives_label.text = texts["lives"][language] + str(player.lives)
    draw_background_for_label(lives_label)
    lives_label.draw()

    if state == MENU:
        draw_background_for_label(title_label)
        title_label.draw()
        draw_background_for_label(start_label)
        start_label.draw()

        # --- PERUBAHAN 4: Gambar dua tombol baru dengan warna kuning ---
        # Gambar tombol English
        draw_background_for_label(
            lang_button_en, store_rect_as='btn_en', color=BUTTON_COLOR)
        lang_button_en.draw()

        # Gambar tombol Indonesia
        draw_background_for_label(
            lang_button_id, store_rect_as='btn_id', color=BUTTON_COLOR)
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
    global state, player, game_speed_multiplier
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
        obstacles = []
        collectibles = []
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
def on_key_release(symbol, modifiers):
    keys[symbol] = False


# Schedule updates
pyglet.clock.schedule_interval(update, 1/60)

# Run the game
pyglet.app.run()
