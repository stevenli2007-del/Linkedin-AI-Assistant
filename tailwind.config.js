/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#b9dffd",
          300: "#7cc4fb",
          400: "#36a9f7",
          500: "#0c8ee8",
          600: "#0070c6",
          700: "#0159a0",
          800: "#064c84",
          900: "#0b3f6d",
        },
      },
      borderRadius: {
        apple: "10px",
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
