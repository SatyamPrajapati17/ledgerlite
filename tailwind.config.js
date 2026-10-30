/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brutal: {
          red: "#FF2A2A",
          yellow: "#FFE500",
          black: "#0F0F0F",
          white: "#FFFFFF",
          cream: "#FFFDEB",
          gray: "#EAEAEA",
          green: "#00E065",
          blue: "#2563EB",
          darkred: "#C71010",
        },
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px #000000',
        'brutal': '4px 4px 0px #000000',
        'brutal-lg': '6px 6px 0px #000000',
        'brutal-xl': '8px 8px 0px #000000',
        'brutal-red': '4px 4px 0px #FF2A2A',
        'brutal-yellow': '4px 4px 0px #FFE500',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        display: ['var(--font-italiana)', 'Italiana', 'Playfair Display', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Space Mono', 'Courier New', 'monospace'],
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
};
