use gpui::{App, Context, IntoElement, Render, Window, div, prelude::*, px, rgb};
use gpui_platform::application;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Screen {
    Menu,
    Playing,
    Paused,
    GameOver,
}

#[derive(Debug)]
struct GameModel {
    screen: Screen,
    score: u32,
    lives: u8,
    player_x: i32,
    player_y: i32,
    muted: bool,
    language: Language,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Language {
    English,
    Indonesian,
}

impl Default for GameModel {
    fn default() -> Self {
        Self {
            screen: Screen::Menu,
            score: 0,
            lives: 3,
            player_x: 1,
            player_y: 1,
            muted: false,
            language: Language::Indonesian,
        }
    }
}

impl GameModel {
    fn reset(&mut self) {
        self.score = 0;
        self.lives = 3;
        self.player_x = 1;
        self.player_y = 1;
        self.screen = Screen::Menu;
    }

    fn move_player(&mut self, dx: i32, dy: i32) {
        self.player_x = (self.player_x + dx).clamp(0, 7);
        self.player_y = (self.player_y + dy).clamp(0, 5);
    }

    fn collect_batik(&mut self) {
        self.score = self.score.saturating_add(10);
    }

    fn hit_bomb(&mut self) {
        self.lives = self.lives.saturating_sub(1);
        if self.lives == 0 {
            self.screen = Screen::GameOver;
        }
    }
}

struct WaveRiderApp {
    game: GameModel,
}

impl WaveRiderApp {
    fn new() -> Self {
        Self { game: GameModel::default() }
    }

    fn action_button(
        label: &'static str,
        action: impl Fn(&mut Self, &mut Context<Self>) + 'static,
        cx: &Context<Self>,
    ) -> impl IntoElement {
        div()
            .px_4()
            .py_3()
            .rounded_lg()
            .bg(rgb(0x1d4ed8))
            .text_color(rgb(0xffffff))
            .cursor_pointer()
            .child(label)
            .on_click(cx.listener(move |this, _, _, cx| action(this, cx)))
    }
}

impl Render for WaveRiderApp {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let (title, subtitle, start_label, score_label, lives_label) = match self.game.language {
            Language::English => (
                "Wave Rider Nusantara",
                "Help Gatotkaca collect Batik Patterns and avoid bombs.",
                "START / RESUME",
                "Score",
                "Lives",
            ),
            Language::Indonesian => (
                "Penunggang Gelombang Nusantara",
                "Bantu Gatotkaca mengumpulkan Pola Batik dan menghindari bom.",
                "MULAI / LANJUT",
                "Skor",
                "Nyawa",
            ),
        };

        let scene = div()
            .flex()
            .flex_col()
            .items_center()
            .justify_center()
            .gap_4()
            .w_full()
            .h(px(360.))
            .rounded_xl()
            .bg(rgb(0x0f766e))
            .text_color(rgb(0xffffff))
            .child(
                div().text_2xl().child("🌊  🏄  🌊")
            )
            .child(
                div().text_xl().child(format!(
                    "Gatotkaca  •  Batik  •  BOM  •  {}",
                    if self.game.muted { "Audio: Muted" } else { "Audio: On" }
                ))
            )
            .child(format!(
                "Player position: ({}, {})",
                self.game.player_x, self.game.player_y
            ));

        let stats = div()
            .flex()
            .gap_4()
            .child(
                div().px_4().py_3().rounded_lg().bg(rgb(0xe2e8f0)).text_color(rgb(0x0f172a))
                    .child(format!("{score_label}: {}", self.game.score))
            )
            .child(
                div().px_4().py_3().rounded_lg().bg(rgb(0xfecaca)).text_color(rgb(0x7f1d1d))
                    .child(format!("{lives_label}: {}", self.game.lives))
            );

        let controls = div()
            .flex()
            .flex_wrap()
            .justify_center()
            .gap_2()
            .child(Self::action_button("←", |this, cx| {
                this.game.move_player(-1, 0);
                cx.notify();
            }, cx))
            .child(Self::action_button("↑", |this, cx| {
                this.game.move_player(0, -1);
                cx.notify();
            }, cx))
            .child(Self::action_button("↓", |this, cx| {
                this.game.move_player(0, 1);
                cx.notify();
            }, cx))
            .child(Self::action_button("→", |this, cx| {
                this.game.move_player(1, 0);
                cx.notify();
            }, cx));

        let game_actions = div()
            .flex()
            .flex_wrap()
            .justify_center()
            .gap_2()
            .child(Self::action_button(start_label, |this, cx| {
                this.game.screen = Screen::Playing;
                cx.notify();
            }, cx))
            .child(Self::action_button("Collect Batik +10", |this, cx| {
                if this.game.screen == Screen::Playing {
                    this.game.collect_batik();
                }
                cx.notify();
            }, cx))
            .child(Self::action_button("Bomb −1 life", |this, cx| {
                if this.game.screen == Screen::Playing {
                    this.game.hit_bomb();
                }
                cx.notify();
            }, cx))
            .child(Self::action_button("Pause", |this, cx| {
                this.game.screen = if this.game.screen == Screen::Playing {
                    Screen::Paused
                } else {
                    Screen::Playing
                };
                cx.notify();
            }, cx))
            .child(Self::action_button("Mute / Unmute", |this, cx| {
                this.game.muted = !this.game.muted;
                cx.notify();
            }, cx))
            .child(Self::action_button("Restart", |this, cx| {
                this.game.reset();
                cx.notify();
            }, cx));

        let language_actions = div()
            .flex()
            .gap_2()
            .child(Self::action_button("English", |this, cx| {
                this.game.language = Language::English;
                cx.notify();
            }, cx))
            .child(Self::action_button("Indonesia", |this, cx| {
                this.game.language = Language::Indonesian;
                cx.notify();
            }, cx));

        let status = match self.game.screen {
            Screen::Menu => "Menu",
            Screen::Playing => "Playing",
            Screen::Paused => "Paused",
            Screen::GameOver => "Game Over — restart to play again",
        };

        div()
            .flex()
            .flex_col()
            .items_center()
            .gap_4()
            .p_6()
            .bg(rgb(0xf8fafc))
            .text_color(rgb(0x0f172a))
            .size_full()
            .child(div().text_2xl().font_weight(gpui::FontWeight::BOLD).child(title))
            .child(div().text_sm().child(subtitle))
            .child(div().text_sm().child(format!("State: {status}")))
            .child(scene)
            .child(stats)
            .child(controls)
            .child(game_actions)
            .child(language_actions)
    }
}

fn main() {
    application().run(|cx: &mut App| {
        cx.open_window(gpui::WindowOptions::default(), |_, cx| {
            cx.new(|_| WaveRiderApp::new())
        })
        .expect("failed to open the native GPUI window");
    });
}

#[cfg(test)]
mod tests {
    use super::{GameModel, Screen};

    #[test]
    fn collecting_batik_increases_score_by_ten() {
        let mut game = GameModel::default();
        game.collect_batik();
        assert_eq!(game.score, 10);
    }

    #[test]
    fn bomb_reduces_lives_and_game_ends_at_zero() {
        let mut game = GameModel::default();
        game.hit_bomb();
        assert_eq!(game.lives, 2);
        game.hit_bomb();
        game.hit_bomb();
        assert_eq!(game.lives, 0);
        assert_eq!(game.screen, Screen::GameOver);
    }

    #[test]
    fn player_movement_is_bounded() {
        let mut game = GameModel::default();
        game.move_player(-99, 99);
        assert_eq!((game.player_x, game.player_y), (0, 5));
    }
}
