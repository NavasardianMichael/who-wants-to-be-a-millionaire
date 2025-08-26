/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      padding: {
        small: "4px",
        medium: "8px",
        large: "16px",
      },
      margin: {
        small: "4px",
        medium: "8px",
        large: "16px",
      },
      colors: {
        primary: "#002876",
        secondary: "#ffffff",
      },
    },
  },
  plugins: [],
};
