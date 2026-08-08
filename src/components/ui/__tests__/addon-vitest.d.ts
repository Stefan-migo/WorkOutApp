// Minimal ambient types for @storybook/addon-vitest internal test utils
// (pinned at apply, DD-5). The addon ships this module without .d.ts.
declare module '@storybook/addon-vitest/internal/test-utils' {
  export interface StoryTestConfig {
    exportName: string
    story: unknown
    meta: unknown
    skipTags: string[]
    storyId: string
    componentPath?: string
    componentName?: string
  }
  export function testStory(
    config: StoryTestConfig,
  ): (context: unknown) => Promise<void>
}
