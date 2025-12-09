/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Gradient background classes for API integrations
    // Using pattern matching to ensure all gradient classes are included
    {
      pattern: /^(from|to)-(purple|pink|teal|cyan|emerald|green|blue|orange|amber|indigo|violet|gray|slate|red|rose|yellow|sky|lime|stone|neutral|fuchsia|zinc)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

