'use client';

import * as React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, ...props }, ref) => (
    <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
      <input
        type="checkbox"
        ref={ref}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  )
);

Checkbox.displayName = 'Checkbox';
