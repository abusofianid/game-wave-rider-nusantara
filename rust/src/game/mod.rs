use std::collections::HashSet;

pub const GAME_WIDTH: f32 = 800.0;
pub const GAME_HEIGHT: f32 = 600.0;
const BASE_GAME_SPEED: f32 = 200.0;
const PLAYER_SPEED: f32 = 300.0;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum GameState {
    Menu,
    Playing,
    Paused,
    GameOver,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Language {
    English,
    Indonesian,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Direction {
    Left,
    Right,
    Up,
    Down,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CollectibleKind {
    Batik1,
    Batik2,
    Batik3,
    Batik4,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PlayerFeedback {
    Normal,
    Hit,
    Collect,
}

#[derive(Clone, Copy, Debug)]
pub struct Player {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub lives: u8,
    pub score: u32,
    pub feedback: PlayerFeedback,
    pub feedback_timer: f32,
    pub animation_timer: f32,
    pub animation_frame: usize,
}

impl Default for Player {
    fn default() -> Self {
        Self {
            x: 100.0,
            y: 300.0,
            width: 70.0,
            height: 70.0,
            lives: 3,
            score: 0,
            feedback: PlayerFeedback::Normal,
            feedback_timer: 0.0,
            animation_timer: 0.0,
            animation_frame: 0,
        }
    }
}

impl Player {
    pub fn set_feedback(&mut self, feedback: PlayerFeedback) {
        if self.feedback == PlayerFeedback::Normal {
            self.feedback = feedback;
            self.feedback_timer = 0.3;
        }
    }

    fn update_feedback(&mut self, dt: f32) {
        if self.feedback != PlayerFeedback::Normal {
            self.feedback_timer -= dt;
            if self.feedback_timer <= 0.0 {
                self.feedback = PlayerFeedback::Normal;
                self.feedback_timer = 0.0;
            }
        }
        self.animation_timer += dt;
        if self.animation_timer >= 0.1 {
            self.animation_timer %= 0.1;
            self.animation_frame = (self.animation_frame + 1) % 2;
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub struct Entity {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub kind: CollectibleKind,
}

impl Entity {
    fn overlaps(&self, player: &Player) -> bool {
        player.x < self.x + self.width
            && player.x + player.width > self.x
            && player.y < self.y + self.height
            && player.y + player.height > self.y
    }
}

#[derive(Debug)]
pub struct Game {
    pub state: GameState,
    pub language: Language,
    pub player: Player,
    pub bombs: Vec<Entity>,
    pub collectibles: Vec<Entity>,
    pub speed_multiplier: f32,
    pub keys: HashSet<Direction>,
    pub muted: bool,
    random_state: u64,
    spawn_bomb_accumulator: f32,
    spawn_collectible_accumulator: f32,
}

impl Default for Game {
    fn default() -> Self {
        Self {
            state: GameState::Menu,
            language: Language::Indonesian,
            player: Player::default(),
            bombs: Vec::new(),
            collectibles: Vec::new(),
            speed_multiplier: 1.0,
            keys: HashSet::new(),
            muted: false,
            random_state: 0x9e37_79b9_7f4a_7c15,
            spawn_bomb_accumulator: 0.0,
            spawn_collectible_accumulator: 0.0,
        }
    }
}

impl Game {
    pub fn start(&mut self) {
        self.state = GameState::Playing;
    }

    pub fn start_from_control(&mut self) {
        if self.state == GameState::GameOver {
            self.restart();
        }
        self.start();
    }

    pub fn toggle_pause(&mut self) {
        self.state = match self.state {
            GameState::Playing => GameState::Paused,
            GameState::Paused => GameState::Playing,
            state => state,
        };
    }

    pub fn restart(&mut self) {
        let language = self.language;
        let muted = self.muted;
        *self = Self::default();
        self.language = language;
        self.muted = muted;
    }

    pub fn set_key(&mut self, direction: Direction, pressed: bool) {
        if pressed {
            self.keys.insert(direction);
        } else {
            self.keys.remove(&direction);
        }
    }

    fn random_u32(&mut self) -> u32 {
        // Xorshift64* keeps the gameplay deterministic and dependency-light.
        self.random_state ^= self.random_state >> 12;
        self.random_state ^= self.random_state << 25;
        self.random_state ^= self.random_state >> 27;
        (self.random_state.wrapping_mul(0x2545_f491_4f6c_dd1d) >> 32) as u32
    }

    fn random_range(&mut self, min: f32, max: f32) -> f32 {
        let unit = self.random_u32() as f32 / u32::MAX as f32;
        min + (max - min) * unit
    }

    fn random_kind(&mut self) -> CollectibleKind {
        match self.random_u32() % 4 {
            0 => CollectibleKind::Batik1,
            1 => CollectibleKind::Batik2,
            2 => CollectibleKind::Batik3,
            _ => CollectibleKind::Batik4,
        }
    }

    fn boxes_overlap(a: (f32, f32, f32, f32), b: (f32, f32, f32, f32)) -> bool {
        a.0 < b.1 && a.1 > b.0 && a.2 < b.3 && a.3 > b.2
    }

    fn player_bbox(&self) -> (f32, f32, f32, f32) {
        (
            self.player.x,
            self.player.x + self.player.width,
            self.player.y,
            self.player.y + self.player.height,
        )
    }

    fn entity_bbox(entity: &Entity) -> (f32, f32, f32, f32) {
        (
            entity.x,
            entity.x + entity.width,
            entity.y,
            entity.y + entity.height,
        )
    }

    fn spawn_is_clear(&self, candidate: &Entity) -> bool {
        let bbox = Self::entity_bbox(candidate);
        self.bombs
            .iter()
            .chain(self.collectibles.iter())
            .all(|existing| !Self::boxes_overlap(bbox, Self::entity_bbox(existing)))
    }

    fn spawn_bomb(&mut self) {
        let size = self.random_range(40.0, 85.0);
        let candidate = Entity {
            x: GAME_WIDTH + 50.0,
            y: self.random_range(100.0, GAME_HEIGHT - 100.0),
            width: size,
            height: size,
            kind: CollectibleKind::Batik1,
        };
        if self.spawn_is_clear(&candidate) {
            self.bombs.push(candidate);
        }
    }

    fn spawn_collectible(&mut self) {
        let size = self.random_range(35.0, 70.0);
        let candidate = Entity {
            x: GAME_WIDTH + 50.0,
            y: self.random_range(100.0, GAME_HEIGHT - 100.0),
            width: size,
            height: size,
            kind: self.random_kind(),
        };
        if self.spawn_is_clear(&candidate) {
            self.collectibles.push(candidate);
        }
    }

    pub fn tick(&mut self, dt: f32) {
        if self.state != GameState::Playing {
            return;
        }

        let dt = dt.clamp(0.0, 0.05);
        self.speed_multiplier += 0.04 * dt;

        let dx = (self.keys.contains(&Direction::Right) as i32
            - self.keys.contains(&Direction::Left) as i32) as f32;
        let dy = (self.keys.contains(&Direction::Up) as i32
            - self.keys.contains(&Direction::Down) as i32) as f32;

        self.player.x =
            (self.player.x + dx * PLAYER_SPEED * dt).clamp(0.0, GAME_WIDTH - self.player.width);
        self.player.y =
            (self.player.y + dy * PLAYER_SPEED * dt).clamp(0.0, GAME_HEIGHT - self.player.height);
        self.player.update_feedback(dt);

        let player_bbox = self.player_bbox();
        let speed = BASE_GAME_SPEED * self.speed_multiplier * dt;

        self.bombs.iter_mut().for_each(|bomb| bomb.x -= speed);
        self.collectibles
            .iter_mut()
            .for_each(|item| item.x -= speed);

        let mut bomb_hits = 0_u8;
        self.bombs.retain(|bomb| {
            if bomb.x + bomb.width < -50.0 {
                return false;
            }
            if Self::boxes_overlap(player_bbox, Self::entity_bbox(bomb)) {
                bomb_hits = bomb_hits.saturating_add(1);
                return false;
            }
            true
        });
        if bomb_hits > 0 {
            self.player.lives = self.player.lives.saturating_sub(bomb_hits);
            self.player.set_feedback(PlayerFeedback::Hit);
            if self.player.lives == 0 {
                self.state = GameState::GameOver;
            }
        }

        let mut collected = 0_u32;
        self.collectibles.retain(|item| {
            if item.x + item.width < -50.0 {
                return false;
            }
            if Self::boxes_overlap(player_bbox, Self::entity_bbox(item)) {
                collected += 1;
                return false;
            }
            true
        });
        if collected > 0 {
            self.player.score = self.player.score.saturating_add(10 * collected);
            self.player.set_feedback(PlayerFeedback::Collect);
        }

        self.spawn_bomb_accumulator += dt;
        self.spawn_collectible_accumulator += dt;
        if self.spawn_bomb_accumulator >= 1.0 / (0.02 * 60.0) {
            self.spawn_bomb_accumulator = 0.0;
            self.spawn_bomb();
        }
        if self.spawn_collectible_accumulator >= 1.0 / (0.01 * 60.0) {
            self.spawn_collectible_accumulator = 0.0;
            self.spawn_collectible();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aabb_detects_overlap_and_edge_touch_is_not_overlap() {
        assert!(Game::boxes_overlap(
            (0.0, 10.0, 0.0, 10.0),
            (5.0, 15.0, 5.0, 15.0)
        ));
        assert!(!Game::boxes_overlap(
            (0.0, 10.0, 0.0, 10.0),
            (10.0, 20.0, 0.0, 10.0)
        ));
    }

    #[test]
    fn collecting_batik_awards_ten_points() {
        let mut game = Game::default();
        game.state = GameState::Playing;
        game.player.x = 100.0;
        game.player.y = 100.0;
        game.collectibles.push(Entity {
            x: 110.0,
            y: 110.0,
            width: 30.0,
            height: 30.0,
            kind: CollectibleKind::Batik2,
        });
        game.tick(0.016);
        assert_eq!(game.player.score, 10);
        assert!(game.collectibles.is_empty());
    }

    #[test]
    fn bomb_collision_reduces_lives_and_triggers_game_over() {
        let mut game = Game::default();
        game.state = GameState::Playing;
        game.player.lives = 1;
        game.bombs.push(Entity {
            x: game.player.x + 5.0,
            y: game.player.y + 5.0,
            width: 40.0,
            height: 40.0,
            kind: CollectibleKind::Batik1,
        });
        game.tick(0.016);
        assert_eq!(game.player.lives, 0);
        assert_eq!(game.state, GameState::GameOver);
    }

    #[test]
    fn movement_clamps_to_window_bounds() {
        let mut game = Game::default();
        game.state = GameState::Playing;
        game.set_key(Direction::Left, true);
        game.set_key(Direction::Down, true);
        game.tick(0.05);
        assert_eq!(game.player.x, 85.0);
        assert_eq!(game.player.y, 285.0);
    }

    #[test]
    fn start_control_restarts_a_game_over_run_before_playing() {
        let mut game = Game::default();
        game.language = Language::English;
        game.muted = true;
        game.state = GameState::GameOver;
        game.player.score = 120;
        game.player.lives = 0;
        game.start_from_control();
        assert_eq!(game.state, GameState::Playing);
        assert_eq!(game.player.score, 0);
        assert_eq!(game.player.lives, 3);
        assert_eq!(game.language, Language::English);
        assert!(game.muted);
    }

    #[test]
    fn restart_resets_score_and_lives_but_preserves_preferences() {
        let mut game = Game::default();
        game.language = Language::English;
        game.muted = true;
        game.player.score = 100;
        game.player.lives = 1;
        game.restart();
        assert_eq!(game.player.score, 0);
        assert_eq!(game.player.lives, 3);
        assert_eq!(game.language, Language::English);
        assert!(game.muted);
        assert_eq!(game.state, GameState::Menu);
    }
}
