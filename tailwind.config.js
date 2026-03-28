/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--primary) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-light': 'rgb(var(--surface-light) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--accent-hover) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'none': '0',
        'sm': '6px',
        DEFAULT: '6px',
        'md': '6px',
        'lg': '6px',
        'xl': '6px',
        '2xl': '6px',
        '3xl': '6px',
        'full': '6px', // Literally matching user request "ONLY 6px"
      },
    },
  },
  plugins: [],
}

