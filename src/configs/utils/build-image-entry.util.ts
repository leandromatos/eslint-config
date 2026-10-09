import jsxA11y from 'eslint-plugin-jsx-a11y'

import type { Config } from '../types/index.js'

/**
 * Builds the entry that asks the image component of a React framework for its alternative text, as an `<img>` is. It
 * names the plugin itself, since its files reach past the JSX files the plugin is declared for.
 *
 * @param files - The files the rule judges.
 * @param imageComponents - The components that render an image.
 * @returns The configuration entry.
 */
export const buildImageEntry = (files: string[], imageComponents: string[]): Config => {
  const imageEntry: Config = {
    name: 'leandromatos/image-alt-text',
    files,
    plugins: { 'jsx-a11y': jsxA11y },
    rules: { 'jsx-a11y/alt-text': ['warn', { elements: ['img'], img: imageComponents }] },
  }

  return imageEntry
}
