import { useState, useEffect } from 'react';

export function useGameWindow() {
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 800, height: 600, scale: 1 };
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = Math.min(w / 800, h / 600);
    return { width: w, height: h, scale: Math.max(0.3, scale) };
  });

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Calculate fit scale for 800x600 game board
      const scaleX = w / 820;
      const scaleY = h / 620;
      const scale = Math.min(scaleX, scaleY);
      setWindowSize({
        width: w,
        height: h,
        scale: Math.max(0.35, Math.min(scale, 1.5)),
      });
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
