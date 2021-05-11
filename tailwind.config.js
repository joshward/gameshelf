const plugin = require('tailwindcss/plugin')

module.exports = {
  purge: ['./public/index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      gridTemplateColumns: {
        'cards': 'repeat(auto-fill, minmax(300px, 1fr))'
      },
      fontFamily: {
        sans: ["Open Sans", "sans-serif"],
        serif: ["Cutive", "serif"],
        mono: ["Cutive Mono", "monospace"]
      },
    },
  },
  variants: {
    extend: {
      position: ['before', 'after'],
      height: ['before', 'after'],
      width: ['before', 'after'],
      inset: ['before', 'after'],
      backgroundColor: ['before', 'after'],
      borderRadius: ['before', 'after'],
      borderWidth: ['before', 'after'],
      borderColor: ['before', 'after'],
      borderStyle: ['before', 'after'],
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-pseudo-elements'),
    plugin(({ addUtilities }) => {
      addUtilities(
        {
          '.empty-content': {
            content: "''",
          },
        },
        ['before', 'after']
      )
    })
  ],
}
