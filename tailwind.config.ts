import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sipuni-primary': '#0066cc',
        'sipuni-secondary': '#ff6b35',
        'sipuni-dark': '#1a1a1a',
      }
    },
  },
  plugins: [],
}
export default config
