/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Esto busca en tu App.tsx y main.tsx
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}