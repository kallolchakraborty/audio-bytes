/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './js/**/*.js', './components/**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'rgba(233,84,32,0.06)',
          100: 'rgba(233,84,32,0.12)',
          200: 'rgba(233,84,32,0.25)',
          300: 'rgba(233,84,32,0.4)',
          400: 'rgba(233,84,32,0.6)',
          500: '#E95420',
          600: '#C34113',
          700: '#9A330E',
          800: '#72260A',
          900: '#4A1807'
        },
        glass: {
          light: 'rgba(255,255,255,0.06)',
          medium: 'rgba(255,255,255,0.1)',
          heavy: 'rgba(255,255,255,0.15)'
        }
      },
      fontFamily: {
        sans: ['Ubuntu', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Oxygen', 'Cantarell', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"Ubuntu Mono"', '"SF Mono"', '"Fira Code"', '"Fira Mono"', '"Roboto Mono"', 'monospace']
      },
      backdropBlur: {
        xs: '2px'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.25,1,0.5,1) forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.25,1,0.5,1) forwards',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.25,1,0.5,1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'equalizer': 'equalizerAnim 0.8s ease-in-out infinite alternate',
        'spin-slow': 'spin 8s linear infinite',
        'ripple': 'ripple 0.6s ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.6' },
          '50%': { opacity: '1' }
        },
        equalizerAnim: {
          '0%': { height: '3px' },
          '100%': { height: '16px' }
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }
  },
  plugins: []
};
