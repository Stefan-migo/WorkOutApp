import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { TimerControls } from './TimerControls'

const meta = {
  title: 'Components/TimerControls',
  component: TimerControls,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  args: {
    status: 'running',
    onPause: fn(),
    onResume: fn(),
    onSkip: fn(),
    onRestart: fn(),
    onPrevious: fn(),
    onAddTime: fn(),
    showAddTime: false,
  },
} satisfies Meta<typeof TimerControls>

export default meta
type Story = StoryObj<typeof meta>

export const Running: Story = {}

export const Paused: Story = {
  args: {
    status: 'paused',
  },
}

export const Idle: Story = {
  args: {
    status: 'idle',
    onPrevious: undefined,
  },
}

export const RestWithAddTime: Story = {
  args: {
    status: 'running',
    showAddTime: true,
  },
}
