import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#080112', // Deep Purple/Black (Aurie Premium)
          secondary: '#11041d', // Slightly lighter Dark Purple
          tertiary: '#1a0b2e', // Deep Slate Purple
          glass: 'rgba(13, 10, 27, 0.6)', // Frosted Dark Purple
          'glass-strong': 'rgba(8, 1, 18, 0.8)',
        },
        text: {
          primary: '#f8fafc', // Slate 50
          secondary: '#94a3b8', // Slate 400
          muted: '#64748b', // Slate 500
        },
        brand: {
          DEFAULT: '#8b5cf6', // Violet 500
          purple: '#a855f7', // Purple 500
          cyan: '#06b6d4', // Cyan 500
          pink: '#ec4899', // Pink 500
          neon: {
            purple: '#d946ef', // Fuchsia 500
            blue: '#3b82f6', // Blue 500
            cyan: '#22d3ee', // Cyan 400
            lime: '#8b5cf6', // Replaced with Purple by user request
          }
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.05)',
          medium: 'rgba(255, 255, 255, 0.1)',
          glow: 'rgba(139, 92, 246, 0.3)', // Violet glow
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-outfit)', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(139, 92, 246, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}

export default config
