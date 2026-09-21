import type { RootDto } from '../../root.dto.js'

export const createFromRoot = (rootDto: RootDto): string => rootDto.name
