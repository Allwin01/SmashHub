'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface Props {
  winnerNames: string;
}

const ConfettiEffect = ({ winnerNames }: Props) => {
  useEffect(() => {
    const duration = 4500;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 z-50 text-white text-2xl font-bold drop-shadow">
      🏆 {winnerNames}
    </div>
  );
};

export default ConfettiEffect;
