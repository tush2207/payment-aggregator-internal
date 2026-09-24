/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cbi: {
          blue: '#004990',
          'blue-dark': '#003366',
          'blue-light': '#176FC1',
          red: '#C8102E',
          'red-dark': '#990011',
          gold: '#D97706',
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        }
      }
    },
  },
  plugins: [],
}
