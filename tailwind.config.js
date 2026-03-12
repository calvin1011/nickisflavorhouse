/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          primary-dark: 'var(--brand-primary-dark)',
          accent: 'var(--brand-accent)',
          muted: 'var(--brand-muted)',
          background: 'var(--brand-background)',
          foreground: 'var(--brand-foreground)',
        },
      },
    },
  },
  plugins: [],
}
