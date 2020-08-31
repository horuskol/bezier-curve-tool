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
      }
    },
    fontFamily: {
      'default': 'roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans',
      'fancy': '"Homemade Apple", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI"'
    }
  },
  variants: {},
  plugins: [],
}
