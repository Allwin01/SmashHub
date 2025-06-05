
// frontend/postcss.config.js
module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    // Add cssnano only for production builds
    ...(process.env.NODE_ENV === 'production' ? { 'cssnano': {} } : {})
  }
}