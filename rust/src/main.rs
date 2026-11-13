mod app;
mod game;

use std::{borrow::Cow, fs};

use gpui::{App, AppContext, AssetSource, SharedString, WindowOptions};
use gpui_platform::application;

use app::GameApp;

struct Assets;

impl AssetSource for Assets {
    fn load(&self, path: &str) -> anyhow::Result<Option<Cow<'static, [u8]>>> {
        match fs::read(path) {
            Ok(bytes) => {
                eprintln!(
                    "Wave Rider Nusantara: loaded asset {path} ({} bytes)",
                    bytes.len()
                );
                Ok(Some(Cow::Owned(bytes)))
            }
            Err(error) => {
                eprintln!("Wave Rider Nusantara: asset read failed for {path}: {error}");
                Err(error.into())
            }
        }
    }

    fn list(&self, path: &str) -> anyhow::Result<Vec<SharedString>> {
        Ok(fs::read_dir(path)?
            .filter_map(|entry| entry.ok())
            .map(|entry| SharedString::from(entry.path().to_string_lossy().into_owned()))
            .collect())
    }
}

fn main() {
    application().with_assets(Assets).run(|cx: &mut App| {
        cx.open_window(WindowOptions::default(), |_, cx| cx.new(GameApp::new))
            .expect("failed to open Wave Rider Nusantara desktop window");
    });
}
