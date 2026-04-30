/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Earthy, handcrafted palette
        ivory: '#F8F1E5',
        parchment: '#F1E6D2',
        terracotta: {
          50: '#FBEDE3',
          100: '#F4D5BF',
          200: '#E9AC8A',
          300: '#D9825A',
          400: '#C76435',
          500: '#B14E25',
          600: '#8E3C1B',
          700: '#682A13',
        },
        mustard: {
          100: '#F6E2A8',
          200: '#EFCC73',
          300: '#E0B23C',
          400: '#C99526',
          500: '#A77719',
        },
        indigo: {
          earth: '#2E3A59',
          deep: '#1B2440',
        },
        leaf: {
          200: '#B7C9A3',
          300: '#8DA579',
          400: '#647F4E',
          500: '#445C32',
        },
        ink: {
          900: '#2A1C12',
          700: '#4B3621',
          500: '#6B5237',
          300: '#9C8466',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        hand: ['"Caveat"', '"Patrick Hand"', 'cursive'],
        deva: ['"Tiro Devanagari Hindi"', '"Noto Serif Devanagari"', 'serif'],
      },
      boxShadow: {
        soft: '0 6px 18px -8px rgba(75, 54, 33, 0.25)',
        paper: '0 1px 0 rgba(75,54,33,0.06), 0 8px 24px -12px rgba(75,54,33,0.25)',
        inset_paper: 'inset 0 1px 2px rgba(75,54,33,0.08)',
      },
      borderRadius: {
        blob: '42% 58% 63% 37% / 41% 44% 56% 59%',
        leaf: '0 70% 0 70% / 0 70% 0 70%',
      },
      backgroundImage: {
        'paper-grain':
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.45 0 0 0 0 0.32 0 0 0 0 0.18 0 0 0 0.07 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
      keyframes: {
        sway: {
          '0%,100%': { transform: 'rotate(-1.5deg)' },
          '50%': { transform: 'rotate(1.5deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        sway: 'sway 6s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease-out both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
