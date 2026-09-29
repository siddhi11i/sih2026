/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bis: {
          navy: '#0F172A',
          blue: '#1E3A8A',
          gold: '#D97706',
          emerald: '#059669',
          amber: '#D97706',
          slate: '#334155'
        }
      }
    },
  },
  plugins: [],
}

