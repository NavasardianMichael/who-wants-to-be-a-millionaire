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
        xl: '2rem',

        0.05: '0.05rem',
      },
      colors: {
        primary: '#002876',
        'primary-dark': '#001d5b',
        'primary-contrast': '#00185f',
        secondary: '#ffffff',
        tertiary: '#cc9f31',
        'dark-orange': '#ff7805',

        'gradient-from': '#0a2a66',
        'gradient-to': '#103d8a',
      },
      width: {
        300: '300px',
        140: '140px',
      },
    },
  },
  plugins: [],
}
