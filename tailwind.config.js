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
          /** @deprecated use accent-peach — kept for older class names */
          violet: '#c4835b',
          peach: '#c4835b',
          gold: '#d4a056',
        },
        text: {
          primary: '#f2ece6',
          secondary: '#9a8a7a',
          muted: '#7a6a5a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      // Named type scale — use these instead of arbitrary text-sm/lg/2xl/etc.
      // Roles map to component intent so the design stays coherent as it grows.
      //   meta     — small uppercase labels (12px, tracked)
      //   caption  — fine print, hover hints (13px)
      //   body-sm  — secondary body copy, dense UI (14px)
      //   body     — primary paragraph copy (16px)
      //   h3       — card titles, sub-section heads (18px)
      //   h2       — section headings (24px desktop)
      //   h1       — page titles (32px desktop)
      //   display  — hero titles (40–56px)
      fontSize: {
        meta: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.08em' }],
        caption: ['0.8125rem', { lineHeight: '1.5' }],
        'body-sm': ['0.875rem', { lineHeight: '1.6' }],
        body: ['1rem', { lineHeight: '1.6' }],
        h3: ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        h2: ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        h1: ['2rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-sm': ['2.25rem', { lineHeight: '1.1', fontWeight: '800' }],
        display: ['3.25rem', { lineHeight: '1.05', fontWeight: '800' }],
        'display-lg': ['4rem', { lineHeight: '1', fontWeight: '800' }],
      },
      // Section spacing — use mt-section / mt-section-lg for between-block gaps
      // instead of ad-hoc mt-8 / mt-12 / mt-16. Cards always p-card (24px).
      spacing: {
        card: '1.5rem',
        section: '2rem',
        'section-lg': '3rem',
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
