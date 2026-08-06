import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameWindow } from './useGameWindow';

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
  credit: ["Created by Abu Sofian", "Dibuat oleh Abu Sofian"]
};

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BASE_GAME_SPEED = 200;
const PLAYER_BASE_SPEED = 300;
const PLAYER_TARGET_SIZE = 70;
const STATE_DURATION = 0.3;
const MIN_SPAWN_DISTANCE = 120;

const WaveRiderGame = () => {
  const windowSize = useGameWindow();
  const [gameState, setGameState] = useState('MENU');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [language, setLanguage] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const canvasRef = useRef(null);
  const requestRef = useRef(0);
  const lastTimeRef = useRef(0);
  const audioRef = useRef(null);

  const playerRef = useRef({
    x: 100, y: 300,
    width: PLAYER_TARGET_SIZE, height: PLAYER_TARGET_SIZE,
    isChangingState: false, stateTimer: 0.0, spriteKey: 'gatot-1', animationTimer: 0.0
  });

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
      'gatot-1': '/assets/images/gatot-1.png', 'gatot-2': '/assets/images/gatot-2.png',
      'gatot-hit': '/assets/images/gatot-hit.png', 'gatot-collect': '/assets/images/gatot-collect.png',
      'bomb': '/assets/images/bomb.png', 'bg': '/assets/images/bg.png',
    };
    for (let i = 0; i <= 3; i++) { imageSources[`collect-${i}`] = `/assets/images/collect-${i+1}.png`; }

    let loadedCount = 0;
    const totalImages = Object.keys(imageSources).length;

    Object.entries(imageSources).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        if (key.startsWith('collect-')) {
          const idx = parseInt(key.split('-')[1]);
          imagesRef.current.collect[idx] = img;
        } else {
          imagesRef.current[key] = img;
        }
        loadedCount++;
        if (loadedCount === totalImages) {
          const gatot = imagesRef.current['gatot-1'];
          if (gatot) {
            const scale = Math.min(PLAYER_TARGET_SIZE / gatot.width, PLAYER_TARGET_SIZE / gatot.height);
            playerRef.current.width = gatot.width * scale;
            playerRef.current.height = gatot.height * scale;
          }
          setImagesLoaded(true);
        }
      };
    });

    const bgMusic = new Audio('/assets/audio/bg-sound.wav');
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
    setScore(0);
    setLives(3);
    setGameState('MENU');
  }, []);

  const update = (time) => {
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
          setLives(l => { 
            const newLives = l - 1;
            if (newLives <= 0) setGameState('GAMEOVER');
            return newLives;
          });
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

    // Optimized Spawning
    if (Math.random() < 0.02) {
      const size = 50 + Math.random() * 30;
      const newObs = { x: GAME_WIDTH + 50, y: 50 + Math.random() * (GAME_HEIGHT - 150), width: size, height: size };
      const farEnough = [...obstaclesRef.current, ...collectiblesRef.current].every(item => Math.abs(item.x - newObs.x) > MIN_SPAWN_DISTANCE || Math.abs(item.y - newObs.y) > 80);
      if (farEnough) obstaclesRef.current.push(newObs);
    }
    if (Math.random() < 0.015) {
      const size = 40 + Math.random() * 20;
      const newCol = { x: GAME_WIDTH + 50, y: 50 + Math.random() * (GAME_HEIGHT - 150), width: size, height: size, type: Math.floor(Math.random() * 4) };
      const farEnough = [...obstaclesRef.current, ...collectiblesRef.current].every(item => Math.abs(item.x - newCol.x) > MIN_SPAWN_DISTANCE || Math.abs(item.y - newCol.y) > 80);
      if (farEnough) collectiblesRef.current.push(newCol);
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    const imgs = imagesRef.current;
    const p = playerRef.current;

    // Background
    if (imgs.bg) ctx.drawImage(imgs.bg, 0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (gameState !== 'MENU') {
      // Collectibles
      collectiblesRef.current.forEach(c => {
        if (imgs.collect[c.type]) ctx.drawImage(imgs.collect[c.type], c.x, c.y, c.width, c.height);
      });
      // Obstacles
      obstaclesRef.current.forEach(o => {
        if (imgs.bomb) ctx.drawImage(imgs.bomb, o.x, o.y, o.width, o.height);
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
  }, [gameState, draw]);

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
      if (e.code === 'KeyP') setGameState(prev => prev === 'PLAYING' ? 'PAUSED' : 'PLAYING');
      if (e.code === 'KeyR' && gameState === 'GAMEOVER') resetGame();
    };
    const handleKeyUp = (e) => { keysPressed.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [gameState, startGame, resetGame]);

  const TouchButton = ({ symbol, code }) => (
    <button
      onPointerDown={() => { keysPressed.current[code] = true; }}
      onPointerUp={() => { keysPressed.current[code] = false; }}
      onPointerLeave={() => { keysPressed.current[code] = false; }}
      style={{
        width: '60px', height: '60px', margin: '5px', borderRadius: '15px',
        backgroundColor: 'rgba(0,0,0,0.7)', border: '2px solid #fff', color: '#fff',
        fontSize: '24px', fontWeight: 'bold', userSelect: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center'
      }}>{symbol}</button>
  );

  if (!imagesLoaded) return <div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>Loading Wave Rider Nusantara...</div>;

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
        {gameState !== 'MENU' && (
          <div style={{ position: 'absolute', top: 20, left: 20, padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: '8px', color: '#000', fontWeight: 'bold', pointerEvents: 'none' }}>
            <div style={{ fontSize: '18px' }}>{TEXTS.score[language]}{score}</div>
            <div style={{ fontSize: '18px' }}>{TEXTS.lives[language]}{lives}</div>
          </div>
        )}

        {/* OVERLAYS */}
        {gameState === 'MENU' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.7)', padding: '20px', borderRadius: '15px' }}>
              <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', color: '#000' }}>{TEXTS.title[language]}</h1>
              <p style={{ margin: '0 0 20px 0', color: '#333' }}>{TEXTS.credit[language]}</p>
              
              <div style={{ marginBottom: '20px' }}>
                <button onClick={() => setLanguage(0)} style={{ padding: '8px 15px', marginRight: '10px', cursor: 'pointer', fontWeight: language === 0 ? 'bold' : 'normal' }}>English</button>
                <button onClick={() => setLanguage(1)} style={{ padding: '8px 15px', cursor: 'pointer', fontWeight: language === 1 ? 'bold' : 'normal' }}>Indonesia</button>
              </div>

              <div style={{ fontSize: '14px', marginBottom: '20px', maxWidth: '400px', color: '#000' }}>
                {TEXTS.instructions_menu[language]}<br/>
                <strong>{TEXTS.start_instructions[language]}</strong>
              </div>

              <button onClick={startGame} style={{ padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                {TEXTS.start_btn[language]}
              </button>
            </div>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px 40px', borderRadius: '10px', fontSize: '24px', fontWeight: 'bold', color: '#000' }}>
              {TEXTS.pause[language]}
            </div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <h1 style={{ fontSize: '48px', color: '#ff4444' }}>GAME OVER</h1>
            <h2 style={{ fontSize: '32px' }}>{TEXTS.score[language]} {score}</h2>
            <p style={{ fontSize: '18px', marginBottom: '30px' }}>{TEXTS.gameOver[language]}</p>
            <button onClick={resetGame} style={{ padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
              {TEXTS.restart_btn[language]}
            </button>
          </div>
        )}
      </div>

      {/* MOBILE DPAD */}
      {windowSize.scale < 1.0 && gameState === 'PLAYING' && (
        <div style={{ position: 'fixed', bottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1000 }}>
          <TouchButton symbol="↑" code="btn-up" />
          <div style={{ display: 'flex' }}>
            <TouchButton symbol="←" code="btn-left" />
            <TouchButton symbol="↓" code="btn-down" />
            <TouchButton symbol="→" code="btn-right" />
          </div>
        </div>
      )}
    </div>
  );
};

export default WaveRiderGame;
