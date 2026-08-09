import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, userEvent, within, expect } from 'storybook/test'
import { useState } from 'react'
import { SearchInput, type SearchInputProps } from './SearchInput'

// Controlled component — stories need a stateful shell so typing and the
// clear affordance behave like a real search field (UIP-4).
function StatefulSearch({
  initial = '',
  ...rest
}: Partial<SearchInputProps> & { initial?: string }) {
  const [value, setValue] = useState(initial)
  return <SearchInput {...rest} value={value} onChange={setValue} />
}

const meta = {
  title: 'UI/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'app' },
    a11y: { test: 'error' },
  },
  // Landmark shell: the isolated story canvas has no landmarks, so axe's
  // region rule flags bare form content (repo pattern — see Badge).
  decorators: [(Story) => <main><Story /></main>],
  args: {
    label: 'Search',
    placeholder: 'Search exercises',
    value: '',
    onChange: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof SearchInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <StatefulSearch {...args} />,
}

// UIP-4/UIP-7: the clear affordance is visible when the value is non-empty;
// clicking it clears the field and refocuses the input.
export const ClearAffordance: Story = {
  args: { placeholder: 'Search exercises' },
  render: (args) => <StatefulSearch initial="squat" {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('searchbox')
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }))
    await expect(input).toHaveValue('')
    await expect(input).toHaveFocus()
  },
}
