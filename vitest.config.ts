import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    maxWorkers: 2,
    // ponytail: the a11y compose test needs a real chromium browser
    // (play + axe). Running it under jsdom fails with SB_PREVIEW_API_0014.
    // It is covered by its own browser-project config (vitest.browser.config.ts)
    // instead of the unit suite.
    exclude: [
      'src/components/ui/__tests__/ui-primitives.a11y.test.ts',
      '**/node_modules/**',
      '**/dist/**',
    ],
  },
})
