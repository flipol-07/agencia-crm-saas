import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ---- Aurie design system (CSS variables driven, theme-aware) ----
        bg: 'var(--bg)',
        'bg-2': 'var(--bg-2)',
        'bg-3': 'var(--bg-3)',
        'bg-4': 'var(--bg-4)',
        paper: 'var(--paper)',
        ink: {
          100: 'var(--ink-100)',
          200: 'var(--ink-200)',
          300: 'var(--ink-300)',
          400: 'var(--ink-400)',
          450: 'var(--ink-450)',
          500: 'var(--ink-500)',
          600: 'var(--ink-600)',
          700: 'var(--ink-700)',
        },
        accent: 'var(--accent)',
        'accent-hi': 'var(--accent-hi)',
        'accent-soft': 'var(--accent-soft)',
        'accent-tint': 'var(--accent-tint)',
        ochre: 'var(--ochre)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        divider: {
          DEFAULT: 'var(--divider)',
          2: 'var(--divider-2)',
          strong: 'var(--divider-strong)',
        },

        // ---- Legacy bridge: map old token names to new theme-aware vars ----
        background: {
          DEFAULT: 'var(--bg)',
          secondary: 'var(--bg-2)',
          tertiary: 'var(--bg-3)',
          glass: 'rgba(13, 10, 27, 0.6)',
          'glass-strong': 'rgba(8, 1, 18, 0.8)',
        },
        text: {
          primary: 'var(--ink-700)',
          secondary: 'var(--ink-500)',
          muted: 'var(--ink-300)',
        },
        brand: {
          DEFAULT: 'var(--accent)',
          purple: 'var(--ochre)',         // legacy purple -> secondary (violet on dark, lime on light)
          cyan: 'var(--accent)',
          pink: 'var(--accent)',
          neon: {
            purple: 'var(--ochre)',
            blue: 'var(--ochre)',
            cyan: 'var(--accent)',
            lime: 'var(--accent)',
          }
        },
        border: {
          subtle: 'var(--divider-2)',
          medium: 'var(--divider)',
          glow: 'var(--accent-line)',
        }
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        // `font-display` is widely used as a "weighty heading" cue across the
        // codebase. For a CRM we want it legible, not a condensed display face,
        // so it maps to the body font here. The Anton wordmark font is
        // available via the explicit `.aurie-wordmark` class only.
        display: ['var(--font-body)', 'system-ui', 'sans-serif'],
        wordmark: ['var(--font-wordmark)', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
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
          '0%, 100%': { boxShadow: '0 0 10px rgba(184, 240, 58, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(184, 240, 58, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}

export default config
