/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0d0b08',
          secondary: '#15120e',
          elevated: '#1e1a14',
        },
        accent: {
          red: '#c4553a',
          violet: '#c4835b',
          gold: '#d4a056',
        },
        text: {
          primary: '#f2ece6',
          secondary: '#9a8a7a',
          muted: '#5a4a3a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-violet': '0 0 20px rgba(196,131,91,0.25), 0 0 60px rgba(196,131,91,0.1)',
        'glow-red': '0 0 20px rgba(196,85,58,0.25), 0 0 60px rgba(196,85,58,0.1)',
        'glow-gold': '0 0 20px rgba(212,160,86,0.25), 0 0 60px rgba(212,160,86,0.1)',
        'elevation-1': '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)',
        'elevation-2': '0 4px 6px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
        'elevation-3': '0 10px 25px rgba(0,0,0,0.5), 0 6px 10px rgba(0,0,0,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
        'glow-breathe': 'glowBreathe 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowBreathe: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
