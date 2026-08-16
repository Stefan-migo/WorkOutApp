import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { ExerciseLibrary } from './ExerciseLibrary'
import { MOCK_EXERCISES } from './mock-data'

const meta = {
  title: 'Blocks/ExerciseLibrary',
  component: ExerciseLibrary,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'app' },
    a11y: { test: 'error' },
  },
  // Landmark shell: the isolated story canvas has no landmarks, so axe's
  // region rule flags bare div content (Blocks precedent).
  decorators: [(Story) => <main><Story /></main>],
  args: {
    exercises: MOCK_EXERCISES,
    favoriteIds: ['ex3', 'ex5'],
    onToggleFavorite: fn(),
    onCreate: fn(),
    onOpenExercise: fn(),
    onAssignToWorkout: fn(),
  },
} satisfies Meta<typeof ExerciseLibrary>

export default meta
type Story = StoryObj<typeof meta>

// Redesign v2: editorial header + sticky toolbar (search, category chips,
// collapsible filters) + readable list rows instead of grouped image grids.
export const Desktop: Story = {}

// SB 10 story-level viewport: mobile1 = Small mobile 320x568.
export const Mobile: Story = {
  globals: {
    viewport: { value: 'mobile1' },
  },
}

// Filter panel expanded — shows the secondary filters users open on demand.
export const FiltersOpen: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const toggle = canvasElement.querySelector<HTMLButtonElement>('button[aria-expanded]')
    if (toggle) await userEvent.click(toggle)
  },
}

export const EmptyLibrary: Story = {
  args: {
    exercises: [],
  },
}

export const NoResults: Story = {
  args: {
    exercises: [{ ...MOCK_EXERCISES[0]!, name: 'Zzzz Special' }],
  },
}
