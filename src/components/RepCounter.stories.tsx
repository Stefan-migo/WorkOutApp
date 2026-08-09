import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, userEvent, within, expect } from 'storybook/test'
import { RepCounter } from './RepCounter'

const meta = {
  title: 'Blocks/RepCounter',
  component: RepCounter,
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
    exerciseName: 'Bench Press',
    reps: 10,
    weight: 60,
    onComplete: fn(),
  },
} satisfies Meta<typeof RepCounter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Complete set' }))
    expect(args.onComplete).toHaveBeenCalledTimes(1)
  },
}

export const NoWeight: Story = {
  args: {
    weight: undefined,
  },
}
