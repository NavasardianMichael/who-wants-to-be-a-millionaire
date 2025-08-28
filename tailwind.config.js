/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],

  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      space: {
        xs: "1",
        sm: "2",
        md: "4",
        lg: "6",
      },
      padding: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
      },
      margin: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
      },
      colors: {
        primary: "#002876",
        primaryDark: "#001d5b",
        secondary: "#ffffff",
      },
    },
  },
  plugins: [],
};
