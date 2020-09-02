module.exports = {
  purge: {
    content: [
      './src/**/*.html',
      './src/**/*.vue'
    ],
  },
  theme: {
    extend: {
      gridTemplateRows: {
        'layout': 'auto 1fr auto'
      },
      gridTemplateColumns: {
        'layout': '21rem auto 16rem'
      }
    },
    fontFamily: {
      'default': 'roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans',
      'fancy': '"Homemade Apple", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI"'
    }
  },
  variants: {
    backgroundColor: ['responsive', 'hover', 'focus', 'disabled'],
  },
  plugins: [],
}
