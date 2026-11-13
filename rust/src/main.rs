mod app;
mod game;

use gpui::{App, WindowOptions};
use gpui_platform::application;

use app::GameApp;

fn main() {
    application().run(|cx: &mut App| {
        cx.open_window(WindowOptions::default(), |_, cx| cx.new(GameApp::new))
            .expect("failed to open Wave Rider Nusantara desktop window");
    });
}
