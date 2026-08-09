import { describe, expect, test } from 'vitest'
import { testStory } from '@storybook/addon-vitest/internal/test-utils'
import * as ButtonStories from '../Button.stories'
import * as IconButtonStories from '../IconButton.stories'
import * as CardStories from '../Card.stories'
import * as BadgeStories from '../Badge.stories'

// DD-5: one browser-project test composing all slice stories. Runs play
// functions (via the addon's testStory) and asserts axe violations empty
// per story (UIP-7). Extended in slices 2b–2d.
// Runs only under `--project storybook` (chromium) via
// STORYBOOK_COMPONENT_PATHS in vitest.config.ts. The a11y addon's automatic
// afterEach is disabled in ghost-stories mode (component-paths runs), so axe
// is asserted explicitly here with the same context the addon uses.

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

const button = (exportName: string, storyId: string) =>
  storyCase({
    exportName,
    story: ButtonStories[exportName as keyof typeof ButtonStories],
    meta: ButtonStories.default,
    skipTags: [],
    storyId,
    componentPath: 'Button.tsx',
    componentName: 'Button',
  })

const iconButton = (exportName: string, storyId: string) =>
  storyCase({
    exportName,
    story: IconButtonStories[exportName as keyof typeof IconButtonStories],
    meta: IconButtonStories.default,
    skipTags: [],
    storyId,
    componentPath: 'IconButton.tsx',
    componentName: 'IconButton',
  })

const card = (exportName: string, storyId: string) =>
  storyCase({
    exportName,
    story: CardStories[exportName as keyof typeof CardStories],
    meta: CardStories.default,
    skipTags: [],
    storyId,
    componentPath: 'Card.tsx',
    componentName: 'Card',
  })

const badge = (exportName: string, storyId: string) =>
  storyCase({
    exportName,
    story: BadgeStories[exportName as keyof typeof BadgeStories],
    meta: BadgeStories.default,
    skipTags: [],
    storyId,
    componentPath: 'Badge.tsx',
    componentName: 'Badge',
  })

describe('UI primitives a11y (DD-5)', () => {
  describe('Button (UIP-2)', () => {
    test('Primary', button('Primary', 'ui-button--primary'))
    test('Ghost', button('Ghost', 'ui-button--ghost'))
    test('Outline', button('Outline', 'ui-button--outline'))
    test('Danger', button('Danger', 'ui-button--danger'))
    test('Sizes (play: click spy)', button('Sizes', 'ui-button--sizes'))
    test('Pill', button('Pill', 'ui-button--pill'))
    test('ElevatedFab', button('ElevatedFab', 'ui-button--elevated-fab'))
    test('Disabled', button('Disabled', 'ui-button--disabled'))
  })

  describe('IconButton (UIP-2)', () => {
    test('Primary', iconButton('Primary', 'ui-iconbutton--primary'))
    test('Ghost', iconButton('Ghost', 'ui-iconbutton--ghost'))
    test('Outline', iconButton('Outline', 'ui-iconbutton--outline'))
    test('Danger', iconButton('Danger', 'ui-iconbutton--danger'))
  })

  describe('Card (UIP-3)', () => {
    test('Default', card('Default', 'ui-card--default'))
    test('Raised', card('Raised', 'ui-card--raised'))
    test('Inset', card('Inset', 'ui-card--inset'))
    test('Interactive (play: click spy)', card('Interactive', 'ui-card--interactive'))
  })

  describe('Badge (UIP-3)', () => {
    test('Neutral', badge('Neutral', 'ui-badge--neutral'))
    test('Primary', badge('Primary', 'ui-badge--primary'))
    test('Success', badge('Success', 'ui-badge--success'))
    test('Warn', badge('Warn', 'ui-badge--warn'))
    test('Danger', badge('Danger', 'ui-badge--danger'))
    test('SegmentPrepare', badge('SegmentPrepare', 'ui-badge--segment-prepare'))
    test('SegmentWork', badge('SegmentWork', 'ui-badge--segment-work'))
    test('SegmentRest', badge('SegmentRest', 'ui-badge--segment-rest'))
    test('SegmentCooldown', badge('SegmentCooldown', 'ui-badge--segment-cooldown'))
  })
})

