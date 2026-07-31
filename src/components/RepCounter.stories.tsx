import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { RepCounter } from './RepCounter'

const meta = {
  title: 'Components/RepCounter',
  component: RepCounter,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  args: {
    exerciseName: 'Bench Press',
    reps: 10,
    weight: 60,
    onComplete: fn(),
  },
} satisfies Meta<typeof RepCounter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoWeight: Story = {
  args: {
    weight: undefined,
  },
}

export const HeavySet: Story = {
  args: {
    exerciseName: 'Deadlift',
    reps: 5,
    weight: 140,
  },
}
