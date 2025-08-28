/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      gap: {
        xs: '1',
        sm: '2',
        md: '4',
        lg: '6',
      },
      space: {
        xs: '1',
        sm: '2',
        md: '4',
        lg: '6',
      },
      colors: {
        primary: '#002876',
        'primary-dark': '#001d5b',
        secondary: '#ffffff',
      },
    },
  },
  plugins: [],
}
