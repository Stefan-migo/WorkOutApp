import { describe, expect, test } from 'vitest'
import { testStory } from '@storybook/addon-vitest/internal/test-utils'
import * as WorkoutCardStories from '../WorkoutCard.stories'
import * as RepCounterStories from '../../RepCounter.stories'
import * as PlayScreenStories from '../PlayScreen.stories'
import * as PlayScreenSplitStories from '../PlayScreenSplit.stories'
import * as WorkoutCompleteStories from '../WorkoutComplete.stories'

// DD-6: browser-project compose following the ui-primitives pattern. Runs
// play functions (via the addon's testStory) and asserts axe violations
// empty per block story. Runs only under `--project storybook` (chromium)
// via STORYBOOK_COMPONENT_PATHS in vitest.browser.config.ts; the unit
// config excludes this file (jsdom cannot run play/axe).
// PR A covers WorkoutCard + RepCounter; PR B extends with PlayScreen +
// WorkoutComplete.
type StoryTestContext = Parameters<ReturnType<typeof testStory>>[0]

async function runStoryAndCheckAxe(
  ctx: StoryTestContext,
  storyConfig: Parameters<typeof testStory>[0],
) {
  await testStory(storyConfig)(ctx)
  const axe = (await import('axe-core')).default
  const result = await axe.run({
    include: [document.body],
    exclude: ['.sb-wrapper', '#storybook-docs', '#storybook-highlights-root'],
  })
  const violations = result.violations.map(
    (v: { id: string; nodes: unknown[] }) => `${v.id} (${v.nodes.length})`,
  )
  expect(violations, `axe violations: ${violations.join(', ') || 'none'}`).toEqual([])
}

function storyCase(
  storyConfig: Parameters<typeof testStory>[0],
) {
  return async (ctx: StoryTestContext) => {
    await runStoryAndCheckAxe(ctx, storyConfig)
  }
}

const workoutCard = (exportName: string, storyId: string) =>
  storyCase({
    exportName,
    story: WorkoutCardStories[exportName as keyof typeof WorkoutCardStories],
    meta: WorkoutCardStories.default,
    skipTags: [],
    storyId,
    componentPath: 'WorkoutCard.tsx',
    componentName: 'WorkoutCard',
  })

const repCounter = (exportName: string, storyId: string) =>
  storyCase({
    exportName,
    story: RepCounterStories[exportName as keyof typeof RepCounterStories],
    meta: RepCounterStories.default,
    skipTags: [],
    storyId,
    componentPath: 'RepCounter.tsx',
    componentName: 'RepCounter',
  })

const playScreen = (exportName: string, storyId: string) =>
  storyCase({
    exportName,
    story: PlayScreenStories[exportName as keyof typeof PlayScreenStories],
    meta: PlayScreenStories.default,
    skipTags: [],
    storyId,
    componentPath: 'PlayScreen.tsx',
    componentName: 'PlayScreen',
  })

const playScreenSplit = (exportName: string, storyId: string) =>
  storyCase({
    exportName,
    story: PlayScreenSplitStories[exportName as keyof typeof PlayScreenSplitStories],
    meta: PlayScreenSplitStories.default,
    skipTags: [],
    storyId,
    componentPath: 'PlayScreenSplit.tsx',
    componentName: 'PlayScreenSplit',
  })

const workoutComplete = (exportName: string, storyId: string) =>
  storyCase({
    exportName,
    story: WorkoutCompleteStories[exportName as keyof typeof WorkoutCompleteStories],
    meta: WorkoutCompleteStories.default,
    skipTags: [],
    storyId,
    componentPath: 'WorkoutComplete.tsx',
    componentName: 'WorkoutComplete',
  })

describe('Blocks a11y (DD-6)', () => {
  describe('WorkoutCard (WB-1)', () => {
    test('Default (play: click/Enter/Play)', workoutCard('Default', 'blocks-workoutcard--default'))
    test('EmptyIntervals (0 intervals)', workoutCard('EmptyIntervals', 'blocks-workoutcard--empty-intervals'))
    test('RepsWorkout', workoutCard('RepsWorkout', 'blocks-workoutcard--reps-workout'))
  })

  describe('RepCounter (WB-2)', () => {
    test('Default (play: Complete)', repCounter('Default', 'blocks-repcounter--default'))
    test('NoWeight', repCounter('NoWeight', 'blocks-repcounter--no-weight'))
  })

  describe('PlayScreen (WB-3)', () => {
    test('Running (play: Pause)', playScreen('Running', 'blocks-playscreen--running'))
    test('RunningNoImage', playScreen('RunningNoImage', 'blocks-playscreen--running-no-image'))
    test('Paused', playScreen('Paused', 'blocks-playscreen--paused'))
    test('RepsMode (play: Complete)', playScreen('RepsMode', 'blocks-playscreen--reps-mode'))
    test('AddTime', playScreen('AddTime', 'blocks-playscreen--add-time'))
  })

  describe('PlayScreenSplit', () => {
    test('Running (play: Pause)', playScreenSplit('Running', 'blocks-playscreensplit--running'))
    test('RunningNoImage', playScreenSplit('RunningNoImage', 'blocks-playscreensplit--running-no-image'))
    test('FuturisticProgress', playScreenSplit('FuturisticProgress', 'blocks-playscreensplit--futuristic-progress'))
    test('SegmentedProgress', playScreenSplit('SegmentedProgress', 'blocks-playscreensplit--segmented-progress'))
  })

  describe('WorkoutComplete (WB-4)', () => {
    test('Default (play: Play Again/Back Home)', workoutComplete('Default', 'blocks-workoutcomplete--default'))
    test('CustomTitle', workoutComplete('CustomTitle', 'blocks-workoutcomplete--custom-title'))
  })
})
