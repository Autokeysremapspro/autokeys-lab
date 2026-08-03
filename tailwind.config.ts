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
        akdark: '#0a0d12',
        akred: '#e2954d',
        ink: '#0A0D12',
        copper: {
          DEFAULT: '#E2954D',
          bright: '#FFB870',
          deep: '#8A4A1F',
        },
        signal: {
          DEFAULT: '#5EEAD4',
          bright: '#99F6E4',
        },
        chalk: '#F5F1E8',
      },
    },
  },
  plugins: [],
}

export default config
