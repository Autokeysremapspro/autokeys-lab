import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1360px',
    },
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        akdark: '#07080A',
        akred: '#EF202D',
        ink: '#07080A',
        copper: {
          // Compatibility aliases for older components: visually resolve to AK red.
          DEFAULT: '#EF202D',
          bright: '#FF5460',
          deep: '#B51620',
        },
        signal: {
          DEFAULT: '#5EEAD4',
          bright: '#99F6E4',
        },
        chalk: '#F5F5F5',
      },
    },
  },
  plugins: [],
}

export default config
