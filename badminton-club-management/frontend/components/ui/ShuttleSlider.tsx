
'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ShuttleSliderProps {
  label: string;
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function ShuttleSlider({ label, value = 1, onChange, disabled = false }: ShuttleSliderProps) {
  const [internalValue, setInternalValue] = useState<number>(value);

  const getLabel = () => {
    if (internalValue <= 4) return '🥉 Beginner';
    if (internalValue <= 7) return '🥈 Intermediate';
    return '🥇 Advanced';
  };

  const getColor = () => {
    if (internalValue <= 4) return 'bg-blue-400';
    if (internalValue <= 7) return 'bg-violet-500';
    return 'bg-pink-500';
  };

  const handleSliderChange = (val: number) => {
    setInternalValue(val);
    onChange(val);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold text-gray-700">{label}</h2>
        <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700 shadow">
          {getLabel()} (Level {internalValue})
        </span>
      </div>

      <div className="relative w-full h-5 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 via-violet-500 to-pink-500">
        <div
          className={`absolute top-0 left-0 h-full ${getColor()} opacity-70 blur-sm`}
          style={{
            width: `${(internalValue / 10) * 100}%`,
            transition: 'width 0.3s ease-in-out',
          }}
        />
        <div
          className={`absolute top-0 left-0 h-full ${getColor()}`}
          style={{
            width: `${(internalValue / 10) * 100}%`,
            transition: 'width 0.3s ease-in-out',
          }}
        />
        <div
          className="absolute top-1/2 z-20"
          style={{
            left: `${(internalValue / 10) * 100}% - 12px`,
            transform: 'translateX(-50%)',
            transition: 'left 0.3s ease-in-out',
          }}
        >
          <Image
            src="/energy-bolt-glow.svg"
            alt="Bolt"
            width={32}
            height={32}
            className="drop-shadow-[0_0_8px_cyan]"
          />
        </div>
      </div>

      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={internalValue}
        onChange={(e) => handleSliderChange(parseInt(e.target.value))}
        disabled={disabled}
        className="w-full mt-4 appearance-none h-2 bg-transparent focus:outline-none accent-transparent"
      />
    </div>
  );
}

