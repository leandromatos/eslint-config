import { defineConfig } from 'vitest/config'

/**
 * @type {import('vitest/config').UserConfig}
 */
export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    // A fixture tree holds files a rule lints, and a spec of that tree is what a rule reads rather than what runs.
    exclude: ['src/**/__tests__/fixtures/**'],
    setupFiles: ['src/__tests__/vitest.setup.ts'],
    /*
     * The default reporter, not the verbose one: a rule tester names each case after the code it lints, so `verbose`
     * prints every fixture in full and buries the result under two hundred snippets. The threshold is raised for the
     * same reason: a typed rule tester boots a TypeScript program on its first case, which the default 300ms reads as
     * slow and expands into the tree of names.
     */
    reporters: ['default'],
    slowTestThreshold: 5000,
    coverage: {
      /*
       * What carries logic. A barrel re-exports, a type declares, a constant is a value, and a fixture exists to be
       * linted: none of them can be covered, and counting them turns the number into noise.
       */
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/index.ts',
        'src/**/*.type.ts',
        'src/**/*.constant.ts',
        'src/**/__tests__/**',
        'src/plugins/*/docs/**',
      ],
      /*
       * The table, not the summary: what a coverage run is read for is which lines are missing, and `text` is where
       * that column is. The excludes above are what keeps it short enough to read.
       */
      reporter: ['text', 'html'],
      /*
       * Whole, and nothing below it. What a branch the suite cannot reach carries instead is a `v8 ignore` that says
       * why it cannot happen — a reason a reader can check — rather than a number that quietly drops.
       */
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
})
