/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A1238',     // Main background
        secondary: '#121F3E',   // Cards, panels, sections
        accent: '#3AB0FF',      // Links, highlights
        cta: '#FF6F61',         // Call-to-action buttons
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        urbanist: ['Urbanist', 'sans-serif']
      }
    },
  },
  plugins: [],
}
