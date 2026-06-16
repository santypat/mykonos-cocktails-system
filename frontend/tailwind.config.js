/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00F0FF',
          pink: '#FF006E',
          purple: '#BD00FF',
          blue: '#0096FF',
          green: '#00FF85',
          yellow: '#FFD60A',
          gold: '#D4AF37',
        },
        dark: {
          900: '#0A0A0A',
          800: '#121212',
          700: '#1A1A1A',
          600: '#242424',
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #00F0FF, 0 0 20px #00F0FF, 0 0 30px #00F0FF',
        'neon-pink': '0 0 10px #FF006E, 0 0 20px #FF006E, 0 0 30px #FF006E',
        'neon-purple': '0 0 10px #BD00FF, 0 0 20px #BD00FF, 0 0 30px #BD00FF',
        'neon-gold': '0 0 10px #D4AF37, 0 0 20px #D4AF37, 0 0 30px #D4AF37',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
