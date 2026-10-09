import { describe, expect, it } from 'vitest'

import { countModuleDepth } from '../../../utils/count-module-depth.util.js'

describe('countModuleDepth', () => {
  it('reads the module at the root of the sources when nothing holds it', () => {
    expect(countModuleDepth(['activities', 'services'], [])).toBe(1)
  })

  it('reads the module one segment in when a container holds it', () => {
    expect(countModuleDepth(['features', 'devices', 'hooks'], ['features', 'libs'])).toBe(2)
  })

  it('reads a container that is not named as a module of its own', () => {
    expect(countModuleDepth(['components', 'layout'], ['features', 'libs'])).toBe(1)
  })

  it('reads a container inside a module, which is how a client is organized by domain', () => {
    expect(countModuleDepth(['libs', 'api', 'modules', 'packages', 'keys'], ['features', 'libs', 'modules'])).toBe(4)
  })

  it('stops at the container that names no module, so the layer is never eaten', () => {
    expect(countModuleDepth(['libs', 'modules'], ['features', 'libs', 'modules'])).toBe(2)
  })

  it('reads a file at the root of the sources', () => {
    expect(countModuleDepth(['features'], ['features', 'libs'])).toBe(1)
  })
})
