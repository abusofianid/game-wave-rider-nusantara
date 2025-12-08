// File: useGameWindow.js (Buat file ini di direktori src Anda)

import { useState, useEffect } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export const useGameWindow = () => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
        scale: 1,
    });

    useEffect(() => {
        const handleResize = () => {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            // Hitung skala berdasarkan lebar layar vs lebar game
            const widthRatio = screenWidth / GAME_WIDTH;
            const heightRatio = screenHeight / GAME_HEIGHT;

            // Gunakan skala terkecil agar game muat di layar tanpa terpotong
            const scale = Math.min(widthRatio, heightRatio);

            setWindowSize({
                width: screenWidth,
                height: screenHeight,
                scale: scale,
            });
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Panggil saat mount pertama kali

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};