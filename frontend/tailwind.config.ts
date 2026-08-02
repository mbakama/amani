import type { Config } from 'tailwindcss';

// Palette et rayons alignes sur les maquettes deja validees avec l'equipe Amani
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C1C1A',
        muted: '#8A8A85',
        line: '#EAE8E2',
        surface: '#FAFAF7',
        accent: {
          DEFAULT: '#3C3489',
          soft: '#EEEDFE',
        },
        coral: { soft: '#FAECE7', text: '#993C1D' },
        pink: { soft: '#FBEAF0', text: '#993556' },
        teal: { soft: '#E1F5EE', text: '#085041' },
        danger: { soft: '#FCEBEB', text: '#A32D2D' },
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};

export default config;
