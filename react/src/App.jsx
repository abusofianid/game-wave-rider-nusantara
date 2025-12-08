import React, { useState, useEffect, useRef } from 'react';
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
const MIN_SPAWN_DISTANCE = 100;

// ==========================================================
// ## ⚛️ KOMPONEN UTAMA
// ==========================================================

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
    isChangingState: false, stateTimer: 0.0, spriteKey: 'idle1', animationTimer: 0.0
  });

  const obstaclesRef = useRef([]);
  const collectiblesRef = useRef([]);
  const keysPressed = useRef({});
  const speedMultiplier = useRef(1.0);

  const imagesRef = useRef({
    bg: null, bomb: null, collect: [], 'gatot-1': null, 'gatot-2': null, 'gatot-hit': null, 'gatot-collect': null
  });

  // ==========================================================
  // ## 🏞️ LOADING ASSETS
  // ==========================================================

  useEffect(() => {
    const imageSources = {
      'gatot-1': '/assets/images/gatot-1.png', 'gatot-2': '/assets/images/gatot-2.png',
      'gatot-hit': '/assets/images/gatot-hit.png', 'gatot-collect': '/assets/images/gatot-collect.png',
      'bomb': '/assets/images/bomb.png', 'bg': '/assets/images/bg.png',
    };
    for (let i = 1; i <= 4; i++) {
      imageSources[`collect-${i}`] = `/assets/images/collect-${i}.png`;
    }

    let loadedCount = 0;
    const totalImages = Object.keys(imageSources).length;

    Object.keys(imageSources).forEach(key => {
      const img = new Image();
      img.src = imageSources[key];
      img.onload = () => {
        if (key.startsWith('collect-')) {
          const index = parseInt(key.split('-')[1]) - 1;
          imagesRef.current.collect[index] = img;
        } else {
          imagesRef.current[key] = img;
        }
        loadedCount++;

        if (loadedCount === totalImages) {
          const gatotImage = imagesRef.current['gatot-1'];
          if (gatotImage) {
            const originalWidth = gatotImage.width;
            const originalHeight = gatotImage.height;
            const scale_x = PLAYER_TARGET_SIZE / originalWidth;
            const scale_y = PLAYER_TARGET_SIZE / originalHeight;
            const scale = Math.min(scale_x, scale_y);

            playerRef.current.width = originalWidth * scale;
            playerRef.current.height = originalHeight * scale;
          }
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        console.error(`Gagal memuat: ${imageSources[key]}`);
        loadedCount++;
        if (loadedCount === totalImages) setImagesLoaded(true);
      };
    });

    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // --- Audio Init ---
  useEffect(() => {
    const bgMusic = new Audio('/assets/audio/bg-sound.wav');
    bgMusic.loop = true;
    bgMusic.volume = 0.05;
    audioRef.current = bgMusic;

    const playAudio = () => {
      if (bgMusic.paused) {
        bgMusic.play().catch(e => console.log("Audio autoplay blocked", e));
      }
      window.removeEventListener('click', playAudio);
      window.removeEventListener('keydown', playAudio);
    };
    window.addEventListener('click', playAudio);
    window.addEventListener('keydown', playAudio);
    return () => {
      window.removeEventListener('click', playAudio);
      window.removeEventListener('keydown', playAudio);
    };
  }, []);

  // ==========================================================
  // ## 🖱️ INPUT HANDLERS
  // ==========================================================

  const keyMap = { 'btn-up': 'ArrowUp', 'btn-down': 'ArrowDown', 'btn-left': 'ArrowLeft', 'btn-right': 'ArrowRight' };

  const handleTouchStart = (code) => (e) => {
    if (e.cancelable) e.preventDefault();
    if (gameState === 'PLAYING') keysPressed.current[keyMap[code]] = true;
  };

  const handleTouchEnd = (code) => (e) => {
    if (e.cancelable) e.preventDefault();
    keysPressed.current[keyMap[code]] = false;
  };

  const handleAction = (actionType) => (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (actionType === 'start') startGame();
    else if (actionType === 'pause') {
      if (gameState === 'PLAYING') setGameState('PAUSED');
      else if (gameState === 'PAUSED') {
        lastTimeRef.current = performance.now();
        setGameState('PLAYING');
      }
    } else if (actionType === 'restart') resetGame();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      keysPressed.current[e.code] = true;
      if (e.code === 'Space' && gameState === 'MENU' && imagesLoaded) startGame();
      if (e.code === 'KeyP') handleAction('pause')(e);
      if (e.code === 'KeyR' && gameState === 'GAMEOVER') resetGame();
    };
    const handleKeyUp = (e) => keysPressed.current[e.code] = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, imagesLoaded]);

  const startGame = () => {
    setGameState('PLAYING');
    lastTimeRef.current = performance.now();
  };

  const resetGame = () => {
    const { width, height } = playerRef.current;
    playerRef.current = {
      x: 100, y: 300, width, height,
      isChangingState: false, stateTimer: 0.0, spriteKey: 'idle1', animationTimer: 0.0
    };
    obstaclesRef.current = [];
    collectiblesRef.current = [];
    speedMultiplier.current = 1.0;
    setScore(0);
    setLives(3);
    setGameState('MENU');
  };

  // ==========================================================
  // ## 🔄 GAME LOGIC & DRAW
  // ==========================================================

  const checkCollision = (r1, r2) => r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;

  const changePlayerState = (p, type) => {
    if (p.isChangingState) return;
    p.isChangingState = true;
    p.stateTimer = STATE_DURATION;
    p.spriteKey = type === 'hit' ? 'hit' : 'collect';
  };

  const isOverlapping = (newBox, items) => items.some(i => Math.abs((newBox.x + newBox.width / 2) - (i.x + i.width / 2)) < MIN_SPAWN_DISTANCE);

  const update = (time) => {
    if (gameState !== 'PLAYING') return;
    const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = time;

    speedMultiplier.current += 0.05 * deltaTime;
    const currentSpeed = BASE_GAME_SPEED * speedMultiplier.current;
    const p = playerRef.current;
    const moveAmt = PLAYER_BASE_SPEED * deltaTime;

    if (keysPressed.current['ArrowLeft']) p.x -= moveAmt;
    if (keysPressed.current['ArrowRight']) p.x += moveAmt;
    if (keysPressed.current['ArrowUp']) p.y -= moveAmt;
    if (keysPressed.current['ArrowDown']) p.y += moveAmt;
    p.x = Math.max(0, Math.min(GAME_WIDTH - p.width, p.x));
    p.y = Math.max(0, Math.min(GAME_HEIGHT - p.height, p.y));

    if (p.isChangingState) {
      p.stateTimer -= deltaTime;
      if (p.stateTimer <= 0) { p.isChangingState = false; p.spriteKey = 'idle1'; }
    } else {
      p.animationTimer += deltaTime;
      if (p.animationTimer >= 0.1) { p.spriteKey = p.spriteKey === 'idle1' ? 'idle2' : 'idle1'; p.animationTimer = 0; }
    }

    // Collision & Spawning simplified for brevity but fully functional
    const allItems = [...obstaclesRef.current, ...collectiblesRef.current];
    obstaclesRef.current.forEach(obs => obs.x -= currentSpeed * deltaTime);
    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      if (obs.x < -100) return false;
      if (checkCollision(p, obs)) {
        if (p.spriteKey !== 'hit') { setLives(l => { if (l - 1 <= 0) setGameState('GAMEOVER'); return l - 1; }); changePlayerState(p, 'hit'); }
        return false;
      }
      return true;
    });

    collectiblesRef.current.forEach(col => col.x -= currentSpeed * deltaTime);
    collectiblesRef.current = collectiblesRef.current.filter(col => {
      if (col.x < -100) return false;
      if (checkCollision(p, col)) { setScore(s => s + 10); changePlayerState(p, 'collect'); return false; }
      return true;
    });

    if (Math.random() < 0.02) {
      const s = Math.floor(Math.random() * 45) + 40;
      const ob = { x: GAME_WIDTH + 50, y: Math.random() * (GAME_HEIGHT - 100) + 50, width: s, height: s, type: 'bomb' };
      if (!isOverlapping(ob, allItems)) obstaclesRef.current.push(ob);
    }
    if (Math.random() < 0.015) {
      const s = Math.floor(Math.random() * 35) + 35;
      const col = { x: GAME_WIDTH + 50, y: Math.random() * (GAME_HEIGHT - 100) + 50, width: s, height: s, type: `collect-${Math.floor(Math.random() * 4)}` };
      if (!isOverlapping(col, allItems)) collectiblesRef.current.push(col);
    }
  };

  const draw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const imgs = imagesRef.current;
    const p = playerRef.current;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    if (imgs.bg) ctx.drawImage(imgs.bg, 0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (gameState !== 'MENU') {
      obstaclesRef.current.forEach(o => { if (imgs.bomb) ctx.drawImage(imgs.bomb, o.x, o.y, o.width, o.height); });
      collectiblesRef.current.forEach(c => {
        const idx = parseInt(c.type.split('-')[1]);
        if (imgs.collect[idx]) ctx.drawImage(imgs.collect[idx], c.x, c.y, c.width, c.height);
      });
      const pImg = imgs[p.spriteKey === 'idle1' ? 'gatot-1' : p.spriteKey === 'idle2' ? 'gatot-2' : p.spriteKey === 'hit' ? 'gatot-hit' : 'gatot-collect'];
      if (pImg) ctx.drawImage(pImg, p.x, p.y, p.width, p.height);
    }
  };

  const loop = (time) => {
    if (gameState === 'PLAYING') update(time);
    draw();
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, imagesLoaded]);

  // ==========================================================
  // ## 🎮 UI COMPONENTS
  // ==========================================================

  const Button = ({ onClick, label, active }) => (
    <button onClick={onClick} style={{
      width: '110px', padding: '8px 0', margin: '0 5px', backgroundColor: active ? '#fff' : '#ddd',
      border: '1px solid #333', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', color: '#000', textAlign: 'center'
    }}>{label}</button>
  );

  const TouchButton = ({ symbol, code }) => (
    <button
      onTouchStart={handleTouchStart(code)} onTouchEnd={handleTouchEnd(code)}
      onMouseDown={handleTouchStart(code)} onMouseUp={handleTouchEnd(code)}
      style={{
        width: '65px', height: '65px', margin: '5px', borderRadius: '10px',
        backgroundColor: 'rgba(0,0,0,0.6)', border: '2px solid #fff', color: '#fff',
        fontSize: '24px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center'
      }}>{symbol}</button>
  );

  const ActionButton = ({ label, actionType }) => (
    <button onClick={handleAction(actionType)} style={{
      width: '100px', height: '60px', borderRadius: '10px',
      backgroundColor: actionType === 'start' ? '#28a745' : actionType === 'pause' ? '#ffc107' : '#dc3545',
      border: '2px solid #fff', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', zIndex: 100
    }}>{label}</button>
  );

  if (!imagesLoaded) return <div style={{ color: 'white', textAlign: 'center', marginTop: 50 }}>Loading Assets...</div>;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#111', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', overflow: 'hidden', touchAction: 'none'
    }}>

      {/* --- TOMBOL AKSI MOBILE (DI ATAS GAME) --- */}
      {windowSize.scale < 1.0 && (
        <div style={{
          position: 'absolute',
          // Kalkulasi posisi: (Tinggi layar - tinggi game yang diskalakan) / 2 - tinggi tombol
          top: `calc(50% - ${(GAME_HEIGHT * windowSize.scale) / 2}px - 70px)`,
          zIndex: 200
        }}>
          {gameState === 'MENU' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <ActionButton label={TEXTS.start_btn[language]} actionType="start" />
            </div>
          )}
          {gameState === 'PLAYING' && <ActionButton label={TEXTS.pause_btn[language]} actionType="pause" />}
          {gameState === 'PAUSED' && <ActionButton label={TEXTS.resume_btn[language]} actionType="pause" />}
          {gameState === 'GAMEOVER' && <ActionButton label={TEXTS.restart_btn[language]} actionType="restart" />}
        </div>
      )}


      <div style={{
        position: 'relative', width: GAME_WIDTH, height: GAME_HEIGHT,
        transform: `scale(${windowSize.scale})`, transformOrigin: 'center center',
        boxShadow: '0 0 20px rgba(0,0,0,0.8)', border: '2px solid #555', overflow: 'hidden'
      }}>
        <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} />

        {/* HUD */}
        {gameState === 'PLAYING' && (
          <div style={{ position: 'absolute', top: 10, left: 10, padding: '5px', backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: '5px', fontWeight: 'bold', color: 'black', border: 'none' }}>
            <div>{TEXTS.score[language]} {score}</div>
            <div>{TEXTS.lives[language]} {lives}</div>
          </div>
        )}

        {/* MENU OVERLAY */}
        {gameState === 'MENU' && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-start', // Mengubah ini dari 'center' ke 'flex-start'
            alignItems: 'center' // Hapus backgroundColor dari sini
          }}>
            <h1 style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)', padding: '8px 15px',
              borderRadius: '10px', border: 'none', color: 'black',
              marginTop: '20px', // Jarak dari atas
              marginBottom: '10px', // Jarak ke elemen di bawahnya
              fontSize: '30px' // Ukuran font judul dikecilkan
            }}>{TEXTS.title[language]}</h1>
            {/* --- TAMBAHKAN KODE INI UNTUK MENAMPILKAN KREDIT --- */}
            <p style={{ fontWeight: 'bold', fontSize: '14px', color: 'black', backgroundColor: 'rgba(255, 255, 255, 0.5)', padding: '5px 15px', borderRadius: '5px', border: 'none', margin: 0, marginBottom: '10px' }}>
              {TEXTS.credit[language]}
            </p>

            {/* Kotak Pilihan Bahasa */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', padding: '5px 15px', borderRadius: '5px', textAlign: 'center', color: 'black', border: 'none' }}>
              <p style={{ margin: '5px 0' }}>{TEXTS.lang_select[language]}</p>
              <div style={{ marginBottom: '10px' }}>
                <Button onClick={() => setLanguage(0)} label="English" active={language === 0} />
                <Button onClick={() => setLanguage(1)} label="Indonesia" active={language === 1} />
              </div>
            </div>

            {/* --- GRUP INSTRUKSI BAWAH (MENU & START) --- */}
            <div style={{
              position: 'absolute',
              bottom: '15px',
              width: '90%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px' // Jarak antar kotak instruksi
            }}>
              {/* Kotak Instruksi Menu */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', padding: '5px 15px', borderRadius: '5px', color: 'black', border: 'none', textAlign: 'center' }}>
                {language === 0 ? TEXTS.instructions_menu[0] : TEXTS.instructions_menu[1]}
              </div>
              {/* Kotak Instruksi Mulai (Desktop & Mobile) */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', padding: '5px 15px', borderRadius: '5px', color: 'black', border: 'none', textAlign: 'center', fontSize: windowSize.scale < 1.0 ? '14px' : '16px' }}>
                {TEXTS.start_instructions[language]}
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {gameState === 'GAMEOVER' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'black', border: 'none' }}>
            <h1>GAME OVER</h1>
            <h2>{TEXTS.score[language]} {score}</h2>
            <p>{TEXTS.gameOver[language]}</p>
          </div>
        )}

        {/* PAUSE OVERLAY */}
        {gameState === 'PAUSED' && (
          <div style={{ position: 'absolute', top: '45%', width: '100%', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.5)', padding: '10px', fontSize: '24px', fontWeight: 'bold', color: 'black', border: 'none' }}>
            {TEXTS.pause[language]}
          </div>
        )}
      </div>

      {/* --- MOBILE CONTROLS (OUTSIDE SCALED AREA) --- */}
      {windowSize.scale < 1.0 && (
        <div style={{
          position: 'absolute',
          // Kalkulasi posisi: 50% (tengah layar) + setengah tinggi game + 5px jarak
          top: `calc(50% + ${(GAME_HEIGHT * windowSize.scale) / 2}px + 5px)`,
          width: '100%',
          zIndex: 200
        }}>

          {/* D-PAD (Kiri Bawah) */}
          {gameState === 'PLAYING' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <TouchButton symbol="↑" code="btn-up" />
              <div style={{ display: 'flex' }}><TouchButton symbol="←" code="btn-left" /><TouchButton symbol="↓" code="btn-down" /><TouchButton symbol="→" code="btn-right" /></div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default WaveRiderGame;