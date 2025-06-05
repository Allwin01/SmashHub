'use client';

import { useEffect, useState } from 'react';

export default function PasswordStrengthMeter({ password }: { password: string }) {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setFeedback('');
      return;
    }

    let score = 0;
    let messages: string[] = [];

    // Length check
    if (password.length >= 8) score += 1;
    else messages.push('Use at least 8 characters');

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else messages.push('Add lowercase letters');

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else messages.push('Add uppercase letters');

    // Number check
    if (/\d/.test(password)) score += 1;
    else messages.push('Add numbers');

    // Special char check
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else messages.push('Add special characters');

    setStrength(score);
    setFeedback(messages.join(', '));
  }, [password]);

  const getColor = () => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getWidth = () => {
    return `${(strength / 5) * 100}%`;
  };

  return (
    <div className="mt-2">
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all duration-300`} 
          style={{ width: getWidth() }}
        ></div>
      </div>
      {feedback && (
        <p className="text-xs text-gray-500 mt-1">
          {strength < 3 ? `Weak password: ${feedback}` : 'Strong password!'}
        </p>
      )}
    </div>
  );
}