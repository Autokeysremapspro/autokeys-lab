import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        akred: '#e50914',
        akdark: '#070707',
        akpanel: '#111111'
      }
    }
  },
  plugins: []
}
export default config
