use macroquad::audio::{
    load_sound, play_sound, set_sound_volume, PlaySoundParams, Sound,
};
use macroquad::prelude::*;
use macroquad::rand::gen_range;

const W: f32 = 800.0;
const H: f32 = 600.0;
const BASE_SPEED: f32 = 200.0;
const PLAYER_SPEED: f32 = 300.0;
const TARGET_SIZE: f32 = 70.0;
const HIT_TIME: f32 = 0.3;
const SPAWN_GAP: f32 = 120.0;

#[derive(Clone, Copy, PartialEq, Eq)]
enum GameState { Menu, Playing, Paused, GameOver }
#[derive(Clone, Copy, PartialEq, Eq)]
enum Pose { Idle, Hit, Collect }

struct Player {
    x: f32, y: f32, w: f32, h: f32,
    frame: usize, animation_time: f32, pose_time: f32, pose: Pose,
}
impl Player {
    fn new(w: f32, h: f32) -> Self {
        Self { x: 100.0, y: 300.0, w, h, frame: 0, animation_time: 0.0, pose_time: 0.0, pose: Pose::Idle }
    }
    fn reset(&mut self) {
        let (w, h) = (self.w, self.h);
        *self = Self::new(w, h);
    }
    fn bounds(&self) -> (f32, f32, f32, f32) {
        (self.x + 10.0, self.y + 10.0, (self.w - 20.0).max(1.0), (self.h - 20.0).max(1.0))
    }
    fn react(&mut self, pose: Pose) {
        self.pose = pose;
        self.pose_time = HIT_TIME;
    }
    fn animate(&mut self, dt: f32) {
        if self.pose != Pose::Idle {
            self.pose_time -= dt;
            if self.pose_time <= 0.0 { self.pose = Pose::Idle; }
        } else {
            self.animation_time += dt;
            if self.animation_time >= 0.15 {
                self.frame = 1 - self.frame;
                self.animation_time = 0.0;
            }
        }
    }
}
#[derive(Clone, Copy)]
struct Thing { x: f32, y: f32, w: f32, h: f32 }
#[derive(Clone, Copy)]
struct Collectible { thing: Thing, kind: usize }

struct Assets {
    bg: Texture2D, idle: [Texture2D; 2], hit: Texture2D, collect: Texture2D,
    bomb: Texture2D, batik: [Texture2D; 4], font: Font,
}
async fn texture(path: &str) -> Texture2D {
    let t = load_texture(path).await.unwrap_or_else(|e| panic!("Could not load {path}: {e}"));
    t.set_filter(FilterMode::Linear);
    t
}
async fn assets() -> Assets {
    Assets {
        bg: texture("assets/images/bg.webp").await,
        idle: [texture("assets/images/gatot-1.webp").await, texture("assets/images/gatot-2.webp").await],
        hit: texture("assets/images/gatot-hit.webp").await,
        collect: texture("assets/images/gatot-collect.webp").await,
        bomb: texture("assets/images/bomb.webp").await,
        batik: [
            texture("assets/images/collect-1.webp").await,
            texture("assets/images/collect-2.webp").await,
            texture("assets/images/collect-3.webp").await,
            texture("assets/images/collect-4.webp").await,
        ],
        font: load_ttf_font("assets/fonts/OpenSans-SemiBold.ttf").await.expect("Could not load OpenSans"),
    }
}
fn collision(ax: f32, ay: f32, aw: f32, ah: f32, bx: f32, by: f32, bw: f32, bh: f32) -> bool {
    ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}
fn text(s: &str, x: f32, y: f32, size: u16, color: Color, font: &Font) {
    draw_text_ex(s, x, y, TextParams { font: Some(font), font_size: size, color, ..Default::default() });
}
fn glass(r: Rect, alpha: f32) {
    draw_rectangle(r.x, r.y, r.w, r.h, Color::new(1.0, 1.0, 1.0, alpha));
    draw_rectangle_lines(r.x, r.y, r.w, r.h, 1.0, Color::new(1.0, 1.0, 1.0, 0.55));
}
fn button(s: &str, r: Rect, active: bool, fill: Color, font: &Font, mouse: Vec2, click: bool) -> bool {
    let bg = if active { Color::new(0.07, 0.07, 0.07, 0.98) } else { fill };
    let fg = if active { WHITE } else { Color::new(0.12, 0.12, 0.12, 1.0) };
    draw_rectangle(r.x, r.y, r.w, r.h, bg);
    draw_rectangle_lines(r.x, r.y, r.w, r.h, if active { 2.0 } else { 1.0 }, Color::new(0.85, 0.85, 0.85, 0.95));
    let m = measure_text(s, Some(font), 18, 1.0);
    text(s, r.x + (r.w - m.width) / 2.0, r.y + r.h / 2.0 + m.height / 3.0, 18, fg, font);
    click && r.contains(mouse)
}
fn draw_scene(a: &Assets, p: &Player, bombs: &[Thing], items: &[Collectible], state: GameState) {
    draw_texture_ex(&a.bg, 0.0, 0.0, WHITE, DrawTextureParams { dest_size: Some(vec2(W, H)), ..Default::default() });
    if state == GameState::Menu { return; }
    for item in items {
        draw_texture_ex(&a.batik[item.kind], item.thing.x, item.thing.y, WHITE,
            DrawTextureParams { dest_size: Some(vec2(item.thing.w, item.thing.h)), ..Default::default() });
    }
    for b in bombs {
        draw_texture_ex(&a.bomb, b.x, b.y, WHITE, DrawTextureParams { dest_size: Some(vec2(b.w, b.h)), ..Default::default() });
    }
    let sprite = match p.pose { Pose::Hit => &a.hit, Pose::Collect => &a.collect, Pose::Idle => &a.idle[p.frame] };
    draw_texture_ex(sprite, p.x, p.y, WHITE, DrawTextureParams { dest_size: Some(vec2(p.w, p.h)), ..Default::default() });
}
fn spawn_clear(x: f32, y: f32, bombs: &[Thing], items: &[Collectible]) -> bool {
    bombs.iter().all(|b| (b.x - x).abs() > SPAWN_GAP || (b.y - y).abs() > 80.0)
        && items.iter().all(|i| (i.thing.x - x).abs() > SPAWN_GAP || (i.thing.y - y).abs() > 80.0)
}
fn reset(p: &mut Player, bombs: &mut Vec<Thing>, items: &mut Vec<Collectible>, score: &mut u32, lives: &mut u8, speed: &mut f32) {
    p.reset(); bombs.clear(); items.clear(); *score = 0; *lives = 3; *speed = 1.0;
}

#[macroquad::main("Wave Rider Nusantara")]
async fn main() {
    let a = assets().await;
    let scale_player = (TARGET_SIZE / a.idle[0].width()).min(TARGET_SIZE / a.idle[0].height());
    let mut player = Player::new(a.idle[0].width() * scale_player, a.idle[0].height() * scale_player);
    let mut state = GameState::Menu;
    let mut bombs = Vec::<Thing>::new();
    let mut items = Vec::<Collectible>::new();
    let mut score = 0_u32;
    let mut lives = 3_u8;
    let mut speed = 1.0_f32;
    let mut language = 1_usize;
    let mut muted = false;
    // Preload audio before the start gesture. Awaiting load_sound inside the tap
    // handler can lose the browser's transient user activation and leave WebAudio muted.
    let music: Option<Sound> = match load_sound("assets/audio/bg-sound.ogg").await {
        Ok(sound) => Some(sound),
        Err(error) => { eprintln!("Background audio failed to load: {error}"); None }
    };
    let mut music_started = false;

    loop {
        let dt = get_frame_time().min(0.05);
        let sw = screen_width().max(1.0);
        let sh = screen_height().max(1.0);
        let scale = (sw / W).min(sh / H);
        let vw = W * scale;
        let vh = H * scale;
        let ox = (sw - vw) / 2.0;
        let oy = (sh - vh) / 2.0;
        // Mobile browsers do not consistently synthesize mouse clicks from touch.
        // Read Macroquad's native touch events as well as mouse input.
        let touch_start = touches().into_iter().find(|touch| touch.phase == TouchPhase::Started);
        let touch_click = touch_start.is_some();
        let (mx, my) = touch_start
            .as_ref()
            .map(|touch| (touch.position.x, touch.position.y))
            .unwrap_or_else(mouse_position);
        let mouse = vec2((mx - ox) / scale, (my - oy) / scale);
        let click = is_mouse_button_pressed(MouseButton::Left) || touch_click;

        clear_background(BLACK);
        // Macroquad's display-rect camera uses a bottom-left origin. Use a negative
        // height so our game keeps the web version's top-left, y-down coordinates.
        let mut camera = Camera2D::from_display_rect(Rect::new(0.0, H, W, -H));
        camera.viewport = Some((ox as i32, oy as i32, vw as i32, vh as i32));
        set_camera(&camera);

        if is_key_pressed(KeyCode::M) { muted = !muted; }
        if is_key_pressed(KeyCode::P) {
            state = match state { GameState::Playing => GameState::Paused, GameState::Paused => GameState::Playing, other => other };
        }
        if is_key_pressed(KeyCode::R) && state == GameState::GameOver {
            reset(&mut player, &mut bombs, &mut items, &mut score, &mut lives, &mut speed);
            state = GameState::Menu;
        }

        if state == GameState::Playing {
            speed += 0.03 * dt;
            let scroll = BASE_SPEED * speed;
            let mut dx = 0.0;
            let mut dy = 0.0;
            if is_key_down(KeyCode::Left) || is_key_down(KeyCode::A) { dx -= PLAYER_SPEED * dt; }
            if is_key_down(KeyCode::Right) || is_key_down(KeyCode::D) { dx += PLAYER_SPEED * dt; }
            if is_key_down(KeyCode::Up) || is_key_down(KeyCode::W) { dy -= PLAYER_SPEED * dt; }
            if is_key_down(KeyCode::Down) || is_key_down(KeyCode::S) { dy += PLAYER_SPEED * dt; }
            if sw < 800.0 && is_mouse_button_down(MouseButton::Left) {
                if Rect::new(38.0, 500.0, 58.0, 58.0).contains(mouse) { dx -= PLAYER_SPEED * dt; }
                if Rect::new(154.0, 500.0, 58.0, 58.0).contains(mouse) { dx += PLAYER_SPEED * dt; }
                if Rect::new(96.0, 442.0, 58.0, 58.0).contains(mouse) { dy -= PLAYER_SPEED * dt; }
                if Rect::new(96.0, 500.0, 58.0, 58.0).contains(mouse) { dy += PLAYER_SPEED * dt; }
            }
            player.x = (player.x + dx).clamp(0.0, W - player.w);
            player.y = (player.y + dy).clamp(0.0, H - player.h);
            player.animate(dt);

            let (px, py, pw, ph) = player.bounds();
            for i in (0..bombs.len()).rev() {
                bombs[i].x -= scroll * dt;
                let b = bombs[i];
                if b.x < -100.0 { bombs.remove(i); continue; }
                if player.pose == Pose::Idle && collision(px, py, pw, ph, b.x, b.y, b.w, b.h) {
                    lives = lives.saturating_sub(1);
                    player.react(Pose::Hit);
                    bombs.remove(i);
                    if lives == 0 { state = GameState::GameOver; }
                }
            }
            for i in (0..items.len()).rev() {
                items[i].thing.x -= scroll * dt;
                let item = items[i];
                if item.thing.x < -100.0 { items.remove(i); continue; }
                if collision(px, py, pw, ph, item.thing.x, item.thing.y, item.thing.w, item.thing.h) {
                    score = score.saturating_add(10);
                    player.react(Pose::Collect);
                    items.remove(i);
                }
            }

            let frame_scale = dt * 60.0;
            if gen_range(0.0_f32, 1.0_f32) < 0.02 * frame_scale {
                let size = gen_range(50.0_f32, 80.0_f32);
                let (x, y) = (W + 50.0, gen_range(50.0_f32, H - 100.0));
                if spawn_clear(x, y, &bombs, &items) { bombs.push(Thing { x, y, w: size, h: size }); }
            }
            if gen_range(0.0_f32, 1.0_f32) < 0.015 * frame_scale {
                let size = gen_range(40.0_f32, 60.0_f32);
                let (x, y) = (W + 50.0, gen_range(50.0_f32, H - 100.0));
                if spawn_clear(x, y, &bombs, &items) {
                    items.push(Collectible { thing: Thing { x, y, w: size, h: size }, kind: gen_range(0_usize, 4_usize) });
                }
            }
        }

        if music_started {
            // Audio is optional and must never prevent the game from remaining playable.
            if let Some(sound) = music.as_ref() {
                let volume = if muted || state != GameState::Playing { 0.0 } else { 0.05 };
                set_sound_volume(sound, volume);
            }
        }

        draw_scene(&a, &player, &bombs, &items, state);
        let en = language == 0;
        let dark = Color::new(0.04, 0.04, 0.04, 1.0);
        let translucent = Color::new(1.0, 1.0, 1.0, 0.4);

        match state {
            GameState::Menu => {
                draw_rectangle(0.0, 0.0, W, H, Color::new(0.0, 0.0, 0.0, 0.24));
                glass(Rect::new(140.0, 105.0, 520.0, 390.0), 0.86);
                text(if en { "Wave Rider Nusantara" } else { "Penunggang Gelombang Nusantara" },
                    if en { 226.0 } else { 207.0 }, 165.0, 27, BLACK, &a.font);
                text(if en { "Created by Abu Sofian" } else { "Dibuat oleh Abu Sofian" }, 286.0, 191.0, 14, dark, &a.font);
                if button("English", Rect::new(275.0, 214.0, 120.0, 40.0), en, translucent, &a.font, mouse, click) { language = 0; }
                if button("Indonesia", Rect::new(405.0, 214.0, 120.0, 40.0), !en, translucent, &a.font, mouse, click) { language = 1; }
                text(if en { "Help Gatotkaca catch Batik Patterns, avoid BOMBS!" } else { "Bantu Gatotkaca menangkap Pola Batik, hindari BOM!" },
                    190.0, 294.0, 14, dark, &a.font);
                text(if en { "SPACE to start • ARROWS/WASD to move • P to pause" } else { "SPASI mulai • PANAH/WASD bergerak • P untuk jeda" },
                    183.0, 322.0, 13, dark, &a.font);
                if button(if en { "START" } else { "MULAI" }, Rect::new(300.0, 372.0, 200.0, 54.0), true,
                    Color::new(0.16, 0.65, 0.27, 1.0), &a.font, mouse, click) || is_key_pressed(KeyCode::Space) {
                    state = GameState::Playing;
                    if !music_started {
                        // Start the already-loaded sound directly in the user's tap handler.
                        if let Some(sound) = music.as_ref() {
                            play_sound(sound, PlaySoundParams { looped: true, volume: if muted { 0.0 } else { 0.05 } });
                            music_started = true;
                        }
                    }
                }
            }
            GameState::Playing | GameState::Paused => {
                glass(Rect::new(18.0, 16.0, 174.0, 76.0), 0.4);
                text(&format!("{}: {score}", if en { "Score" } else { "Skor" }), 32.0, 45.0, 18, BLACK, &a.font);
                text(&format!("{}: {lives}", if en { "Lives" } else { "Nyawa" }), 32.0, 73.0, 18, BLACK, &a.font);
                if button(if state == GameState::Paused { if en { "RESUME" } else { "LANJUT" } } else { if en { "PAUSE" } else { "JEDA" } },
                    Rect::new(570.0, 18.0, 88.0, 34.0), state == GameState::Paused, translucent, &a.font, mouse, click) {
                    state = if state == GameState::Playing { GameState::Paused } else { GameState::Playing };
                }
                if sw < 800.0 {
                    for (r, direction) in [
                        (Rect::new(38.0, 500.0, 58.0, 58.0), 0_u8),
                        (Rect::new(154.0, 500.0, 58.0, 58.0), 1_u8),
                        (Rect::new(96.0, 442.0, 58.0, 58.0), 2_u8),
                        (Rect::new(96.0, 500.0, 58.0, 58.0), 3_u8),
                    ] {
                        draw_rectangle(r.x, r.y, r.w, r.h, Color::new(0.0, 0.0, 0.0, 0.68));
                        draw_rectangle_lines(r.x, r.y, r.w, r.h, 2.0, WHITE);
                        // Draw arrows as vector geometry; OpenSans does not guarantee arrow glyphs.
                        let cx = r.x + r.w / 2.0;
                        let cy = r.y + r.h / 2.0;
                        let (start, end, head_a, head_b) = match direction {
                            0 => (vec2(cx + 11.0, cy), vec2(cx - 11.0, cy), vec2(cx - 3.0, cy - 8.0), vec2(cx - 3.0, cy + 8.0)),
                            1 => (vec2(cx - 11.0, cy), vec2(cx + 11.0, cy), vec2(cx + 3.0, cy - 8.0), vec2(cx + 3.0, cy + 8.0)),
                            2 => (vec2(cx, cy + 11.0), vec2(cx, cy - 11.0), vec2(cx - 8.0, cy - 3.0), vec2(cx + 8.0, cy - 3.0)),
                            _ => (vec2(cx, cy - 11.0), vec2(cx, cy + 11.0), vec2(cx - 8.0, cy + 3.0), vec2(cx + 8.0, cy + 3.0)),
                        };
                        draw_line(start.x, start.y, end.x, end.y, 4.0, WHITE);
                        draw_line(end.x, end.y, head_a.x, head_a.y, 4.0, WHITE);
                        draw_line(end.x, end.y, head_b.x, head_b.y, 4.0, WHITE);
                    }
                }
                if state == GameState::Paused {
                    draw_rectangle(0.0, 0.0, W, H, Color::new(0.0, 0.0, 0.0, 0.45));
                    glass(Rect::new(210.0, 205.0, 380.0, 190.0), 0.88);
                    text(if en { "Paused" } else { "Dijeda" }, 340.0, 248.0, 30, BLACK, &a.font);
                    text(if en { "Press P or Resume to continue" } else { "Tekan P atau LANJUT untuk bermain" }, 255.0, 282.0, 14, dark, &a.font);
                    if button(if en { "RESUME" } else { "LANJUT" }, Rect::new(250.0, 320.0, 140.0, 44.0), true, translucent, &a.font, mouse, click) { state = GameState::Playing; }
                    if button(if en { "RESTART" } else { "ULANGI" }, Rect::new(410.0, 320.0, 140.0, 44.0), false, translucent, &a.font, mouse, click) {
                        reset(&mut player, &mut bombs, &mut items, &mut score, &mut lives, &mut speed);
                        state = GameState::Menu;
                    }
                }
            }
            GameState::GameOver => {
                draw_rectangle(0.0, 0.0, W, H, Color::new(0.0, 0.0, 0.0, 0.48));
                glass(Rect::new(210.0, 190.0, 380.0, 220.0), 0.90);
                text(if en { "Game Over!" } else { "Permainan Berakhir!" }, 295.0, 238.0, 30, BLACK, &a.font);
                text(&format!("{}: {score}", if en { "Final score" } else { "Skor akhir" }), 335.0, 275.0, 18, dark, &a.font);
                if button(if en { "RESTART" } else { "ULANGI" }, Rect::new(250.0, 320.0, 140.0, 44.0), true, translucent, &a.font, mouse, click) {
                    reset(&mut player, &mut bombs, &mut items, &mut score, &mut lives, &mut speed);
                    state = GameState::Menu;
                }
                if button("MENU", Rect::new(410.0, 320.0, 140.0, 44.0), false, translucent, &a.font, mouse, click) {
                    reset(&mut player, &mut bombs, &mut items, &mut score, &mut lives, &mut speed);
                    state = GameState::Menu;
                }
            }
        }

        let sound_text = if muted { "SOUND OFF" } else { "SOUND ON" };
        if button(sound_text, Rect::new(670.0, 18.0, 112.0, 34.0), muted, translucent, &a.font, mouse, click) {
            muted = !muted;
        }
        set_default_camera();
        next_frame().await;
    }
}

#[cfg(test)]
mod tests {
    use super::collision;
    #[test]
    fn overlapping_rectangles_collide() {
        assert!(collision(0.0, 0.0, 10.0, 10.0, 5.0, 5.0, 10.0, 10.0));
    }
    #[test]
    fn separated_rectangles_do_not_collide() {
        assert!(!collision(0.0, 0.0, 10.0, 10.0, 20.0, 20.0, 10.0, 10.0));
    }
}
