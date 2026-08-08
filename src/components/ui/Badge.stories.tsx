import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Badge } from './Badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'app' },
    a11y: { test: 'error' },
  },
  args: {
    children: 'New',
  },
  argTypes: {
    tone: {
      control: 'select',
      options: [
        'neutral',
        'primary',
        'success',
        'warn',
        'danger',
        'segment-prepare',
        'segment-work',
        'segment-rest',
        'segment-cooldown',
      ],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

// UIP-3 scenario: meaning is conveyed in the badge text, never color alone.
export const Neutral: Story = {}

export const Primary: Story = {
  args: { tone: 'primary', children: 'Pro' },
}

export const Success: Story = {
  args: { tone: 'success', children: 'Complete' },
}

export const Warn: Story = {
  args: { tone: 'warn', children: 'Pending' },
}

export const Danger: Story = {
  args: { tone: 'danger', children: 'Failed' },
}

export const SegmentPrepare: Story = {
  args: { tone: 'segment-prepare', children: 'Prepare' },
}

export const SegmentWork: Story = {
  args: { tone: 'segment-work', children: 'Work' },
}

export const SegmentRest: Story = {
  args: { tone: 'segment-rest', children: 'Rest' },
}

export const SegmentCooldown: Story = {
  args: { tone: 'segment-cooldown', children: 'Cooldown' },
}
