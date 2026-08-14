/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enables class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: 'rgb(var(--brand-bg-rgb) / <alpha-value>)',
          card: 'rgb(var(--brand-card-rgb) / <alpha-value>)',
          border: 'rgb(var(--brand-border-rgb) / <alpha-value>)',
          text: 'var(--brand-text)',
          dim: 'var(--brand-dim)',
          accent: 'rgb(var(--brand-accent-rgb) / <alpha-value>)',
          emerald: 'rgb(var(--brand-emerald-rgb) / <alpha-value>)',
          amber: 'rgb(var(--brand-amber-rgb) / <alpha-value>)',
          rose: 'rgb(var(--brand-rose-rgb) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
