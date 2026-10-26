/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette "Come mi vesto?" — beige, crema, terracotta, verde oliva
        cream: {
          50: '#fdfbf7',
          100: '#faf6ee',
          200: '#f3ebdb',
          300: '#ecdcc2',
          400: '#dcc6a1',
          500: '#c8b89a',
          600: '#b09f82',
          700: '#8c7d65',
          800: '#6b5f4f',
          900: '#4a4237',
        },
        terracotta: {
          50: '#fbf1ee',
          100: '#f5ddd5',
          200: '#e9b9aa',
          300: '#db8e78',
          400: '#c96d54',
          500: '#b25139',
          600: '#97412e',
          700: '#7a3326',
          800: '#5f2b22',
          900: '#47211c',
        },
        olive: {
          50: '#f6f7ee',
          100: '#ebeed8',
          200: '#d7deb4',
          300: '#bcc989',
          400: '#a3b064',
          500: '#85934a',
          600: '#697539',
          700: '#52592f',
          800: '#3f4526',
          900: '#2c3020',
        },
        sand: {
          50: '#faf8f4',
          100: '#f3eee3',
          200: '#e6dcc8',
          300: '#d4c4a3',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(74, 66, 55, 0.18)',
        card: '0 8px 32px -12px rgba(74, 66, 55, 0.22)',
      },
      backgroundImage: {
        'gradient-warm': 'linear-gradient(135deg, #faf6ee 0%, #f3ebdb 50%, #ecdcc2 100%)',
        'gradient-leaf': 'linear-gradient(160deg, #f6f7ee 0%, #ebeed8 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
