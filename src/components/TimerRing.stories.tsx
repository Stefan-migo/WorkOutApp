import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { TimerRing } from './TimerRing'

const meta = {
  title: 'Components/TimerRing',
  component: TimerRing,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  args: {
    timeLeft: 45,
    duration: 60,
    intervalType: 'work',
    label: 'WORK',
  },
} satisfies Meta<typeof TimerRing>

export default meta
type Story = StoryObj<typeof meta>

export const Work: Story = {}

export const Rest: Story = {
  args: {
    timeLeft: 20,
    duration: 30,
    intervalType: 'rest',
    label: 'REST',
  },
}

export const Prepare: Story = {
  args: {
    intervalType: 'prepare',
    label: 'GET READY',
    nextLabel: 'Up next: Work',
  },
}

export const Cooldown: Story = {
  args: {
    timeLeft: 120,
    duration: 180,
    intervalType: 'cooldown',
    label: 'COOLDOWN',
  },
}

export const AlmostDone: Story = {
  args: {
    timeLeft: 5,
    duration: 60,
    intervalType: 'work',
    label: 'WORK',
  },
}

export const RepsMode: Story = {
  args: {
    isRepsMode: true,
    label: 'REPS',
    nextLabel: 'Up next: Rest',
  },
}
