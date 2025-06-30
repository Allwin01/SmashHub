import React from 'react';

interface ProgressProps {
  value: number;
}

export const Progress: React.FC<ProgressProps> = ({ value }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className="bg-blue-600 h-3 rounded-full"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
};
