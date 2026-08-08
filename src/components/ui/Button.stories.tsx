import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, userEvent, within, expect } from 'storybook/test'
import { Button } from './Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'app' },
    a11y: { test: 'error' },
  },
  args: {
    children: 'Save',
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'ghost', 'outline', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    pill: { control: 'boolean' },
    elevated: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Cancel' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: 'Cancel' },
}

export const Danger: Story = {
  args: { variant: 'danger', children: 'Delete' },
}

export const Sizes: Story = {
  args: { size: 'sm', children: 'Small' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Small' })
    await userEvent.click(button)
    expect(args.onClick).toHaveBeenCalledTimes(1)
  },
}

export const Pill: Story = {
  args: { pill: true, children: '✓' },
}

export const ElevatedFab: Story = {
  args: { elevated: true, pill: true, children: '+' },
}

export const Disabled: Story = {
  args: { disabled: true },
}
