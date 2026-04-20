/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['InterVariable', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        violet: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          900: '#2e1065',
        },
        indigo: {
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
      },
      boxShadow: {
        glass:   '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        glow:    '0 0 20px rgba(124,58,237,0.5), 0 4px 16px rgba(0,0,0,0.4)',
        'glow-sm': '0 0 10px rgba(124,58,237,0.35)',
        card:    '0 8px 32px rgba(0,0,0,0.3)',
        navbar:  '0 8px 32px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'grad-brand':   'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
        'grad-subtle':  'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(99,102,241,0.15) 100%)',
        'grad-hero':    'linear-gradient(135deg, #ffffff 0%, #c4b5fd 55%, #818cf8 100%)',
        'grad-page':    'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,58,237,0.18) 0%, transparent 70%)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':     { transform: 'translate(40px,-30px) scale(1.08)' },
          '66%':     { transform: 'translate(-30px,20px) scale(0.95)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 10px rgba(124,58,237,0.3)' },
          '50%':     { boxShadow: '0 0 24px rgba(124,58,237,0.6)' },
        },
      },
      animation: {
        'fade-up':    'fade-up 0.5s ease forwards',
        'fade-in':    'fade-in 0.4s ease forwards',
        blob:         'blob 9s ease-in-out infinite',
        shimmer:      'shimmer 2.5s linear infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
