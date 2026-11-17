import { REACT_FOLDER } from '../constants/nextjs.constant.js'
import { SOURCE_ROOTS } from '../constants/sources.constant.js'
import type { Config } from '../types/recommended.config.type.js'

/**
 * Builds the entry that lets a route file re-export. The router reads each file of its directory by its path, and a
 * route passes on what the router asks for, such as `export { ErrorBoundary } from 'expo-router'`. So a route
 * re-exports by design, and no import reaches it as a barrel.
 *
 * @returns The configuration entry.
 */
export const buildRouteEntry = (): Config => {
  const routeEntry: Config = {
    name: 'leandromatos/react-routes',
    files: SOURCE_ROOTS.map(root => `${root}/${REACT_FOLDER.router}/**/*.{ts,tsx}`),
    rules: { 'leandromatos/architecture-re-export-only-at-entrypoint': 'off' },
  }

  return routeEntry
}
