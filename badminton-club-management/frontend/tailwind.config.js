// tailwind.config.js
const colors = require('tailwindcss/colors');

module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark Blue (custom)
        'dark-blue': {
          DEFAULT: '#1E3A8A',  // Base color
          100: '#DBEAFE',      // Light shade (optional)
          500: '#3B82F6',      // Medium shade
          900: '#1E3A8A',      // Dark shade
        },
        // Gradient Orange (custom)
        'gradient-orange': {
          DEFAULT: '#F97316',  // Base color
          100: '#FFEDD5',      // Light shade
          500: '#F97316',      // Medium shade
          900: '#9A3412',      // Dark shade
        },
      },
    },
  },
  plugins: [],
}