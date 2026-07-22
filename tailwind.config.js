/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#fdfbf7',
          100: '#f7f2ea',
          200: '#eee3d2',
          300: '#e1cdb2',
          400: '#cc9f76',
          500: '#6F4E37', // Primary Coffee Brown
          600: '#5c3e29',
          700: '#4a301f',
          800: '#3c271b',
          900: '#322218',
        },
        secondary: {
          DEFAULT: '#D4A373',
          light: '#e2bc95',
          dark: '#b88555'
        },
        accent: {
          DEFAULT: '#588157', // Sage / Eco Green Accent
          light: '#729e71',
          dark: '#3f623e'
        },
        bgmain: '#F8F7F4',
        cardbg: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
