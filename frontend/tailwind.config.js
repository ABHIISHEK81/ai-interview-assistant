/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'Outfit', 'system-ui', 'sans-serif'],
        heading: ['Outfit', '"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1', // Primary Brand Color
          600: '#4F46E5', // Primary CTA Hover
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        accent: {
          cyan: '#06B6D4', // Neon Cyan
          cyanGlow: '#22D3EE',
          mint: '#10B981', // Mint / Emerald
          mintGlow: '#34D399',
        },
        dark: {
          bg: '#090D16',       // Deep Midnight (Main BG)
          slate: '#0F172A',    // Slate-900 (Alternative Main BG)
          surface: '#1E293B',  // Slate-800 (Card / Surface BG)
          border: '#334155',   // Subtle Border
          muted: '#162032',
        },
        text: {
          heading: '#F8FAFC',  // Crisp White
          body: '#94A3B8',     // Muted Slate
          muted: '#64748B',    // Dim Slate
        },
      },
      boxShadow: {
        'glow-primary': '0 0 25px -4px rgba(99, 102, 241, 0.4)',
        'glow-cyan': '0 0 25px -4px rgba(6, 182, 212, 0.4)',
        'glow-mint': '0 0 25px -4px rgba(16, 185, 129, 0.4)',
        'card-saas': '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
      },
    },
  },
  plugins: [],
};
