/** @type {import('tailwindcss').Config} */


module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './public/fonts/*.{js,ts,jsx,tsx,mdx,otf}'
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        'gray': {
          dm_light: '#919191',
          dm_dark: '#2f2e2e',
        }
      }
    },

  },
  plugins: [
  ],
}
