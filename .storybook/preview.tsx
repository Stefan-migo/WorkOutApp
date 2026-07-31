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
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: 'var(--color-background)' },
        { name: 'dark', value: '#0a0e1a' },
        { name: 'light', value: '#f8f9ff' },
      ],
    },
  },
}

export default preview
