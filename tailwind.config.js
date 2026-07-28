/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx}',
    './index.{js,jsx}',
    './src/**/*.{js,jsx}',
    './global.css',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        'primary-dark': '#3B82F6',
        surface: '#F4F4F5',
        card: '#FFFFFF',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        purple: '#7C3AED',
        cyan: '#0891B2',
      },
    },
  },
  plugins: [],
};
