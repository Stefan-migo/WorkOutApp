import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, userEvent, within, expect } from 'storybook/test'
import { WorkoutComplete } from './WorkoutComplete'

const meta = {
  title: 'Blocks/WorkoutComplete',
  component: WorkoutComplete,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'app' },
    a11y: { test: 'error' },
  },
  // Landmark shell: the isolated story canvas has no landmarks, so axe's
  // region rule flags bare div content (UI-primitives precedent).
  decorators: [(Story) => <main><Story /></main>],
  args: {
    intervals: 8,
    totalTimeMinutes: 42,
    onPlayAgain: fn(),
    onBackHome: fn(),
  },
} satisfies Meta<typeof WorkoutComplete>

export default meta
type Story = StoryObj<typeof meta>

// WB-4 scenarios: Play Again -> onPlayAgain, Back Home -> onBackHome.
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Play Again' }))
    expect(args.onPlayAgain).toHaveBeenCalledTimes(1)
    await userEvent.click(canvas.getByRole('button', { name: 'Back Home' }))
    expect(args.onBackHome).toHaveBeenCalledTimes(1)
  },
}

export const CustomTitle: Story = {
  args: {
    title: 'Great job!',
  },
}
