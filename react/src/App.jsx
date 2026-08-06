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

// Helper SVG Fallbacks to guarantee images render immediately
const createSvgUrl = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

const FALLBACK_ASSETS = {
  'gatot-1': createSvgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFE066"/><stop offset="100%" stop-color="#D4AF37"/></linearGradient>
        <linearGradient id="w1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#FF3366"/><stop offset="100%" stop-color="#800020"/></linearGradient>
      </defs>
      <path d="M 30,50 Q 5,20 15,65 Q 35,55 30,50 Z" fill="url(#w1)" stroke="#FFE066" stroke-width="2"/>
      <path d="M 70,50 Q 95,20 85,65 Q 65,55 70,50 Z" fill="url(#w1)" stroke="#FFE066" stroke-width="2"/>
      <path d="M 35,40 L 65,40 L 60,80 L 40,80 Z" fill="url(#g1)" stroke="#8B4513" stroke-width="2"/>
      <path d="M 40,25 L 50,5 L 60,25 L 50,20 Z" fill="#FFE066" stroke="#D4AF37" stroke-width="2"/>
      <circle cx="50" cy="15" r="4" fill="#FF0000"/>
      <circle cx="50" cy="30" r="12" fill="#FFD1A4"/>
      <path d="M 44,32 Q 50,36 56,32" stroke="#000" stroke-width="2" fill="none"/>
      <circle cx="45" cy="28" r="2" fill="#000"/>
      <circle cx="55" cy="28" r="2" fill="#000"/>
      <ellipse cx="50" cy="86" rx="25" ry="8" fill="#00E5FF" opacity="0.8"/>
    </svg>
  `),
  'gatot-2': createSvgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFE066"/><stop offset="100%" stop-color="#D4AF37"/></linearGradient>
        <linearGradient id="w2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#FF3366"/><stop offset="100%" stop-color="#800020"/></linearGradient>
      </defs>
      <path d="M 30,45 Q 0,10 10,55 Q 35,50 30,45 Z" fill="url(#w2)" stroke="#FFE066" stroke-width="2"/>
      <path d="M 70,45 Q 100,10 90,55 Q 65,50 70,45 Z" fill="url(#w2)" stroke="#FFE066" stroke-width="2"/>
      <path d="M 35,40 L 65,40 L 60,80 L 40,80 Z" fill="url(#g2)" stroke="#8B4513" stroke-width="2"/>
      <path d="M 40,25 L 50,5 L 60,25 L 50,20 Z" fill="#FFE066" stroke="#D4AF37" stroke-width="2"/>
      <circle cx="50" cy="15" r="4" fill="#FF0000"/>
      <circle cx="50" cy="30" r="12" fill="#FFD1A4"/>
      <path d="M 44,32 Q 50,36 56,32" stroke="#000" stroke-width="2" fill="none"/>
      <circle cx="45" cy="28" r="2" fill="#000"/>
      <circle cx="55" cy="28" r="2" fill="#000"/>
      <ellipse cx="50" cy="86" rx="30" ry="10" fill="#00E5FF" opacity="0.9"/>
    </svg>
  `),
  'gatot-hit': createSvgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#FF0000" opacity="0.5"/>
      <circle cx="50" cy="50" r="30" fill="#FF4444"/>
      <text x="50" y="62" font-size="32" font-weight="bold" text-anchor="middle" fill="#FFF">💥</text>
    </svg>
  `),
  'gatot-collect': createSvgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#FFD700" opacity="0.6"/>
      <polygon points="50,10 62,38 90,38 68,56 76,85 50,68 24,85 32,56 10,38 38,38" fill="#FFF200" stroke="#FF8C00" stroke-width="2"/>
    </svg>
  `),
  'bomb': createSvgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="55" r="35" fill="#1A1A1A" stroke="#444" stroke-width="3"/>
      <rect x="42" y="12" width="16" height="12" rx="3" fill="#888"/>
      <path d="M 50,12 Q 60,2 75,10" fill="none" stroke="#D2691E" stroke-width="4"/>
      <circle cx="75" cy="10" r="6" fill="#FF4500"/>
      <circle cx="75" cy="10" r="3" fill="#FFFF00"/>
      <text x="50" y="66" font-size="24" text-anchor="middle" fill="#FF3333">💣</text>
    </svg>
  `),
  'bg': createSvgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0F2027"/><stop offset="50%" stop-color="#203A43"/><stop offset="100%" stop-color="#2C5364"/></linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#005C97"/><stop offset="100%" stop-color="#363795"/></linearGradient>
      </defs>
      <rect width="800" height="380" fill="url(#sky)"/>
      <circle cx="680" cy="120" r="60" fill="#FFE066" opacity="0.8"/>
      <rect y="380" width="800" height="220" fill="url(#sea)"/>
      <path d="M 0,390 Q 200,370 400,390 T 800,390 L 800,600 L 0,600 Z" fill="#0077BE" opacity="0.4"/>
      <path d="M 0,420 Q 200,440 400,420 T 800,420 L 800,600 L 0,600 Z" fill="#00E5FF" opacity="0.2"/>
    </svg>
  `),
  'collect-0': createSvgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="15" fill="#1E3A8A"/>
      <path d="M 20,50 Q 35,25 50,50 T 80,50 Q 65,75 50,50 T 20,50 Z" fill="#3B82F6" stroke="#93C5FD" stroke-width="3"/>
      <path d="M 30,50 Q 40,35 50,50 T 70,50" fill="none" stroke="#FFFFFF" stroke-width="2"/>
    </svg>
  `),
  'collect-1': createSvgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="15" fill="#7C2D12"/>
      <path d="M 10,90 L 90,10 M 25,95 L 95,25 M 5,75 L 75,5" stroke="#FDBA74" stroke-width="8" stroke-linecap="round"/>
      <path d="M 10,90 L 90,10" stroke="#FFF" stroke-width="2" stroke-dasharray="4,4"/>
    </svg>
  `),
  'collect-2': createSvgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="15" fill="#065F46"/>
      <ellipse cx="50" cy="25" rx="15" ry="22" fill="#A7F3D0" stroke="#047857" stroke-width="2"/>
      <ellipse cx="50" cy="75" rx="15" ry="22" fill="#A7F3D0" stroke="#047857" stroke-width="2"/>
      <ellipse cx="25" cy="50" rx="22" ry="15" fill="#A7F3D0" stroke="#047857" stroke-width="2"/>
      <ellipse cx="75" cy="50" rx="22" ry="15" fill="#A7F3D0" stroke="#047857" stroke-width="2"/>
      <circle cx="50" cy="50" r="8" fill="#FDE047"/>
    </svg>
  `),
  'collect-3': createSvgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="15" fill="#581C87"/>
      <polygon points="50,15 85,50 50,85 15,50" fill="#E9D5FF" stroke="#C084FC" stroke-width="3"/>
      <circle cx="50" cy="50" r="15" fill="#F43F5E"/>
    </svg>
  `)
};

export default function WaveRiderGame() {
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
      img.src = src;
      img.onload = () => {
        if (key.startsWith('collect-')) {
          const idx = parseInt(key.split('-')[1]);
          imagesRef.current.collect[idx] = img;
        } else {
          imagesRef.current[key] = img;
        }
        checkFinished();
      };
      img.onerror = () => {
        // Fallback to embedded SVG data URI if image file is missing
        const fallbackSrc = FALLBACK_ASSETS[key];
        if (fallbackSrc) {
          const fbImg = new Image();
          fbImg.src = fallbackSrc;
          fbImg.onload = () => {
            if (key.startsWith('collect-')) {
              const idx = parseInt(key.split('-')[1]);
              imagesRef.current.collect[idx] = fbImg;
            } else {
              imagesRef.current[key] = fbImg;
            }
            checkFinished();
          };
        } else {
          checkFinished();
        }
      };
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
    setScore(0);
    setLives(3);
    setGameState('MENU');
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
}
