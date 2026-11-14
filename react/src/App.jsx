import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameWindow } from './useGameWindow';
import { Analytics } from '@vercel/analytics/react';

// ==========================================================
// ## 📝 KONFIGURASI & KONSTANTA
// ==========================================================

const TEXTS = {
  title: ["Wave Rider Nusantara", "Penunggang Gelombang Nusantara"],
  score: ["Score: ", "Skor: "],
  lives: ["Lives: ", "Nyawa: "],
  gameOver: ["Game Over! Press R to Restart", "Permainan Berakhir! Tekan R untuk Mulai Ulang"],
  pause: ["Paused - Press P to Resume", "Jeda - Tekan P untuk Lanjut"],
  lang_select: ["Please select a language", "Silakan pilih bahasa"],
  instructions_menu: ["Help Gatotkaca catch Batik Patterns, Avoid BOMBS!", "Bantu Gatotkaca menangkap Pola Batik, Hindari BOM!"],
  start_instructions: ["Press SPACE to Start. Use ARROW KEYS to move. Press the P key to Pause", "Tekan SPASI untuk Mulai. Gunakan TOMBOL PANAH untuk bergerak. Tekan Tombol P untuk Jeda"],
  start_btn: ["START", "MULAI"],
  pause_btn: ["PAUSE", "JEDA"],
  resume_btn: ["RESUME", "LANJUT"],
  restart_btn: ["RESTART", "MULAI ULANG"],
  mute: ["Mute sound", "Matikan suara"],
  credit: ["Created by Abu Sofian", "Dibuat oleh Abu Sofian"]
};

// Module-level so React keeps the same element between renders: a button defined inside
// the game component is remounted on every score change and drops the finger's pointerup.
const touchStyle = {
  height: '60px', margin: '5px', borderRadius: '15px',
  backgroundColor: 'rgba(0,0,0,0.7)', border: '2px solid #fff', color: '#fff',
  fontWeight: 'bold', userSelect: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center'
};

const TouchButton = ({ symbol, code, keys }) => {
  const release = () => { keys.current[code] = false; };
  return (
    <button
      onPointerDown={() => { keys.current[code] = true; }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      style={{ ...touchStyle, width: '60px', fontSize: '24px' }}>{symbol}</button>
  );
};

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BASE_GAME_SPEED = 200;
const PLAYER_BASE_SPEED = 300;
const PLAYER_TARGET_SIZE = 70;
const STATE_DURATION = 0.3;
const MIN_SPAWN_DISTANCE = 120;

export default function WaveRiderGame() {
  const windowSize = useGameWindow();
  const [gameState, setGameState] = useState('MENU');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [language, setLanguage] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [muted, setMuted] = useState(false);

  const canvasRef = useRef(null);
  const requestRef = useRef(0);
  const lastTimeRef = useRef(0);
  const audioRef = useRef(null);

  const playerRef = useRef({
    x: 100, y: 300,
    width: PLAYER_TARGET_SIZE, height: PLAYER_TARGET_SIZE,
    isChangingState: false, stateTimer: 0.0, spriteKey: 'gatot-1', animationTimer: 0.0
  });

  const livesRef = useRef(3);
  const obstaclesRef = useRef([]);
  const collectiblesRef = useRef([]);
  const keysPressed = useRef({});
  const speedMultiplier = useRef(1.0);
  const imagesRef = useRef({ collect: [] });

  // ==========================================================
  // ## 🏞️ OPTIMIZED ASSET LOADING
  // ==========================================================

  useEffect(() => {
    const imageSources = {
      'gatot-1': '/assets/images/gatot-1.webp', 'gatot-2': '/assets/images/gatot-2.webp',
      'gatot-hit': '/assets/images/gatot-hit.webp', 'gatot-collect': '/assets/images/gatot-collect.webp',
      'bomb': '/assets/images/bomb.webp', 'bg': '/assets/images/bg.webp',
    };
    for (let i = 0; i <= 3; i++) { imageSources[`collect-${i}`] = `/assets/images/collect-${i+1}.webp`; }

    let loadedCount = 0;
    const totalImages = Object.keys(imageSources).length;

    const checkFinished = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        const gatot = imagesRef.current['gatot-1'];
        if (gatot && gatot.width > 0) {
          const scale = Math.min(PLAYER_TARGET_SIZE / gatot.width, PLAYER_TARGET_SIZE / gatot.height);
          playerRef.current.width = gatot.width * scale;
          playerRef.current.height = gatot.height * scale;
        }
        setImagesLoaded(true);
      }
    };

    const loadSingleImage = (key, src) => {
      const img = new Image();

      img.onload = () => {
        if (key.startsWith('collect-')) {
          const idx = Number(key.split('-')[1]);
          imagesRef.current.collect[idx] = img;
        } else {
          imagesRef.current[key] = img;
        }
        checkFinished();
      };

      // Count failed requests too, so the loading screen cannot get stuck.
      img.onerror = checkFinished;
      img.src = src;
    };

    Object.entries(imageSources).forEach(([key, src]) => {
      loadSingleImage(key, src);
    });

    const bgMusic = new Audio('/assets/audio/bg-sound.webm');
    bgMusic.loop = true;
    bgMusic.volume = 0.05;
    audioRef.current = bgMusic;

    return () => {
      cancelAnimationFrame(requestRef.current);
      bgMusic.pause();
    };
  }, []);

  // ==========================================================
  // ## 🔄 GAME LOGIC (OPTIMIZED LOOP)
  // ==========================================================

  const startGame = useCallback(() => {
    if (audioRef.current) audioRef.current.play().catch(() => {});
    setGameState('PLAYING');
    lastTimeRef.current = performance.now();
  }, []);

  const resetGame = useCallback(() => {
    playerRef.current = { ...playerRef.current, x: 100, y: 300, isChangingState: false, stateTimer: 0.0, spriteKey: 'gatot-1' };
    obstaclesRef.current = [];
    collectiblesRef.current = [];
    speedMultiplier.current = 1.0;
    // Touch buttons unmount on game over, so a held button never gets its pointerup
    keysPressed.current = {};
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    setGameState('MENU');
  }, []);

  const togglePause = useCallback(() => {
    // Only PLAYING and PAUSED toggle; P must not start a game or revive a finished one
    setGameState(prev => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
  }, []);

  const update = useCallback((time) => {
    const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.05); // Cap delta time
    lastTimeRef.current = time;

    if (gameState !== 'PLAYING') return;

    speedMultiplier.current += 0.03 * deltaTime;
    const currentSpeed = BASE_GAME_SPEED * speedMultiplier.current;
    const p = playerRef.current;
    const moveAmt = PLAYER_BASE_SPEED * deltaTime;

    if (keysPressed.current['ArrowLeft'] || keysPressed.current['btn-left']) p.x -= moveAmt;
    if (keysPressed.current['ArrowRight'] || keysPressed.current['btn-right']) p.x += moveAmt;
    if (keysPressed.current['ArrowUp'] || keysPressed.current['btn-up']) p.y -= moveAmt;
    if (keysPressed.current['ArrowDown'] || keysPressed.current['btn-down']) p.y += moveAmt;
    
    p.x = Math.max(0, Math.min(GAME_WIDTH - p.width, p.x));
    p.y = Math.max(0, Math.min(GAME_HEIGHT - p.height, p.y));

    // Animation & State Timer
    if (p.isChangingState) {
      p.stateTimer -= deltaTime;
      if (p.stateTimer <= 0) { p.isChangingState = false; p.spriteKey = 'gatot-1'; }
    } else {
      p.animationTimer += deltaTime;
      if (p.animationTimer >= 0.15) {
        p.spriteKey = p.spriteKey === 'gatot-1' ? 'gatot-2' : 'gatot-1';
        p.animationTimer = 0;
      }
    }

    const playerBox = { x: p.x + 10, y: p.y + 10, w: p.width - 20, h: p.height - 20 };

    // Update & Collision Obstacles
    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obs = obstaclesRef.current[i];
      obs.x -= currentSpeed * deltaTime;
      if (obs.x < -100) { obstaclesRef.current.splice(i, 1); continue; }
      
      if (playerBox.x < obs.x + obs.width && playerBox.x + playerBox.w > obs.x &&
          playerBox.y < obs.y + obs.height && playerBox.y + playerBox.h > obs.y) {
        if (!p.isChangingState) {
          livesRef.current -= 1;
          setLives(livesRef.current);
          if (livesRef.current <= 0) setGameState('GAMEOVER');
          p.isChangingState = true; p.stateTimer = STATE_DURATION; p.spriteKey = 'gatot-hit';
          obstaclesRef.current.splice(i, 1);
        }
      }
    }

    // Update & Collision Collectibles
    for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
      const col = collectiblesRef.current[i];
      col.x -= currentSpeed * deltaTime;
      if (col.x < -100) { collectiblesRef.current.splice(i, 1); continue; }

      if (playerBox.x < col.x + col.width && playerBox.x + playerBox.w > col.x &&
          playerBox.y < col.y + col.height && playerBox.y + playerBox.h > col.y) {
        setScore(s => s + 10);
        p.isChangingState = true; p.stateTimer = STATE_DURATION; p.spriteKey = 'gatot-collect';
        collectiblesRef.current.splice(i, 1);
      }
    }

    // Optimized Spawning (chances are per 60 FPS frame, scaled by frame time so 120/144 Hz spawns the same)
    const frameScale = deltaTime * 60;
    if (Math.random() < 0.02 * frameScale) {
      const size = 50 + Math.random() * 30;
      const newObs = { x: GAME_WIDTH + 50, y: 50 + Math.random() * (GAME_HEIGHT - 150), width: size, height: size };
      const farEnough = [...obstaclesRef.current, ...collectiblesRef.current].every(item => Math.abs(item.x - newObs.x) > MIN_SPAWN_DISTANCE || Math.abs(item.y - newObs.y) > 80);
      if (farEnough) obstaclesRef.current.push(newObs);
    }
    if (Math.random() < 0.015 * frameScale) {
      const size = 40 + Math.random() * 20;
      const newCol = { x: GAME_WIDTH + 50, y: 50 + Math.random() * (GAME_HEIGHT - 150), width: size, height: size, type: Math.floor(Math.random() * 4) };
      const farEnough = [...obstaclesRef.current, ...collectiblesRef.current].every(item => Math.abs(item.x - newCol.x) > MIN_SPAWN_DISTANCE || Math.abs(item.y - newCol.y) > 80);
      if (farEnough) collectiblesRef.current.push(newCol);
    }
  }, [gameState]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const imgs = imagesRef.current;
    const p = playerRef.current;

    // Background
    const bgImg = imgs.bg;
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
      ctx.fillStyle = '#0F2027';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    if (gameState !== 'MENU') {
      // Collectibles
      collectiblesRef.current.forEach(c => {
        const cImg = imgs.collect[c.type];
        if (cImg) ctx.drawImage(cImg, c.x, c.y, c.width, c.height);
      });
      // Obstacles
      obstaclesRef.current.forEach(o => {
        const bImg = imgs.bomb;
        if (bImg) ctx.drawImage(bImg, o.x, o.y, o.width, o.height);
      });
      // Player
      const pImg = imgs[p.spriteKey];
      if (pImg) ctx.drawImage(pImg, p.x, p.y, p.width, p.height);
    }
  }, [gameState]);

  const loop = useCallback((time) => {
    update(time);
    draw();
    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [loop]);

  // ==========================================================
  // ## 📱 INPUT HANDLERS
  // ==========================================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.code] = true;
      if (e.code === 'Space' && gameState === 'MENU') startGame();
      if (e.code === 'KeyP') togglePause();
      if (e.code === 'KeyR' && gameState === 'GAMEOVER') resetGame();
    };
    const handleKeyUp = (e) => { keysPressed.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [gameState, startGame, resetGame, togglePause]);

  // ==========================================================
  // ## 🔊 AUDIO (pause with the game, mute toggle)
  // ==========================================================

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    const music = audioRef.current;
    if (!music) return;
    if (gameState === 'PLAYING') music.play().catch(() => {});
    else music.pause();
  }, [gameState]);

  if (!imagesLoaded) {
    return (
      <div style={{ color: 'white', backgroundColor: '#000', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        Memuat Wave Rider Nusantara...
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#000', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', overflow: 'hidden', touchAction: 'none'
    }}>
      <div style={{
        position: 'relative', width: GAME_WIDTH, height: GAME_HEIGHT,
        transform: `scale(${windowSize.scale})`, transformOrigin: 'center center',
        boxShadow: '0 0 30px rgba(0,0,0,1)', border: '4px solid #444', backgroundColor: '#000'
      }}>
        <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} />

        {/* HUD */}
        {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
          <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            padding: '10px 18px',
            backgroundColor: 'rgba(255, 255, 255, 0.40)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            borderRadius: '12px',
            color: '#000',
            fontWeight: 'bold',
            pointerEvents: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
          }}>
            <div style={{ fontSize: '18px' }}>{TEXTS.score[language]}{score}</div>
            <div style={{ fontSize: '18px' }}>{TEXTS.lives[language]}{lives}</div>
          </div>
        )}

        {/* OVERLAYS */}
        {gameState === 'MENU' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.40)',
              padding: '28px 32px',
              borderRadius: '24px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
              width: '520px',
              maxWidth: '92%',
              height: '390px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}>
              <div>
                <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', color: '#000', fontWeight: 800, minHeight: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>
                  {TEXTS.title[language]}
                </h1>
                <p style={{ margin: '0 0 16px 0', color: '#222', fontSize: '14px', fontWeight: 600 }}>
                  {TEXTS.credit[language]}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
                <button
                  onClick={() => setLanguage(0)}
                  style={{
                    width: '120px',
                    height: '40px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    backgroundColor: language === 0 ? '#111111' : '#ffffff',
                    color: language === 0 ? '#ffffff' : '#333333',
                    border: language === 0 ? '2px solid #111111' : '2px solid #cccccc',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    boxShadow: language === 0 ? '0 4px 10px rgba(0,0,0,0.25)' : 'none'
                  }}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage(1)}
                  style={{
                    width: '120px',
                    height: '40px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    backgroundColor: language === 1 ? '#111111' : '#ffffff',
                    color: language === 1 ? '#ffffff' : '#333333',
                    border: language === 1 ? '2px solid #111111' : '2px solid #cccccc',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    boxShadow: language === 1 ? '0 4px 10px rgba(0,0,0,0.25)' : 'none'
                  }}
                >
                  Indonesia
                </button>
              </div>

              <div style={{ fontSize: '13.5px', color: '#111', lineHeight: '1.5', minHeight: '70px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div>{TEXTS.instructions_menu[language]}</div>
                <strong style={{ display: 'block', marginTop: '6px', color: '#000', fontSize: '13px' }}>
                  {TEXTS.start_instructions[language]}
                </strong>
              </div>

              <button
                onClick={startGame}
                style={{
                  padding: '12px 48px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  backgroundColor: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(40,167,69,0.4)',
                  transition: 'transform 0.1s ease',
                  marginTop: '8px'
                }}
              >
                {TEXTS.start_btn[language]}
              </button>
            </div>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.40)',
              backdropFilter: 'blur(4px)',
              padding: '28px 48px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#000000',
              textAlign: 'center'
            }}>
              {TEXTS.pause[language]}
            </div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.40)',
              backdropFilter: 'blur(4px)',
              padding: '28px 32px',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 16px 44px rgba(0, 0, 0, 0.25)',
              width: '520px',
              maxWidth: '92%',
              height: '390px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h1 style={{ fontSize: '46px', color: '#dc3545', margin: '0 0 10px 0', letterSpacing: '2px', fontWeight: 800 }}>
                  GAME OVER
                </h1>
                <h2 style={{ fontSize: '30px', margin: '0 0 12px 0', color: '#000000', fontWeight: 800 }}>
                  {TEXTS.score[language]} {score}
                </h2>
                <p style={{ fontSize: '15px', margin: 0, color: '#111111', fontWeight: 600 }}>
                  {TEXTS.gameOver[language]}
                </p>
              </div>
              <button
                onClick={resetGame}
                style={{
                  padding: '12px 48px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  backgroundColor: '#dc3545',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(220, 53, 69, 0.4)',
                  transition: 'transform 0.1s ease',
                  marginTop: 'auto'
                }}
              >
                {TEXTS.restart_btn[language]}
              </button>
            </div>
          </div>
        )}

        {/* MUTE (last child so the full-screen overlays above never cover it) */}
        <button
          onClick={(e) => { setMuted(m => !m); e.currentTarget.blur(); }}
          aria-label={TEXTS.mute[language]}
          aria-pressed={muted}
          style={{
            position: 'absolute', top: 20, right: 20, width: '44px', height: '44px',
            fontSize: '20px', cursor: 'pointer', borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.40)', backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* MOBILE DPAD + PAUSE (stay mounted while paused so a held button still gets its pointerup) */}
      {windowSize.scale < 1.0 && (gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <>
          <div style={{ position: 'fixed', bottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1000 }}>
            <TouchButton symbol="↑" code="btn-up" keys={keysPressed} />
            <div style={{ display: 'flex' }}>
              <TouchButton symbol="←" code="btn-left" keys={keysPressed} />
              <TouchButton symbol="↓" code="btn-down" keys={keysPressed} />
              <TouchButton symbol="→" code="btn-right" keys={keysPressed} />
            </div>
          </div>
          {/* Top centre, away from the D-pad thumbs; the HUD (left) and mute (right) leave this spot free */}
          <button
            onClick={(e) => { togglePause(); e.currentTarget.blur(); }}
            style={{
              ...touchStyle, position: 'fixed', top: '8px', left: '50%', transform: 'translateX(-50%)',
              height: '44px', margin: 0, padding: '0 18px', fontSize: '14px', zIndex: 1000
            }}
          >
            {gameState === 'PLAYING' ? TEXTS.pause_btn[language] : TEXTS.resume_btn[language]}
          </button>
        </>
      )}
      <Analytics />
    </div>
  );
}
