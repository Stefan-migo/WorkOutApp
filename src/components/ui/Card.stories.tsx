import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, userEvent, within, expect } from 'storybook/test'
import { Card } from './Card'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'app' },
    a11y: { test: 'error' },
  },
  args: {
    children: 'Card content',
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'raised', 'inset'],
    },
    interactive: { control: 'boolean' },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Raised: Story = {
  args: { variant: 'raised', children: 'Raised card content' },
}

export const Inset: Story = {
  args: { variant: 'inset', children: 'Inset card content' },
}

export const Interactive: Story = {
  args: { interactive: true, children: 'Clickable card' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const card = canvas.getByText('Clickable card').closest('div')!
    await userEvent.click(card)
    expect(args.onClick).toHaveBeenCalledTimes(1)
  },
}
