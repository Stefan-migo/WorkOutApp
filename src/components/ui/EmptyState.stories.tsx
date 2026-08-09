import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { EmptyState } from './EmptyState'
import { Button } from './Button'

const meta = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'app' },
    a11y: { test: 'error' },
  },
  // Landmark shell: the isolated story canvas has no landmarks, so axe's
  // region rule flags bare content (repo pattern — see Badge).
  decorators: [(Story) => <main><Story /></main>],
  args: {
    title: 'No exercises yet',
    body: 'Add your first exercise to get started',
  },
  argTypes: {
    title: { control: 'text' },
    body: { control: 'text' },
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// UIP-5 scenario: EmptyState with an action — title, message, and action all
// render. Icon is decorative (aria-hidden), colored via the text-meta token.
export const WithAction: Story = {
  render: (args) => (
    <EmptyState
      {...args}
      icon={
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      }
      action={<Button onClick={fn()}>Add exercise</Button>}
    />
  ),
}
