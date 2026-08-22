import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        akdark: '#07080b',
        akred: '#ff3b46',
        ink: '#090a0e',
        /* Compatibility alias: legacy components still reference `copper`,
           but it now resolves to the current Autokeys Lab red family. */
        copper: {
          DEFAULT: '#FF3B46',
          bright: '#FF6972',
          deep: '#B91F2A',
        },
        signal: {
          DEFAULT: '#5EEAD4',
          bright: '#99F6E4',
        },
        chalk: '#F5F7FB',
      },
    },
  },
  plugins: [],
}

export default config
