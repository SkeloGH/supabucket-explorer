/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#171717',
          card: '#2a2a2a',
          border: '#3a3a3a',
          'border-light': '#4a4a4a',
        },
        primary: '#3ecf8e',
      },
    },
  },
  plugins: [],
}

