import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b8c7ff',
          400: '#91a5ff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4553b8',
          800: '#3a4699',
          900: '#303a7a',
        },
        dark: {
          50: '#e6e9f0',
          100: '#c1c8d9',
          200: '#9ca5bf',
          300: '#7782a4',
          400: '#525f8a',
          500: '#2d3c71',
          600: '#1a1f3a',
          700: '#151a2f',
          800: '#101424',
          900: '#0a0e27',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #5b8def 0%, #7c3aed 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(26, 31, 58, 0.7) 0%, rgba(20, 25, 48, 0.9) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glow': '0 0 20px rgba(91, 141, 239, 0.4)',
        'glow-lg': '0 0 40px rgba(91, 141, 239, 0.6)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
