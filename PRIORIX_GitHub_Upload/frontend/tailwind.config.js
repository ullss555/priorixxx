/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070d19',
          900: '#0b1329',
          800: '#111c38',
          700: '#1b2a4e',
          600: '#283c6b',
        },
        teal: {
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        priority: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#3b82f6',
        }
      }
    },
  },
  plugins: [],
}
