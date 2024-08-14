/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      backgroundColor: {
        primary: "#008953",
        secondary: "#FFFFFF",
        danger: "#FF6BA5",
        base: "#F0F3F4",
        warning: "#FFC95C",
        accent: "#0085FF",
        success: "#28A745",
        ['primary-transparent']: "#008953AA",
        ['secondary-transparent']: "#FFFFFFAA",
        ['danger-transparent']: "#FF6BA5AA",
        ['base-transparent']: "#F0F3F4AA",
        ['warning-transparent']: "#FFC95CAA",
        ['accent-transparent']: "#0085FFAA",
        ['success-transparent']: "#28A745AA",
      },
      colors: {
        primary: "#008953",
        secondary: "#FFFFFF",
        danger: "#FF6BA5",
        base: "#F0F3F4",
        warning: "#FFC95C",
        accent: "#0085FF",
        success: "#28A745",
      },
      keyframes: {
        jump: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        jump: 'jump 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

