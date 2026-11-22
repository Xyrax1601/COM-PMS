/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mongo: {
          dark: '#001E2B',
          darker: '#09131B',
          card: '#0B1924',
          border: '#1C2D38',
          subtle: '#2C3E50',
          green: '#00ED64',
          greenHover: '#00C351',
          forest: '#00684A',
          forestDark: '#023430',
          lightBg: '#F9FBFA',
          lightBorder: '#E8EDEB',
          lightCard: '#FFFFFF',
          mutedText: '#64748B',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
