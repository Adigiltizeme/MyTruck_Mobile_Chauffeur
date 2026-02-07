/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E11D48', // Rouge My Truck
          hover: '#BE123C',
          light: '#FEE2E2',
        },
        status: {
          progress: {
            text: '#B45309',
            bg: '#FEF3C7',
          },
          waiting: {
            text: '#1E40AF',
            bg: '#DBEAFE',
          },
          completed: {
            text: '#065F46',
            bg: '#D1FAE5',
          }
        }
      },
      borderRadius: {
        'xl': '1rem',
      }
    },
  },
  plugins: [],
}
