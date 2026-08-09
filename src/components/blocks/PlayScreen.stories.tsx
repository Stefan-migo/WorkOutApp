import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, userEvent, within, expect } from 'storybook/test'
import { PlayScreen } from './PlayScreen'

const meta = {
  title: 'Blocks/PlayScreen',
  component: PlayScreen,
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
    timeLeft: 45,
    duration: 60,
    intervalType: 'work',
    label: 'Work',
    status: 'running',
    onPause: fn(),
    onResume: fn(),
    onSkip: fn(),
    onRestart: fn(),
    onPrevious: fn(),
    setIndex: 0,
    setCount: 4,
    totalProgress: 0.62,
    progressPercent: 62,
    isRepsMode: false,
  },
} satisfies Meta<typeof PlayScreen>

export default meta
type Story = StoryObj<typeof meta>

// WB-3 scenarios: running state composes the four surfaces; the play fn
// exercises Pause -> onPause.
export const Running: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Pause' }))
    expect(args.onPause).toHaveBeenCalledTimes(1)
  },
}

export const Paused: Story = {
  args: {
    status: 'paused',
  },
}

// WB-3c: reps mode swaps the timed display for RepCounter.
export const RepsMode: Story = {
  args: {
    isRepsMode: true,
    exerciseName: 'Bench Press',
    reps: 10,
    weight: 60,
    onComplete: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Complete set' }))
    expect(args.onComplete).toHaveBeenCalledTimes(1)
  },
}

export const AddTime: Story = {
  args: {
    showAddTime: true,
    onAddTime: fn(),
  },
}
