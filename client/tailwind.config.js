/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0F19",
        cardBg: "rgba(255, 255, 255, 0.03)",
        primaryAcc: "#8B5CF6",
        secondaryAcc: "#06B6D4",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif']
      }
    },
  },
  plugins: [],
}
