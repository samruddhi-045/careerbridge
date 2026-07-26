/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16161D",       // near-black, all primary text and the side panel
        paper: "#F7F7F4",     // page background
        line: "#E4E3DC",      // hairline borders
        muted: "#6B6B75",     // secondary text
        accent: "#3E5AC7",    // single brand colour: buttons, focus, active step
        "accent-soft": "#EEF1FD",
        danger: "#B3261E",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "sans-serif"],
        sans: ['"Public Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};