/**
 * How many segments the module name takes, before the layer begins.
 *
 * A tree of one kind puts a module at the root of the sources, so `activities/services` is the module `activities`
 * and the layer `services`. A tree of another kind groups its modules under a container, so `features/devices` is
 * the module `devices` and the layer starts one segment later. Naming the containers is what tells the two apart.
 *
 * A container may sit inside a module, which is how a client is organised by the domain it calls:
 * `libs/api/modules/packages/keys` is the module `api`, the module `packages` inside it, and the layer `keys`.
 * Each container consumes itself and the module it names, so the layer is whatever the last one leaves.
 *
 * @param segments - The directories between the source root and the file.
 * @param moduleContainers - The directories that hold modules rather than layers.
 * @returns The number of leading segments the module name occupies.
 */
export const moduleDepthOf = (segments: string[], moduleContainers: string[]): number => {
  let depth = 0
  while (depth < segments.length - 1 && moduleContainers.includes(String(segments[depth]))) depth += 2

  return depth === 0 ? 1 : depth
}
