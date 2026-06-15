/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#fbf2f4',
          100: '#f7e3e8',
          200: '#edc2cd',
          300: '#e09aab',
          400: '#cf6280',
          500: '#b53b5f',
          600: '#9d274b',
          700: '#7b1e3b',
          800: '#671b33',
          900: '#581a2f',
        },
        cream: '#faf7f2',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
