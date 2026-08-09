import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, userEvent, within, expect } from 'storybook/test'
import { WorkoutCard } from './WorkoutCard'
import { MOCK_WORKOUTS } from './mock-data'

const meta = {
  title: 'Blocks/WorkoutCard',
  component: WorkoutCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'app' },
    a11y: { test: 'error' },
  },
  // Landmark shell: the isolated story canvas has no landmarks, so axe's
  // region rule flags bare div content (UI-primitives precedent).
  decorators: [(Story) => <main><Story /></main>],
  args: {
    workout: MOCK_WORKOUTS[0],
    onOpen: fn(),
    onPlay: fn(),
    onEdit: fn(),
    onPreview: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof WorkoutCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  // WB-1 scenarios: click opens once, Enter opens, Play plays without opening
  // (DD-1 sibling structure — the Play button is not a Card descendant).
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const card = canvas.getByText('Morning HIIT').closest('[role="button"]') as HTMLElement
    await userEvent.click(card)
    expect(args.onOpen).toHaveBeenCalledTimes(1)

    card.focus()
    await userEvent.keyboard('{Enter}')
    expect(args.onOpen).toHaveBeenCalledTimes(2)

    await userEvent.click(canvas.getByRole('button', { name: 'Play Morning HIIT' }))
    expect(args.onPlay).toHaveBeenCalledTimes(1)
    expect(args.onOpen).toHaveBeenCalledTimes(2)
  },
}

export const EmptyIntervals: Story = {
  args: { workout: { ...MOCK_WORKOUTS[0], id: 'w-empty', title: 'Empty Routine', intervals: [] } },
}

export const RepsWorkout: Story = {
  args: { workout: MOCK_WORKOUTS[1] },
}
