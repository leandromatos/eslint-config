import type { StrictOptions } from './strict.config.type.js'

/** What a Next.js project says to the `nextjs` tier on top of its defaults. */
export interface NextjsOptions extends StrictOptions {
  /**
   * Whether the project keeps a Storybook catalog under `storybook/`, which the application never imports. Defaults
   * to true; false drops the entry that keeps the catalog out of the application.
   */
  catalog?: boolean
}
