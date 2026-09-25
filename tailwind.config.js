module.exports = {
  content: ['./*.html', './gallery/**/*.html'],
  theme: {
    extend: {
      colors: {
        cn: {
          red: '#e53935',
          darkred: '#b71c1c',
          black: '#0a0a0a',
          base: '#121212',
          card: '#1a1a1a',
          border: '#2a2a2a',
          text: '#e0e0e0',
          muted: '#9e9e9e'
        }
      },
      fontFamily: {
        oswald: ['Oswald', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif']
      },
      backgroundImage: {
        hazard: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(229, 57, 53, 0.1) 10px, rgba(229, 57, 53, 0.1) 20px)'
      }
    }
  },
  plugins: []
};