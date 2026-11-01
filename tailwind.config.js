// Tokens are mirrored from ecolife-web/DESIGN.md — see DESIGN.md. Edit design-tokens.json,
// never these lines, and only after the value has changed in the web repo.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: require('./design-tokens.json'),
      fontFamily: {
        sans: ['PlusJakartaSans_500Medium'],
        regular: ['PlusJakartaSans_400Regular'],
        medium: ['PlusJakartaSans_500Medium'],
        semibold: ['PlusJakartaSans_600SemiBold'],
        bold: ['PlusJakartaSans_700Bold'],
        extrabold: ['PlusJakartaSans_800ExtraBold'],
      },
    },
  },
  plugins: [],
};
