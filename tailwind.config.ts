import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#141414',
        surface: '#161616',
        'surface-hover': '#1E1E1E',
        border: '#2A2A2A',
        'border-light': '#333333',
        text: '#E8E6E3',
        'text-muted': '#8A8A8A',
        'text-dim': '#5A5A5A',
        accent: '#E8B931',
        'accent-dim': '#E8B93122',
        danger: '#D4594E',
        success: '#4A9B6F',
      },
      fontFamily: {
        sans: ['var(--font-grotesk-b)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-grotesk-a)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-ibm-plex)', 'Monaco', 'Courier New', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}

export default config
