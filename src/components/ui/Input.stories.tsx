import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Input } from './Input'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'app' },
    a11y: { test: 'error' },
  },
  // Landmark shell: the isolated story canvas has no landmarks, so axe's
  // region rule flags bare label/field content (repo pattern — see Badge).
  decorators: [(Story) => <main><Story /></main>],
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// UIP-4 scenario: error renders near the field, announced via
// aria-invalid + aria-describedby (axe-verified in the a11y browser suite).
export const WithError: Story = {
  args: {
    value: 'not-an-email',
    error: 'Enter a valid email address',
  },
}

export const WithLeadingIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search exercises',
    leadingIcon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        className="h-5 w-5"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
}
