// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dungeon-bg': '#0a0e27',
        'dungeon-dark': '#141829',
        'dungeon-secondary': '#1a1f3a',
        'dungeon-text': '#e0e6ff',
        'dungeon-text-secondary': '#8892b0',
        'dungeon-border': '#d4af37',
        'dungeon-red': '#c41e3a',
        'dungeon-green': '#52b788',
        'dungeon-blue': '#4d9bf4',
        'dungeon-purple': '#7c3aed',
      },
      boxShadow: {
        'dungeon': '0 0 20px rgba(212, 175, 55, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
