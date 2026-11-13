use std::{fs::File, path::PathBuf, sync::Arc, time::Duration};

use rodio::{Decoder, DeviceSinkBuilder, MixerDeviceSink, Player};

use async_io::Timer;
use gpui::{
    App, Bounds, Context, Corners, FocusHandle, ImgResourceLoader, InteractiveElement,
    KeyDownEvent, KeyUpEvent, PathBuilder, Pixels, Point, Render, RenderImage, Resource,
    StatefulInteractiveElement, Window, WindowOptions, canvas, div, fill, point, prelude::*, px,
    rgb, rgba, size,
};

use crate::game::{
    CollectibleKind, Direction, GAME_HEIGHT, GAME_WIDTH, Game, GameState, Language, PlayerFeedback,
};

const FRAME_TIME: Duration = Duration::from_millis(16);
const BACKGROUND: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/assets/images/bg.png");
const GATOT_1: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/assets/images/gatot_1.png");
const GATOT_2: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/assets/images/gatot_2.png");
const GATOT_COLLECT: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/assets/images/gatot_collect.png"
);
const GATOT_HIT: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/assets/images/gatot_hit.png");
const BOMB: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/assets/images/bomb.png");
const BATIK_1: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/assets/images/collect_1.png");
const BATIK_2: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/assets/images/collect_2.png");
const BATIK_3: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/assets/images/collect_3.png");
const BATIK_4: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/assets/images/collect_4.png");
const BACKGROUND_MUSIC: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/assets/audio/bg-sound.ogg");

struct AudioController {
    _output: MixerDeviceSink,
    player: Player,
}

impl AudioController {
    fn new() -> Option<Self> {
        let output = match DeviceSinkBuilder::open_default_sink() {
            Ok(output) => output,
            Err(error) => {
                eprintln!("Wave Rider Nusantara: audio output unavailable: {error}");
                return None;
            }
        };
        let file = match File::open(BACKGROUND_MUSIC) {
            Ok(file) => file,
            Err(error) => {
                eprintln!("Wave Rider Nusantara: background music could not be opened: {error}");
                return None;
            }
        };
        let music = match Decoder::new_looped(file) {
            Ok(music) => music,
            Err(error) => {
                eprintln!("Wave Rider Nusantara: background music could not be decoded: {error}");
                return None;
            }
        };

        let player = Player::connect_new(&output.mixer());
        player.set_volume(0.1);
        player.append(music);

        Some(Self {
            _output: output,
            player,
        })
    }

    fn set_muted(&self, muted: bool) {
        self.player.set_volume(if muted { 0.0 } else { 0.1 });
    }
}

fn load_sprite(path: &str, window: &mut Window, cx: &mut App) -> Option<Arc<RenderImage>> {
    let resource: Resource = PathBuf::from(path).into();
    match window.use_asset::<ImgResourceLoader>(&resource, cx) {
        Some(Ok(image)) => Some(image),
        Some(Err(error)) => {
            eprintln!("Wave Rider Nusantara: failed to load image asset {path}: {error}");
            None
        }
        None => {
            eprintln!("Wave Rider Nusantara: image asset is not available yet: {path}");
            None
        }
    }
}

pub struct GameApp {
    game: Game,
    audio: Option<AudioController>,
    focus_handle: FocusHandle,
}

impl GameApp {
    pub fn new(cx: &mut Context<Self>) -> Self {
        let app = Self {
            game: Game::default(),
            audio: AudioController::new(),
            focus_handle: cx.focus_handle().tab_stop(true),
        };
        cx.spawn(async move |weak, cx| {
            loop {
                Timer::after(FRAME_TIME).await;
                if weak
                    .update(cx, |this, cx| {
                        this.game.tick(FRAME_TIME.as_secs_f32());
                        cx.notify();
                    })
                    .is_err()
                {
                    break;
                }
            }
        })
        .detach();
        app
    }

    fn handle_key_down(
        &mut self,
        event: &KeyDownEvent,
        _window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let key = event.keystroke.key.as_str();
        match key {
            "left" | "a" => self.game.set_key(Direction::Left, true),
            "right" | "d" => self.game.set_key(Direction::Right, true),
            "up" | "w" => self.game.set_key(Direction::Up, true),
            "down" | "s" => self.game.set_key(Direction::Down, true),
            "space" => {
                if self.game.state == GameState::Menu {
                    self.game.start();
                }
            }
            "p" => self.game.toggle_pause(),
            "r" => {
                if self.game.state == GameState::GameOver {
                    self.game.restart();
                }
            }
            "m" => self.toggle_mute(),
            _ => {}
        }
        cx.notify();
    }

    fn handle_key_up(&mut self, event: &KeyUpEvent, _window: &mut Window, cx: &mut Context<Self>) {
        match event.keystroke.key.as_str() {
            "left" | "a" => self.game.set_key(Direction::Left, false),
            "right" | "d" => self.game.set_key(Direction::Right, false),
            "up" | "w" => self.game.set_key(Direction::Up, false),
            "down" | "s" => self.game.set_key(Direction::Down, false),
            _ => {}
        }
        cx.notify();
    }

    fn action_button(
        label: &'static str,
        action: impl Fn(&mut Self, &mut Context<Self>) + 'static,
        cx: &Context<Self>,
    ) -> impl IntoElement {
        div()
            .id(label)
            .px_4()
            .py_2()
            .rounded_lg()
            .bg(rgb(0x1e3a8a))
            .text_color(rgb(0xffffff))
            .cursor_pointer()
            .hover(|style| style.bg(rgb(0x2563eb)))
            .child(label)
            .on_click(cx.listener(move |this, _, _, cx| action(this, cx)))
    }

    fn toggle_mute(&mut self) {
        self.game.muted = !self.game.muted;
        if let Some(audio) = &self.audio {
            audio.set_muted(self.game.muted);
        }
    }

    fn choose_language(&mut self, language: Language, cx: &mut Context<Self>) {
        self.game.language = language;
        cx.notify();
    }
}

impl Render for GameApp {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let game_snapshot = GameSnapshot::from(&self.game);
        let title = match self.game.language {
            Language::English => "WAVE RIDER NUSANTARA",
            Language::Indonesian => "PENUNGGANG GELOMBANG NUSANTARA",
        };
        let subtitle = match self.game.language {
            Language::English => "Help Gatotkaca collect Batik patterns and avoid bombs",
            Language::Indonesian => "Bantu Gatotkaca mengumpulkan Pola Batik dan menghindari bom",
        };
        let score_text = match self.game.language {
            Language::English => format!("SCORE  {:05}", self.game.player.score),
            Language::Indonesian => format!("SKOR  {:05}", self.game.player.score),
        };
        let lives_text = match self.game.language {
            Language::English => format!("LIVES  {}", self.game.player.lives),
            Language::Indonesian => format!("NYAWA  {}", self.game.player.lives),
        };
        let state_text = match (self.game.language, self.game.state) {
            (Language::English, GameState::Menu) => "Choose a language, then press SPACE to start",
            (Language::Indonesian, GameState::Menu) => "Pilih bahasa, lalu tekan SPASI untuk mulai",
            (Language::English, GameState::Playing) => "PLAYING • P to pause • M to mute",
            (Language::Indonesian, GameState::Playing) => {
                "BERMAIN • P untuk jeda • M untuk bisukan"
            }
            (Language::English, GameState::Paused) => "PAUSED • Press P to resume",
            (Language::Indonesian, GameState::Paused) => "JEDA • Tekan P untuk melanjutkan",
            (Language::English, GameState::GameOver) => "GAME OVER • Press R to restart",
            (Language::Indonesian, GameState::GameOver) => {
                "PERMAINAN BERAKHIR • Tekan R untuk ulang"
            }
        };

        let language_controls = div()
            .flex()
            .gap_2()
            .child(Self::action_button(
                "English",
                |this, cx| this.choose_language(Language::English, cx),
                cx,
            ))
            .child(Self::action_button(
                "Indonesia",
                |this, cx| this.choose_language(Language::Indonesian, cx),
                cx,
            ));

        let game_controls = div()
            .flex()
            .gap_2()
            .child(Self::action_button(
                "START / SPACE",
                |this, cx| {
                    this.game.start_from_control();
                    cx.notify();
                },
                cx,
            ))
            .child(Self::action_button(
                "PAUSE / P",
                |this, cx| {
                    this.game.toggle_pause();
                    cx.notify();
                },
                cx,
            ))
            .child(Self::action_button(
                "RESTART / R",
                |this, cx| {
                    this.game.restart();
                    cx.notify();
                },
                cx,
            ))
            .child(Self::action_button(
                "SOUND / M",
                |this, cx| {
                    this.toggle_mute();
                    cx.notify();
                },
                cx,
            ));

        div()
            .id("wave-rider-root")
            .track_focus(&self.focus_handle)
            .flex()
            .flex_col()
            .items_center()
            .gap_3()
            .p_4()
            .size_full()
            .bg(rgb(0x071a2e))
            .text_color(rgb(0xf8fafc))
            .on_key_down(cx.listener(Self::handle_key_down))
            .on_key_up(cx.listener(Self::handle_key_up))
            .child(
                div()
                    .text_xl()
                    .font_weight(gpui::FontWeight::BOLD)
                    .child(title),
            )
            .child(div().text_sm().text_color(rgb(0xb6d9ed)).child(subtitle))
            .child(
                div()
                    .flex()
                    .justify_between()
                    .w_full()
                    .max_w(px(800.))
                    .child(
                        div()
                            .text_sm()
                            .font_weight(gpui::FontWeight::BOLD)
                            .child(score_text),
                    )
                    .child(
                        div()
                            .text_sm()
                            .font_weight(gpui::FontWeight::BOLD)
                            .child(lives_text),
                    )
                    .child(div().text_sm().child(if self.audio.is_none() {
                        "SOUND UNAVAILABLE"
                    } else if self.game.muted {
                        "SOUND OFF"
                    } else {
                        "SOUND ON"
                    })),
            )
            .child(
                div()
                    .w_full()
                    .max_w(px(800.))
                    .h(px(600.))
                    .rounded_xl()
                    .overflow_hidden()
                    .child(
                        canvas(
                            move |_, window, cx| {
                                let mut snapshot = game_snapshot.clone();
                                snapshot.background = load_sprite(BACKGROUND, window, cx);
                                snapshot.gatot_1 = load_sprite(GATOT_1, window, cx);
                                snapshot.gatot_2 = load_sprite(GATOT_2, window, cx);
                                snapshot.gatot_collect = load_sprite(GATOT_COLLECT, window, cx);
                                snapshot.gatot_hit = load_sprite(GATOT_HIT, window, cx);
                                snapshot.bomb_sprite = load_sprite(BOMB, window, cx);
                                snapshot.batik_1 = load_sprite(BATIK_1, window, cx);
                                snapshot.batik_2 = load_sprite(BATIK_2, window, cx);
                                snapshot.batik_3 = load_sprite(BATIK_3, window, cx);
                                snapshot.batik_4 = load_sprite(BATIK_4, window, cx);
                                snapshot
                            },
                            move |bounds, snapshot, window, _| {
                                paint_game_scene(bounds, &snapshot, window)
                            },
                        )
                        .size_full(),
                    ),
            )
            .child(div().text_sm().text_color(rgb(0xfde68a)).child(state_text))
            .child(language_controls)
            .child(game_controls)
            .child(
                div().text_xs().text_color(rgb(0x94a3b8)).child(
                    "Controls: Arrow keys / WASD • SPACE start • P pause • R restart • M mute",
                ),
            )
    }
}

#[derive(Clone)]
struct GameSnapshot {
    state: GameState,
    player_x: f32,
    player_y: f32,
    player_feedback: PlayerFeedback,
    animation_frame: usize,
    score: u32,
    lives: u8,
    bombs: Vec<(f32, f32, f32, f32)>,
    collectibles: Vec<(f32, f32, f32, f32, CollectibleKind)>,
    background: Option<Arc<RenderImage>>,
    gatot_1: Option<Arc<RenderImage>>,
    gatot_2: Option<Arc<RenderImage>>,
    gatot_collect: Option<Arc<RenderImage>>,
    gatot_hit: Option<Arc<RenderImage>>,
    bomb_sprite: Option<Arc<RenderImage>>,
    batik_1: Option<Arc<RenderImage>>,
    batik_2: Option<Arc<RenderImage>>,
    batik_3: Option<Arc<RenderImage>>,
    batik_4: Option<Arc<RenderImage>>,
}

impl From<&Game> for GameSnapshot {
    fn from(game: &Game) -> Self {
        Self {
            state: game.state,
            player_x: game.player.x,
            player_y: game.player.y,
            player_feedback: game.player.feedback,
            animation_frame: game.player.animation_frame,
            score: game.player.score,
            lives: game.player.lives,
            bombs: game
                .bombs
                .iter()
                .map(|item| (item.x, item.y, item.width, item.height))
                .collect(),
            collectibles: game
                .collectibles
                .iter()
                .map(|item| (item.x, item.y, item.width, item.height, item.kind))
                .collect(),
            background: None,
            gatot_1: None,
            gatot_2: None,
            gatot_collect: None,
            gatot_hit: None,
            bomb_sprite: None,
            batik_1: None,
            batik_2: None,
            batik_3: None,
            batik_4: None,
        }
    }
}

fn scaled_point(bounds: Bounds<Pixels>, x: f32, y: f32) -> Point<Pixels> {
    let scale_x = f32::from(bounds.size.width) / GAME_WIDTH;
    let scale_y = f32::from(bounds.size.height) / GAME_HEIGHT;
    point(
        bounds.origin.x + px(x * scale_x),
        bounds.origin.y + px(y * scale_y),
    )
}

fn paint_rect(
    bounds: Bounds<Pixels>,
    window: &mut Window,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    color: gpui::Rgba,
) {
    let origin = scaled_point(bounds, x, y);
    let scale_x = f32::from(bounds.size.width) / GAME_WIDTH;
    let scale_y = f32::from(bounds.size.height) / GAME_HEIGHT;
    window.paint_quad(fill(
        Bounds {
            origin,
            size: size(px(width * scale_x), px(height * scale_y)),
        },
        color,
    ));
}

fn paint_circle(
    bounds: Bounds<Pixels>,
    window: &mut Window,
    x: f32,
    y: f32,
    diameter: f32,
    color: gpui::Rgba,
) {
    let center = scaled_point(bounds, x + diameter / 2.0, y + diameter / 2.0);
    let scale = f32::from(bounds.size.width) / GAME_WIDTH;
    let radius = diameter * scale / 2.0;
    let mut path = PathBuilder::fill();
    for step in 0..24 {
        let angle = step as f32 * std::f32::consts::TAU / 24.0;
        let point = point(
            center.x + px(angle.cos() * radius),
            center.y + px(angle.sin() * radius),
        );
        if step == 0 {
            path.move_to(point);
        } else {
            path.line_to(point);
        }
    }
    path.close();
    if let Ok(path) = path.build() {
        window.paint_path(path, color);
    }
}

fn paint_diamond(
    bounds: Bounds<Pixels>,
    window: &mut Window,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    color: gpui::Rgba,
) {
    let top = scaled_point(bounds, x + width / 2.0, y);
    let right = scaled_point(bounds, x + width, y + height / 2.0);
    let bottom = scaled_point(bounds, x + width / 2.0, y + height);
    let left = scaled_point(bounds, x, y + height / 2.0);
    let mut path = PathBuilder::fill();
    path.move_to(top);
    path.line_to(right);
    path.line_to(bottom);
    path.line_to(left);
    path.close();
    if let Ok(path) = path.build() {
        window.paint_path(path, color);
    }
}

fn paint_sprite(
    bounds: Bounds<Pixels>,
    window: &mut Window,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    sprite: &Option<Arc<RenderImage>>,
) {
    if let Some(sprite) = sprite {
        let origin = scaled_point(bounds, x, y);
        let sx = f32::from(bounds.size.width) / GAME_WIDTH;
        let sy = f32::from(bounds.size.height) / GAME_HEIGHT;
        let image_bounds = Bounds {
            origin,
            size: size(px(width * sx), px(height * sy)),
        };
        let _ = window.paint_image(
            image_bounds,
            image_bounds,
            Corners::default(),
            sprite.clone(),
            0,
            false,
        );
    }
}

fn paint_game_scene(bounds: Bounds<Pixels>, game: &GameSnapshot, window: &mut Window) {
    paint_rect(
        bounds,
        window,
        0.0,
        0.0,
        GAME_WIDTH,
        GAME_HEIGHT,
        rgb(0x0b3550),
    );
    if game.background.is_some() {
        paint_sprite(
            bounds,
            window,
            0.0,
            0.0,
            GAME_WIDTH,
            GAME_HEIGHT,
            &game.background,
        );
    } else {
        paint_rect(bounds, window, 0.0, 0.0, GAME_WIDTH, 95.0, rgb(0x102b46));
        paint_rect(bounds, window, 0.0, 500.0, GAME_WIDTH, 100.0, rgb(0x0a263e));
        for index in 0..8 {
            let x = index as f32 * 120.0 - 30.0;
            paint_rect(bounds, window, x, 100.0, 2.0, 400.0, rgb(0x164a63));
        }
        for index in 0..7 {
            let y = 130.0 + index as f32 * 60.0;
            paint_rect(bounds, window, 0.0, y, GAME_WIDTH, 1.0, rgb(0x164a63));
        }
    }

    for (x, y, width, height) in &game.bombs {
        if game.bomb_sprite.is_some() {
            paint_sprite(bounds, window, *x, *y, *width, *height, &game.bomb_sprite);
        } else {
            paint_circle(bounds, window, *x, *y, *width, rgb(0x1f2937));
            paint_circle(
                bounds,
                window,
                *x + width * 0.25,
                *y + height * 0.25,
                width * 0.22,
                rgb(0xef4444),
            );
        }
    }

    for (x, y, width, height, kind) in &game.collectibles {
        let sprite = match kind {
            CollectibleKind::Batik1 => &game.batik_1,
            CollectibleKind::Batik2 => &game.batik_2,
            CollectibleKind::Batik3 => &game.batik_3,
            CollectibleKind::Batik4 => &game.batik_4,
        };
        if sprite.is_some() {
            paint_sprite(bounds, window, *x, *y, *width, *height, sprite);
        } else {
            let color = match kind {
                CollectibleKind::Batik1 => rgb(0xfbbf24),
                CollectibleKind::Batik2 => rgb(0x34d399),
                CollectibleKind::Batik3 => rgb(0xf472b6),
                CollectibleKind::Batik4 => rgb(0x60a5fa),
            };
            paint_diamond(bounds, window, *x, *y, *width, *height, color);
            paint_diamond(
                bounds,
                window,
                *x + width * 0.22,
                *y + height * 0.22,
                *width * 0.56,
                *height * 0.56,
                rgb(0x7c2d12),
            );
        }
    }

    let player_sprite = match game.player_feedback {
        PlayerFeedback::Normal => {
            if game.animation_frame == 0 {
                &game.gatot_1
            } else {
                &game.gatot_2
            }
        }
        PlayerFeedback::Hit => &game.gatot_hit,
        PlayerFeedback::Collect => &game.gatot_collect,
    };
    if player_sprite.is_some() {
        paint_sprite(
            bounds,
            window,
            game.player_x,
            game.player_y,
            70.0,
            70.0,
            player_sprite,
        );
    } else {
        paint_rect(
            bounds,
            window,
            game.player_x,
            game.player_y,
            70.0,
            70.0,
            rgb(0xf59e0b),
        );
    }

    if game.state == GameState::Menu {
        // Keep the original scene visible behind a translucent glass-like menu.
        // The previous opaque full-screen overlay hid the background image entirely.
        paint_rect(
            bounds,
            window,
            80.0,
            112.0,
            640.0,
            376.0,
            rgba(0xeaf8ffcc),
        );
        // Subtle inner highlight and lower edge recreate the soft glass-panel frame.
        paint_rect(bounds, window, 82.0, 114.0, 636.0, 2.0, rgba(0xffffffff));
        paint_rect(bounds, window, 82.0, 484.0, 636.0, 2.0, rgba(0xb9e7f4cc));
    } else if game.state == GameState::Paused || game.state == GameState::GameOver {
        paint_rect(
            bounds,
            window,
            0.0,
            0.0,
            GAME_WIDTH,
            GAME_HEIGHT,
            rgb(0x091827),
        );
        paint_rect(
            bounds,
            window,
            130.0,
            180.0,
            540.0,
            240.0,
            if game.state == GameState::Paused {
                rgb(0x1e3a5f)
            } else {
                rgb(0x7f1d1d)
            },
        );
    }

    // HUD is rendered as vector bars so it remains crisp at any scale.
    let score_meter = (game.score as f32 / 10.0).min(50.0) * 8.0;
    paint_rect(bounds, window, 20.0, 20.0, 160.0, 8.0, rgb(0x1e293b));
    paint_rect(bounds, window, 20.0, 20.0, score_meter, 8.0, rgb(0xfbbf24));
    for life in 0..game.lives {
        paint_circle(
            bounds,
            window,
            730.0 - life as f32 * 24.0,
            20.0,
            16.0,
            rgb(0xef4444),
        );
    }
}
