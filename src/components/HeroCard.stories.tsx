import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import HeroCard from './HeroCard'

const meta = {
  title: 'Blocks/Today',
  component: HeroCard,
  decorators: [(Story) => <main className="mx-auto max-w-xl p-16"><Story /></main>],
} satisfies Meta<typeof HeroCard>

export default meta
type Story = StoryObj<typeof meta>

export const Workout: Story = {
  args: {
    hasWorkouts: true,
    training: { title: 'Full-body intervals', details: '8 intervals · 24:00', href: '/workouts/example/play', kind: 'workout' },
  },
}

export const Sequence: Story = {
  args: {
    hasWorkouts: true,
    training: { title: 'Strength and mobility', details: '2 workouts', href: '/sequences/example/play', kind: 'sequence' },
  },
}

export const FreeDay: Story = { args: { hasWorkouts: true } }
export const NewAccount: Story = { args: { hasWorkouts: false } }
