import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // ponytail: app dark mode is OS-driven (prefers-color-scheme), no manual toggle
    // DD-6: single Happy Hues theme — bg from token, no stale Material/raw hexes
    backgrounds: {
      default: 'app',
      values: [{ name: 'app', value: 'var(--color-bg)' }],
    },
  },
}

export default preview
