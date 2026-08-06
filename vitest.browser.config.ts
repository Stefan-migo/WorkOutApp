import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

import { playwright } from '@vitest/browser-playwright'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Browser-project a11y checks (DD-5 / D10): runs the UI primitives stories
// in real chromium via playwright, executes play functions and asserts axe
// violations are empty. Run explicitly with:
//   npx vitest run --config vitest.browser.config.ts
// Not part of the default unit suite (jsdom cannot run play/axe).
process.env.STORYBOOK_COMPONENT_PATHS = 'src/components/ui/__tests__/ui-primitives.a11y.test.ts'

export default defineConfig({
  plugins: [
    storybookTest({ configDir: path.join(dirname, '.storybook') }),
  ],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({}),
      instances: [{ browser: 'chromium' }],
      // ponytail: 63315 sits in a Hyper-V excluded port range on this machine
      api: { port: 6100 },
    },
    maxWorkers: 1,
  },
})
