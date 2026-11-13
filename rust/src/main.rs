mod app;
mod game;

use std::borrow::Cow;

use gpui::{App, AppContext, AssetSource, SharedString, WindowOptions};
use gpui_platform::application;

use app::GameApp;

struct Assets;

impl AssetSource for Assets {
    fn load(&self, path: &str) -> anyhow::Result<Option<Cow<'static, [u8]>>> {
        let bytes: &'static [u8] = match path {
            "assets/images/bg.png" => {
                include_bytes!(concat!(env!("CARGO_MANIFEST_DIR"), "/assets/images/bg.png"))
            }
            "assets/images/gatot_1.png" => include_bytes!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/assets/images/gatot_1.png"
            )),
            "assets/images/gatot_2.png" => include_bytes!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/assets/images/gatot_2.png"
            )),
            "assets/images/gatot_collect.png" => include_bytes!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/assets/images/gatot_collect.png"
            )),
            "assets/images/gatot_hit.png" => include_bytes!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/assets/images/gatot_hit.png"
            )),
            "assets/images/bomb.png" => include_bytes!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/assets/images/bomb.png"
            )),
            "assets/images/collect_1.png" => include_bytes!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/assets/images/collect_1.png"
            )),
            "assets/images/collect_2.png" => include_bytes!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/assets/images/collect_2.png"
            )),
            "assets/images/collect_3.png" => include_bytes!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/assets/images/collect_3.png"
            )),
            "assets/images/collect_4.png" => include_bytes!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/assets/images/collect_4.png"
            )),
            _ => return Ok(None),
        };

        eprintln!(
            "Wave Rider Nusantara: loaded embedded asset {path} ({} bytes)",
            bytes.len()
        );
        Ok(Some(Cow::Borrowed(bytes)))
    }

    fn list(&self, path: &str) -> anyhow::Result<Vec<SharedString>> {
        let files: &[&str] = match path.trim_end_matches('/') {
            "assets/images" => &[
                "assets/images/bg.png",
                "assets/images/gatot_1.png",
                "assets/images/gatot_2.png",
                "assets/images/gatot_collect.png",
                "assets/images/gatot_hit.png",
                "assets/images/bomb.png",
                "assets/images/collect_1.png",
                "assets/images/collect_2.png",
                "assets/images/collect_3.png",
                "assets/images/collect_4.png",
            ],
            _ => &[],
        };
        Ok(files.iter().map(|file| SharedString::from(*file)).collect())
    }
}

fn main() {
    application().with_assets(Assets).run(|cx: &mut App| {
        cx.open_window(WindowOptions::default(), |window, cx| {
            cx.new(|cx| GameApp::new(window, cx))
        })
        .expect("failed to open Wave Rider Nusantara desktop window");
        cx.activate(true);
    });
}
