import { describe, expect, it } from 'vitest'

import { moduleDepthOf } from '../../../utils/module-depth.util.js'

describe('moduleDepthOf', () => {
  it('reads the module at the root of the sources when nothing holds it', () => {
    expect(moduleDepthOf(['activities', 'services'], [])).toBe(1)
  })

  it('reads the module one segment in when a container holds it', () => {
    expect(moduleDepthOf(['features', 'devices', 'hooks'], ['features', 'libs'])).toBe(2)
  })

  it('reads a container that is not named as a module of its own', () => {
    expect(moduleDepthOf(['components', 'layout'], ['features', 'libs'])).toBe(1)
  })

  it('reads a container inside a module, which is how a client is organised by domain', () => {
    expect(moduleDepthOf(['libs', 'api', 'modules', 'packages', 'keys'], ['features', 'libs', 'modules'])).toBe(4)
  })

  it('stops at the container that names no module, so the layer is never eaten', () => {
    expect(moduleDepthOf(['libs', 'modules'], ['features', 'libs', 'modules'])).toBe(2)
  })

  it('reads a file at the root of the sources', () => {
    expect(moduleDepthOf(['features'], ['features', 'libs'])).toBe(1)
  })
})
