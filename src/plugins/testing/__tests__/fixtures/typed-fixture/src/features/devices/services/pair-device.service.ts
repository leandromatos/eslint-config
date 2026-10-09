import type { PairDeviceDto } from '../dtos/pair-device.dto.js'

export const pairDeviceFromDto = (pairDeviceDto: PairDeviceDto): string => pairDeviceDto.name
