// components/ConfettiEffect.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

interface Props {
  winnerNames: string;
  containerId: string; // target container like 'court-1'
  onComplete?: () => void;
}

const ConfettiEffect = ({ winnerNames, containerId, onComplete }: Props) => {
  const [showBanner, setShowBanner] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const duration = 2000; // Confetti animation duration
    const animationEnd = Date.now() + duration;
    const courtContainer = document.getElementById(containerId);

    if (!courtContainer) return;
    const { left, top, width, height } = courtContainer.getBoundingClientRect();

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: {
          x: (left + width / 2) / window.innerWidth,
          y: (top + height / 2) / window.innerHeight
        },
        colors: ['#FF5E5B', '#00CECB', '#FFED66', '#00A6ED', '#6B5B95', '#FFB347'], // vibrant colors

        scalar: 1.2
      });
    }, 250);

    const timeout = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        setShowBanner(false);
        if (onComplete) onComplete();
      }, 600); // fade-out duration
    }, 2600); // Slightly longer than confetti duration

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [containerId, onComplete]);

  if (!showBanner) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 flex items-center justify-center z-50 transition-opacity duration-500 ${fadingOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="relative bg-yellow-100 text-yellow-700 text-center px-6 py-4 rounded-lg shadow-xl drop-shadow-xl animate-fade-in-up space-y-2 border border-yellow-300">
        <div className="text-3xl md:text-4xl font-extrabold tracking-wide">🏆 WINNER</div>
        <div className="text-xl md:text-2xl font-semibold">{winnerNames}</div>
        <button
          onClick={() => {
            setFadingOut(true);
            setTimeout(() => {
              setShowBanner(false);
              if (onComplete) onComplete();
            }, 500);
          }}
          className="absolute top-0 right-2 text-yellow-700 text-sm hover:text-red-500"
        >
          ❌
        </button>
      </div>
    </div>
  );
};

export default ConfettiEffect;
