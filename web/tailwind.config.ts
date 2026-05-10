import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:         '#FAF6EE',
        'bg-soft':  '#F5EFE3',
        card:       '#FFFFFF',
        'card-soft':'#FBF7EF',
        border:     '#EFE6D4',
        'border-soft':'#F5EEDF',
        primary:    '#0052FF',
        'primary-2':'#2D6BFF',
        'primary-soft':   '#E8F0FF',
        'primary-softer': '#F2F6FF',
        peach:       '#FF8E72',
        'peach-soft':'#FFE3D8',
        mint:        '#5BC79D',
        'mint-soft': '#D9F2E6',
        yellow:      '#FFC74A',
        'yellow-soft':'#FFF1CC',
        lavender:    '#C9C5FF',
        text:        '#1A1733',
        'text-2':    '#6B647A',
        'text-3':    '#A39DB0',
        'text-soft': '#C7C0D1',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"SF Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
