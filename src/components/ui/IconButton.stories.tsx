import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { IconButton } from './IconButton'

const meta = {
  title: 'UI/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'app' },
    a11y: { test: 'error' },
  },
  args: {
    'aria-label': 'Add exercise',
    children: '+',
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'ghost', 'outline', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Ghost: Story = {
  args: { variant: 'ghost' },
}

export const Outline: Story = {
  args: { variant: 'outline' },
}

export const Danger: Story = {
  args: { variant: 'danger', 'aria-label': 'Delete exercise' },
}
