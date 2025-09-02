/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      spacing: {
        xxs: '0.1rem',
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
      },
      colors: {
        primary: '#002876',
        'primary-dark': '#001d5b',
        secondary: '#ffffff',
        tertiary: '#cc9f31',
      },
    },
  },
  plugins: [],
}
