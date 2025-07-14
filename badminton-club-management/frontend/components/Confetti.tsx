// components/Confetti.tsx
'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

const ConfettiOverlay: React.FC = () => {
  const [windowDimension, setWindowDimension] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowDimension({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  return (
    <Confetti
      width={windowDimension.width}
      height={windowDimension.height}
      numberOfPieces={400}
      gravity={0.2}
      recycle={false}
      tweenDuration={6000}
    />
  );
};

export default ConfettiOverlay;
