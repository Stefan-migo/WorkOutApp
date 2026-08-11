import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, userEvent, within, expect } from 'storybook/test'
import { PlayScreenSplit } from './PlayScreenSplit'
import { MOCK_EXERCISE_IMAGE } from './mock-data'

const meta = {
  title: 'Blocks/PlayScreenSplit',
  component: PlayScreenSplit,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
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
    imageUrl: MOCK_EXERCISE_IMAGE,
    exerciseName: 'Kettlebell Swing',
  },
} satisfies Meta<typeof PlayScreenSplit>

export default meta
type Story = StoryObj<typeof meta>

// Split layout: image panel owns the context row; the play fn exercises
// Pause -> onPause on the timer panel.
export const Running: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Pause' }))
    expect(args.onPause).toHaveBeenCalledTimes(1)
  },
}

// Flat fallback: no imageUrl -> PlayScreen structure verbatim.
export const RunningNoImage: Story = {
  args: {
    imageUrl: undefined,
  },
}

export const Paused: Story = {
  args: {
    status: 'paused',
  },
}

// Reps mode swaps the timed display for RepCounter; the overlay name hides.
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

// SB 10 story-level viewport (core feature): mobile1 = Small mobile 320x568.
export const MobileRunning: Story = {
  args: {
    imageUrl: MOCK_EXERCISE_IMAGE,
    exerciseName: 'Kettlebell Swing',
  },
  globals: {
    viewport: { value: 'mobile1' },
  },
}

// Futuristic energy-bar progress (running args + variant).
export const FuturisticProgress: Story = {
  args: {
    progressVariant: 'futuristic',
  },
}

// Segmented LED progress (running args + variant).
export const SegmentedProgress: Story = {
  args: {
    progressVariant: 'segmented',
  },
}
