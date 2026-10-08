import type { CreateUserDto } from '../dtos/create-user.dto.js'

export const createUserFromDto = (createUserDto: CreateUserDto): string => createUserDto.name
