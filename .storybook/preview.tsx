import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'

const trainingStories = new Set([
  'Blocks/PlayScreen',
  'Blocks/PlayScreenSplit',
  'Blocks/RepCounter',
  'Blocks/WorkoutComplete',
  'Components/TimerControls',
  'Components/TimerRing',
])

const preview: Preview = {
  decorators: [(Story, context) => trainingStories.has(context.title)
    ? <div className="training-theme bg-bg text-fg-2"><Story /></div>
    : <Story />],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'app',
      values: [{ name: 'app', value: 'var(--color-bg)' }],
    },
  },
}

export default preview
